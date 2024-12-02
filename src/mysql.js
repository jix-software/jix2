/*
 * mysql.js
 *
 * Copyright (C) Henri Lesourd 2020.
 *
 *  This file is part of JIX.
 *
 *  JIX is free software: you can redistribute it and/or modify it under
 *  the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JIX is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with JIX.  If not, see <http://www.gnu.org/licenses/>.
 */

// Mysql
var _mysql;
if (SERVER) _mysql=require('mysql');

type(async function(URL,USER,PASS,DB,LOG) {
       if (isUndefined(URL) || isUndefined(USER) || isUndefined(PASS) || isUndefined(DB)) error("mysql");
       var RES=mysql.create({ ADDR:URL, USER:USER, PASS:PASS, DB:DB });
       RES.IDCONT=container.LASTIDCONT++; // FIXME: should not be here, must be somewhere in container's cons
       RES.NAME=DB;
       RES.CON=_mysql.createPool({
                        host:URL, user:USER, password:PASS, database:DB,
                        multipleStatements: True
                      });
       RES.LOG=isNumber(LOG) || isString(LOG)?Number(LOG):isTrue(LOG)?1:0;
       await RES.types();
       return RES;
     },
     { NAME:"mysql", PARENT:container,
       ATTRS:["ADDR=''","CON=Nil",
              "USER=''","PASS=''",
              "DB","TYPES={}","LOG=False"] });

origin.isMysql=function (O) {
  return isa(O,mysql);
}

mysql.setMethod("close",function () {
  this.CON.end();
});

// Queries
mysql.setMethod("escape",function (S) {
  S=this.CON.escape(S);
  if (S[0]=="'") S=substring(S,1,length(S)-1);
  return S;
});
mysql.setMethod("sql",async function (SQL) {
  var THIS=this;
  return new Promise((RETURN,REJECT) => {
    this.CON.getConnection(function (ERR,CON) {
      if (ERR) REJECT(ERR);
      else {
        if (THIS.LOG) console.log("mysql::sql ==> ",SQL);
        CON.query(SQL,function (ERR,RES) {
          if (ERR) REJECT(ERR);
          else {
            CON.release();
            RETURN(RES);
          }
        });
      }
    });
  });
});

// Databases (to be continued ...)
mysql.setMethod("databases",async function () { // TODO: add CREATE DATABASE
  var L=await this.sql("SHOW DATABASES;"),RES=[];
  for (var DB of L) {
    var N=Object.getOwnPropertyNames(DB)[0];
    RES.push(DB[N]);
  }
  return RES;
});

// Tables
mysql.setMethod("prettyType",async function (T) {
  if (isType(T)) {
    var SK={ "type":{ "short":{  "NAME":["av",""],
                                "ATTRS":["avi",""],
                                 "KEYA":["av",""]
                              }
                    },
             "addr":{ "short":{   "NAME":["av",""],
                                  "TYPE":["av",""],
                                "QUALIF":["av",""]
                              }
                    },
                "*":{ "short":{   "+o":["av",""],
                                "NAME":["av",""] }
                    }
           };
    out(pretty(T,"short",SK)); //console.log(T); 
  }
  else {
    out(T[0]),outIndentInc(+2);
    for (var I=1;I<length(T[1]);I++) {
      crIndent();
      out((T[1][I][2]?"1":"0")+" "+T[1][I][0]+" "+T[1][I][1]);
    }
    outIndentInc(-2);
  }
});
mysql.UNKNOWNT={};
mysql.setMethod("fetchType",async function (NAME) {
  function jixt(T) {
    if (startsWith(T,"bit")) return "num";
    if (startsWith(T,"int")) return "num";
    if (startsWith(T,"tinyint")) return "num";
    if (startsWith(T,"smallint")) return "num";
    if (startsWith(T,"bigint")) return "num";
    if (startsWith(T,"decimal")) return "num";
    if (startsWith(T,"text")) return "str";
    if (startsWith(T,"mediumtext")) return "str";
    if (startsWith(T,"char")) return "str";
    if (startsWith(T,"varchar")) return "str";
    if (startsWith(T,"enum")) return "str";
    if (startsWith(T,"set")) return "str";
    if (startsWith(T,"time")) return "date";
    if (startsWith(T,"date")) return "date"; // Is this one right ?
    if (startsWith(T,"datetime")) return "date";
    if (startsWith(T,"timestamp")) return "date";
    mysql.UNKNOWNT[T]=T;
    return "unknown";
  }
  var TYPE=await this.sql("SHOW COLUMNS FROM "+NAME+";"),RES=[];
  for (var D of TYPE) {
    var T=jixt(D.Type);
    RES.push([D.Field,T,D.Key=="PRI" && D.Extra=="auto_increment",D.Type]);
  }
  return RES;
});
mysql.setMethod("types",function () {
  var THIS=this; // F%&K YOU !!!
  function compt(NAME,SLOT) {
    var ATTRS=[],NK=0,KEYA;
    for (var A of SLOT) {
      if (A[2]) NK++,KEYA=A[0];
      ATTRS.push((A[2]?"k ":"")+A[0]+":"+(A[1]=="unknown"?"obj":A[1]));
    }
    var TY=type(Nil,{ NAME:"mysql."+THIS.DB+"."+NAME, ATTRS:ATTRS, KEYA:NK==1?KEYA:Nil });
    for (var S of SLOT) {
      var A=TY.attr(S[0]);
      if (!A) error("compt");
      A.DESCR=(S[1]=="unknown"?"?":"")+S[3];
    }
    return TY;
  }
  if (length(this.TYPES)==0) return (async function () {
    var TABLES=await THIS.sql("SHOW TABLES;");
    for (var T of TABLES) {
      var N=Object.getOwnPropertyNames(T)[0],
          TY=compt(T[N],await THIS.fetchType(T[N]));
      THIS.TYPES[T[N]]=TY;
    }
    return THIS.TYPES;
  })();
  else return this.TYPES;
});

// Types
mysql.setMethod("type",function (TYPE) {
  var RES;
  if (isType(TYPE)) {
    var TY=this.TYPES[TYPE.name(1)];
    if (isDefined(TY)) {
      RES=TY; //if (RES!=TY) error("write::ty"); TODO: should match type signatures, not only test for eq()
    }
    else TYPE=TYPE.name(1);
  }
  if (!RES) {
    if (!isString(TYPE)) error("mysql::type(1)");
    RES=this.TYPES[TYPE];
    if (isUndefined(RES)) error("mysql::type(2) => ",TYPE); // Should become an option, not the default
  }
//if (isNil(RES.KEYA)) error("mysql::type(3)"); TODO: see what to do with this
  return RES;
});
mysql.setMethod("typeAdd",async function (TYPE) {
  if (isDefined(this.TYPES[TYPE.NAME])) return;
  function sqlt(T) {
    if (T==num) return "int";
    if (T==str || T==obj/*hmmm*/) return "varchar(256)";
    if (T==date) return "datetime";
    error("sqlt "+T.NAME);
  }
  function dflt(T) {
    if (T==num) return "0";
    if (T==str || T==obj/*hmmm*/) return "''";
    if (T==date) return Nil;
    error("dflt");
  }
  if (isNil(TYPE.KEYA)) error("mysql::typeAdd");
  var SQL="CREATE TABLE "+TYPE.name(1)+" (",
      ATTRS=TYPE.attrs(),FIRST=True;
  for (A of ATTRS) {
    SQL+=(FIRST?"":",")+"\n  "+
         A.NAME+" "+
         sqlt(A.TYPE);
    FIRST=False;
    if (A.NAME==TYPE.KEYA) {
      SQL+=" NOT NULL"+(A.TYPE==num?" AUTO_INCREMENT":"")+" PRIMARY KEY";
    }
    else {
      var VAL0=dflt(A.TYPE);
      SQL+=(VAL0?" DEFAULT "+VAL0:"")
    }
  }
  SQL+="\n);";
  await this.sql(SQL);
  this.TYPES[TYPE.NAME]=TYPE;
});

// Reads
mysql.setMethod("sqlv",function (TY,A,V) { // FIXME^2: fucks up the values for dates, buffers, putting the right defaults for null and the like
  function n2(I) {
    return (I<=9?"0":"")+I;
  }
  function sqlvd(UTS,TYA0) {
    if (TYA0!="date" && TYA0!="datetime") error("sqlvd");
    var D=new Date(UTS),
        RES=D.getFullYear()+"-"+n2(D.getMonth()+1)+"-"+n2(D.getDate());
    if (TYA0=="datetime") RES+=" "+n2(D.getHours())+":"
                                  +n2(D.getMinutes())+":"+n2(D.getSeconds());
    return (TYA0=="date"?"DATE":"TIMESTAMP")+"'"+RES+"'";
  }
  var TYA0=TY.attr(A),TYA=TYA0.TYPE/*Hmm, do that better perhaps ...*/;
  if (isNil(V)) V=""; // FIXME: hmmm ...
  if (TYA==str) return "'"+this.escape(V)+"'";
  if (TYA==num) {
    if (isBoolean(V)) V=V?"1":"0";
    if (TYA0.DESCR=="bit(1)"/*FIXME: be sure the syntax doesn't change*/) return "B'"+V.toString("hex")+"'"; // FIXME: partial fix, here
    if (isa0(V,Buffer)) return "'"+V.toString("hex")+"'"; // FIXME: hmmm ...
    V=V.toString();
    if (V=="") V="0"; // FIXME: hmmm ...
    if (contains(V,"%")) V="'"+V+"'"; // Allowing LIKE '%xyz' ; hmm ...
    else
    if (strNumberLength(V,0)!=length(V)) error("mysql::sqlv::not a num => "+V);
    return V;
  }
  if (TYA==date) {
    if (isDate(V)) V=V.getTime();
    else
    if (isNumber(V)) ;
    else
    if (V==""/*FIXME: shit*/ || isString(V) && V=="\u00d8"/*FIXME: shit(2)*/) return "null";
    else
    if (isString(V)) {
      if (strNumberLength(V,0)==length(V)) V=num(V);
      else
    /*if (strDateLength(V,0)==length(V))*/ V=new Date(V); // TODO: implement strDateLength()
    /*else
      console.log(typeOf(V).name(),V),error("sqlv::date");*/
    }
    return sqlvd(V,TYA0.DESCR); //"'"+V.toString()+"'"; // FIXME: handle negative dates
  }
  error("mysql::sqlv");
});
mysql.setMethod("read",async function (Q,RAW) {
  var TY,THIS=this;
  if (isString(Q)) TY=this.type(Q)
  else
  if (typeOf(Q)==container.query) TY=this.type(Q.QUERY[""]);
                             else error("mysql::read(1)");
  if (!RAW) RAW=isDefined(Q.QUERY["#raw"]);
  var TYNAME=TY.name(1),
      COLS=Q.QUERY[":"],
      SQL="SELECT "+(isString(COLS)?COLS:"*")+" FROM "+TYNAME;
  function cond(VAR,VAL) {
    var EQ="=";
    if (isString(VAL)) {
      var HASOP=(VAL[0]=="<" || VAL[0]==">" || VAL[0]=="="); // TODO: ajouter !=
      if (HASOP) {
        var EQ=VAL[0];
        if (VAL[1]=="=") EQ+=VAL[1];
        var V=substring(VAL,length(EQ),length(VAL));
        if (strNumberLength(V,0)!=length(V)) HASOP=0,EQ="=";
        else {
          VAL=V;
          if (EQ=="==") EQ="=";
        }
      }
      if (!HASOP && contains(VAL,"*")) {
        VAL=replaceAll(VAL,"*","%");
        EQ=" LIKE ";
      }
    }
    var RES=VAR+EQ+THIS.sqlv(TY,VAR,VAL);
    return RES;
  }
  var COND="",FIRST=1;
  for (var VAR in Q.QUERY) if (VAR!="" && !contains([":","#"],VAR[0])) {
    var VAL=Q.QUERY[VAR],ICOND="";
    if (isString(VAL) && VAL[0]=="$") ; // TODO: handle vars (joins)
                                 else ICOND=cond(VAR,VAL);
    COND+=(ICOND==""?"":" "+(FIRST?"":"AND "))+ICOND;
    if (ICOND!="") FIRST=0;
  }
  SQL+=(COND==""?"":" WHERE"+COND)+";";
//console.log("========>(SQL)["+RAW+"]",SQL);
  var RES=await this.sql(SQL);
  if (!RAW) RES=RES.map(function (REC) {
    if (THIS.LOG==2) console.log("mysql::read ==> ",REC);
    var O=TY(REC);
    if (isNil(TY.KEYA)) error("mysql::read[no key] ==> ",TYNAME);
    var ID=(TYNAME+"#")/*NOTE: need global ids but hsss ...*/+O[TY.KEYA],
        O0=THIS.getById(ID);
    if (O0) O=O0; // TODO: see if we shouldn't diff O0 and O
       else THIS.store(O,ID);
    return O;
  });
  return RES;
});

// Writes
mysql.setMethod("write",async function (L) {
  var THIS=this;
  function ty(O) { // TODO: remove this function asap
    var TYPE=O[""];
    if (isUndefined(TYPE)) TYPE=typeOf(O);
    return THIS.type(TYPE);
  }
  var TODO={},TYPE={};
  for (var O of L) {
    var TY=ty(O),TY0,TYNAME=TY.name(1);
    if (isUndefined(TODO[TYNAME])) TODO[TYNAME]=[];
    TY0=TYPE[TYNAME];
    if (isUndefined(TY0)) TYPE[TYNAME]=TY;
                     else if (TY0!=TY) error("write(1)");
    TODO[TYNAME].push(O);
  }
  function fields(O,TYPE) {
    var L=TYPE.attrs().map(function (A) { return A.NAME; }),RES=[];
    for (var N of O.keys()) if (contains(L,N)) RES.push(N);
    return RES;
  }
  var SQLA={ ADD:"", MAJ:"" },
      SQLAO={ ADD:[], MAJ:[] };
  for (var TAB in TODO) for (var O of TODO[TAB]) {
    var F=fields(O,TYPE[TAB]).filter(function (A) { // FIXME: temporary ignoring of complicated datatypes
                                       var NTYA=TYPE[TAB].attr(A).DESCR;
                                       return 1;//!startsWith(NTYA,"date");// && !startsWith(NTYA,"bit"/*FIXME: it's the JavaScript type, here ; SQL bits are casted to num, while the values are Buffers ; need to read the actual SQL type to know that we must use the syntax << B'b1b2b3 ...' >> to assign bitstring values in an SQL update*/);
                                    }),
        V=F.map(function (A) { return THIS.sqlv(TYPE[TAB],A,O[A]); }),
        OD=F.map(function (A) { return A+"=VALUES("+A+")"; });
    var IDCOL=TYPE[TAB].KEYA;
    if (isNil(IDCOL)) error("write(2)");
    var SQL="INSERT INTO "+TAB+" ("+unsplit(F,",")+") VALUES ("+unsplit(V,",")+")";
    if (isDefined(O[IDCOL])) {
      SQL+=" ON DUPLICATE KEY UPDATE "+unsplit(OD,",");
    }
    SQL+=";\n";
    if (isDefined(O[IDCOL])) {
      SQLA.MAJ+=SQL;
      SQLAO.MAJ.push([IDCOL,O]);
    }
    else {
      SQLA.ADD+=SQL;
      SQLAO.ADD.push([IDCOL,O]);
    }
  }
  SQLA="SET autocommit=0;\nSTART TRANSACTION;\n"+SQLA.MAJ+SQLA.ADD+"COMMIT;\nSET autocommit=1;\n";
  console.log("===>(SQLA)",SQLA);
  return;
  var RES=await this.sql(SQLA),IDS=[];
  for (var R of RES) if (R.affectedRows>0) IDS.push(R.insertId); // TODO: Hmmm ... check that thoroughly.
  var NMAJ=length(SQLAO.MAJ),
      NADD=length(SQLAO.ADD);
  if (length(IDS)!=NMAJ+NADD) error("write(3)");
  for (var I=NMAJ;I<NMAJ+NADD;I++) {
    var REC=SQLAO.ADD[I-NMAJ];
    REC[1][REC[0]]=IDS[I];
  }
});
