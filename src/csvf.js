/*
 * csvf.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019, 2020.
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

// CSV (raw)
function csvRawCheck(L) {
  if (!isArray(L)) return False;
  if (length(L)>0) {
    if (!isArray(L[0]) || length(L)==0) return False;
    var N=length(L[0]);
    for (var E of L) {
      if (!isArray(E) || length(E)!=N) return False;
      for (var S of E) if (!isString(S)) return False;
    }
  }
  return True;
}
function csvRawTrim(L) {
  function nempty(A) {
    var N=0;
    for (var I=length(A)-1;I>=0;I--) {
      if (trim(A[I])=="") N++;
                     else break;;
    }
    return N;
  }
  var N0=length(L[0]),
      N=nempty(L[0]);
  for (var I in L) {
    splice(L[I],N0-N,N,[]);
  }
  return L;
}
function csvParseRaw(S,TRIMQ) {
  function trimq(S) {
    if (TRIMQ) {
      S=S.toString();
      if (S[0]=='"') S=substring(S,1,length(S)-1);
    }
    return S;
  }
  csvparsefStart();
  var L=tokenize(S,1);
  var RES=[],LI=[],
      FIRST=True,VALPOS=True,
      N=length(L);
  for (var I=0;I<N;I++) {
    S=L[I];
    if (strIsBlank(S) && contains(S,"\n")) {
      if (!FIRST) {
        if (VALPOS) LI.push("");
        RES.push(LI),LI=[],FIRST=VALPOS=True;
      }
      continue;
    }
    FIRST=False;
    if (S==",") {
      if (VALPOS) LI.push(""); else VALPOS=True;
    }
    else {
      if (VALPOS) LI.push(trimq(S)),VALPOS=False;
             else if (empty(LI)) error("csvParseRaw(1)");
                            else LI[length(LI)-1]+=S;
    }
  }
  if (!empty(LI)) RES.push(LI);
  csvRawTrim(RES);
  if (!csvRawCheck(RES)) error("csvParseRaw(2)");
  return RES;
}
origin.csvLoadRaw=function (FNAME,TRIMQ) {
  var S=fileRead(FNAME);
  return csvParseRaw(S,TRIMQ);
}

origin.csvparsefStart=function () {
  charsInit(1);
  charnatSet("'",CharNatAlf);
  charnatSet(",",CharNatOmg);
  tokenizeStart(",");
  tokenizeSetFlags(0,Undefined,1,0);
}

// CSV (headers)
var csvh=type(function (L,DESCR) { // TODO: in appropriate cases, compile or fetch TYPE
                function proto(L) {
                  var P=["",[]];
                  if (!isArray(L) || isNil(L[0])) error("csvh.proto");
                  var A=splitTrim(L[0],"||");
                  if (length(A)!=2) error("csvh.proto(2)");
                  P[0]=A[0];
                  L[0]=A[1];
                  for (var I=0;I<length(L);I++) {
                    A=splitTrim(L[I],":");
                    var SLOT;
                    if (length(A)==1) SLOT=[A[0],"str"];
                    else
                    if (length(A)==2) SLOT=[A[0],A[1]];
                                 else error("csvh.proto(3)");
                    P[1].push(SLOT);
                  }
                  return P;
                }
                function atrim(A) {
                  return A.map(function (S) {
                    if (isString(S)) S=trim(S);
                    return S;
                  });
                }
                if (!csvRawCheck(L) || length(L)<=0) error("csvh(1)");
                var CSVH=csvh.create();
                var P=["",[]],ISFULL=contains(L[0][0],"||");
                if (ISFULL) P=proto(L[0]);
                CSVH.NAME=P[0];
                CSVH.TYPE=P[1];
                if (ISFULL) {
                  if (length(L)>1) {
                    for (var I=1;I<length(L);I++) {
                      var LANG;
                      if (contains(L[I][0],"||")) {
                        var A=splitTrim(L[I][0],"||");
                        LANG=A[0];
                        if (!mlstr.isLang(LANG) || length(A)!=2) error("csvh(2)");
                        L[I][0]=A[1];
                      }
                      else LANG="*";
                      if (isDefined(CSVH.TITLES[LANG])) error("csvh(3)");
                      CSVH.TITLES[LANG]=atrim(L[I]); // TODO: check titles are plain alphanumeric strings
                    }
                  }
                }
                else {
                  CSVH.TITLES["*"]=atrim(L[0]);
                  if (length(L)!=1) error("csvh(4)");
                }
                var RES;
                if (DESCR) RES=CSVH;
                      else RES=csvh.find(CSVH);
                if (RES==Nil) {
                  if (!ISFULL) error("csvh: "+pretty(CSVH.TITLES["*"])+" not found");
                  RES=CSVH;
                  csvh.$.push(RES);
                }
                return RES;
              },
              { "NAME":"csvh", "PARENT":obj,
                "ATTRS":["NAME=''",
                         "TYPE=Nil",
                         "TITLES={}"]
              });

csvh.$=[];
setprop(csvh,"find",function (L) { // FIXME: really, unify all these kinds of functions in only one
  if (!isCsvh(L)) L=csvh(L,1);
  var RES=Nil;
  for (var CSVH of csvh.$) if (CSVH.match(L)) RES=CSVH;
  return RES;
});
csvh.setMethod("match",function (L) {
  if (!isCsvh(L)) L=csvh(L,1);
  if (L.NAME!="" && this.NAME!=L.NAME) return False;
  function matcht(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I][0]!=L2[I][0] || L1[I][1]!=L2[I][1]) return False;
    return True;
  }
  function matchtit(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I]!=L2[I]) return False;
    return True;
  }
  if (length(L.TYPE)!=0) {
  //if (length(L.TITLES)!=0) error("csvh.match(1)");
    if (matcht(this.TYPE,L.TYPE)) return True;
  }
  else {
    var LT=L.TITLES["*"];
    if (length(L.TITLES)!=1 || isUndefined(LT)) error("csvh.match(2)");
    for (var LANG in this.TITLES) {
      if (matchtit(this.TITLES[LANG],LT)) return True;
    }
  }
  return False;
});

function isCsvh(O) {
  return isa(O,csvh);
}

setprop(csvh,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME,1);
  return csvh(L);
});

// CSV
var csv=type(function (L) {
               RES=csv.create();
               if (!isArray(L) || isNil(L[0])) error("csv");
               RES.CSVH=L.shift();
               RES.$=L;
               return RES;
             },
             { "NAME":"csv", "PARENT":obj,
               "ATTRS":["CSVH=Nil",
                        "RAW=True",
                        "$=[]"]
             });

function isCsv(O) {
  return isa(O,csv);
}

setprop(csv,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME,1);
  L[0]=csvh([L[0]]);
  return csv(L);
});
csv.setMethod("toSexpr",function () {
  if (!this.RAW) error("csv.toSexpr");
  var CSVH=this.CSVH,L=this.$,
      ATTRS,
      RES=[["type",":NAME",CSVH.NAME,":PARENT","obj",":ATTRS",ATTRS=["array"]]];
  for (var I=0;I<length(CSVH.TYPE);I++) {
    var NAME=CSVH.TYPE[I][0];
    if (!contains(NAME,".")) {
      var TY=CSVH.TYPE[I][1],
          DECL=NAME;
      if (TY!="obj") DECL+=":"+TY;
      ATTRS.push(DECL);
    }
  }
  for (var I=0;I<length(L);I++) {
    var O=[CSVH.NAME];
    for (var J=0;J<length(CSVH.TYPE);J++) {
      var VAR=CSVH.TYPE[J][0];
      if (VAR[0]==sId) VAR=substring(VAR,1,length(VAR));
      O.push(":"+VAR),O.push(L[I][J]);
    }
    O.push(":+o"),O.push(I+1/*FIXME: buggy anyway, should take into account if objects already have an id ; plus the type's id in the container should be taken into account*/);
    RES.push(O);
  }
  return RES;
});
csv.setMethod("toDb",function () { // TODO: reunify this with toSexpr()
  return lsexprSerialize(this.toSexpr());
});

// Parsing
origin.csvparsef=function (S,CONT,TYPE) { // NOTE: keep TYPE (?)
  var L=csvParseRaw(S,1);
  L[0]=csvh([L[0]]);
  return parsef(csv(L).toSexpr(),CONT);
}

// Serializing
csv.serializeVal=function (O,TY) {
  if (isUndefined(O)) return "\u25cb";
  if (isNil(O)) return "\u00d8";
  if (isNumber(O)) return O.toString();
  if (isDate(O)) return "\u25f7"+(O.getTime()<1000000000000?"-0":O.getTime());
  if (isa0(O,Buffer)) return O.toString("hex");
  if (isString(O)) if (contains(O,",")) return '"'+O+'"';
                                   else return O;
  ; // TODO: TY=obj, *str, etc. put the ids of objects, proper unambiguous separators, etc.
  return "\u00bf\u03be?";
};
origin.csvserializef=function (L,FNAME) { // TODO: add appropriate FMT, like in serializef(), to flatten data in a CSV file
  startOutS(FNAME?2:0,FNAME);
  var TYPE=L[0],ATTRS=TYPE.attrs();
  for (var I=0;I<length(ATTRS);I++) {
    if (I>0) out(",");
        else out(TYPE.name(1)+"||");
    if (ATTRS[I].NAME==TYPE.KEYA) out(sId);
    out(ATTRS[I].NAME);
    var TY=ATTRS[I].TYPE,
        TYNAME=TY.name(1),
        Q=ATTRS[I].QUALIF;
    if (TY!=str || Q.has("*")) if (!TYNAME) error("serializef::type with no name");
                                       else out(":"+(Q.has("*")?"*":"")+TYNAME); // TODO: improve this
  }
  cr();
  for (var I=1;I<length(L);I++) {
    for (var J=0;J<length(ATTRS);J++) {
      if (J>0) out(",");
      var VAL=L[I][ATTRS[J].NAME];
      out(csv.serializeVal(VAL,ATTRS[J].TYPE));
    }
    cr();
    if (FNAME) L[I]=Undefined; // Enabling GC to free the already serialized elements in L ; TODO: make this option nonautomatic, it's not nice to silently destroy the input
  }
  var RES=getOutS();
  stopOutS();
  return RES.join("");
}
