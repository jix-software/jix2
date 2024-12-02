/*
 * channels.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019, 2020, 2021.
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

// Channels
type(function (PORT,SRV) {
       function create(CATEG) {
         var RES=channel.create();
         RES.ID=channel.LASTID++;
         RES.CATEG=CATEG;
         channel.$[RES.ID]=RES;
         return RES;
       }
       var RES;
       if (isNumber(PORT)) {
         RES=channel.getBy("PORT",PORT);
         if (RES==Nil) {
           RES=create("l"); // Local
           RES.ADDR="0.0.0.0";
           RES.PORT=PORT;
           if (isUndefined(SRV)) error("channel.cons(1)");
           RES.SRV=SRV;
         }
       }
       else {
         var URL=server.urlNormalize(PORT); // TODO: put this method at the right place
         if (!isString(URL)) error("channel.cons(2)");
         RES=create("r"); // Remote
         var URL0=urlParse(URL);
         RES.HREF=URL;
         RES.ADDR=URL0.hostname;
         RES.PORT=JSON.parse(URL0.port==""?"80":URL0.port);
         if (isDefined(SRV)) error("channel.cons(3)");
       }
       return RES;
     },
     { "NAME":"channel", "PARENT":obj,
       "ATTRS":["ID=0",
                "CATEG=''","PORT=0",
                "ADDR=''","HREF=''",
                "SRV=Nil"] });

channel.$=[];
channel.LASTID=0; // FIXME: implement classes that remember their instances, and let channel be one such class

setprop(channel,"getById",function (ID) {
  return channel.$[ID];
});
setprop(channel,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in channel.$) if (isDefined(channel.$[I])
                             && channel.$[I][NAME]==VAL) RES=channel.$[I];
  return RES;
});

origin.isChannel=function (O) {
  return isa(O,channel);
}
channel.setMethod("isLocal",function () {
  return this.CATEG=="l";
});
channel.setMethod("isRemote",function () {
  return this.CATEG=="r";
});

// Messages
channel.setMethod("msg",function (METHOD,PATH,TYIN,TYOUT,DATA) {
  function encin(TY) {
    var L=splitTrim(TY," ");
    if (length(L)>1) return L[1];
    if (startsWith(L[0],"image/")) return "binary";
    if (startsWith(L[0],"text/")) return "utf-8"; // TODO: add all other MIME types
    return "utf-8";
  }
  if (isNil(TYIN) || TYIN=="") TYIN="application/x-www-form-urlencoded";
  var REQ,RES=Nil,
      ENCIN=encin(TYIN),
      PROM;
  TYIN=splitTrim(TYIN," ")[0];
  if (isUndefined(METHOD)) METHOD="POST";
  if (isNil(TYOUT) || TYOUT=="") TYOUT="application/json";
  function rheader(CONN,ATTR) {
    if (SERVER) return CONN.headers[ATTR];
           else return CONN.getResponseHeader(ATTR);
  }
  function ret(CONN,RES) {
    var MIME=rheader(CONN,"content-type");
    if (startsWith(MIME,"text/") && !isString(RES)) RES=RES.toString(); // node buffers
    if (isString(RES)) RES=RES.trim();
    if (RES!=Nil && MIME=="application/json") RES=JSON.parse(RES);
    ; // Rescheduler l'ancien thread courant ; le remettre a Running
    return RES;
  }
  if (!this.isRemote()) error("channel.send(!remote)");
  var PAGE=PATH,PARMS="";
  if (PAGE=="") PAGE=Nil;
  if (PAGE) {
    if (contains(PAGE,"?")) {
      var L=splitTrim(PARMS,"?");
      PAGE=L[0];
      PARMS=isDefined(L[1])?L[1]:Nil;
    }
    if (PAGE[0]!="/") PAGE="/"+PAGE;
  }
  if (PAGE=="") PAGE=Nil;
  if (PARMS=="") PARMS=Nil;
  var URL=this.HREF+(PAGE?PAGE:"")+(PARMS?"?"+PARMS:"");
  if (SERVER) {
    var U=urlParse(URL),
        OPT={
          hostname: U.hostname,
          port: U.port,
          path: U.pathname,
          method: METHOD,
          headers: {
            "Content-Type": TYIN,
            'Accept': TYOUT
          }
       };
    PROM=new Promise((RETURN,REJECT) => {
      REQ=http.request(OPT,function (CONN) {
      //console.log(`STATUS: ${CONN.statusCode}`);
      //console.log(JSON.stringify(CONN.headers));
        CONN.on('data',function (ELT) {
          if (RES==Nil) RES=ELT;
                   else RES+=ELT;
        //console.log(`BODY: ${ELT}`);
        });
        CONN.on('end',function () {
        //console.log('No more data in response.');
        //console.log(RES.trim());
          RES=ret(CONN,RES);
        //console.log(RES);
        //console.log("---");
          RETURN(RES);
        });
      });
      REQ.on('error',function (E) {
        console.log(`problem with request: ${E.message}`);
        REJECT(E);
      });
      if (METHOD!="GET" && isDefined(DATA)) {
        if (METHOD!="PUT") DATA=JSON.stringify(DATA);
        REQ.write(DATA,ENCIN=="binary"?"binary":Undefined);
      }
      REQ.end();
    });
  }
  else {
    PROM=new Promise((RETURN,REJECT) => {
      if (METHOD!="GET" && isDefined(DATA)) {
        if (METHOD!="PUT") DATA=JSON.stringify(DATA);
      }
      else DATA=Nil;
      REQ=new XMLHttpRequest();
      REQ.open(METHOD,URL,True/*Always async*/);
      REQ.setRequestHeader("Content-Type",
                           TYIN+(isDefined(ENCIN)
                              && ENCIN!="binary"
                              && ENCIN!=""?"; charset="+ENCIN:""));
      if (ENCIN=="binary" && isString(DATA)) {
        var N=length(DATA),BUF=new Uint8Array(N);
        for (var I=0; I<N; I++) {
          BUF[I]=DATA.charCodeAt(I)&0xff;
        }
        DATA=BUF;
      }
      REQ.setRequestHeader("Accept",TYOUT);
      REQ.onreadystatechange=function() {
        if (REQ.readyState==4) {
          if (REQ.status==200) {
            RES=REQ.responseText;
            RES=ret(REQ,RES);
            RETURN(RES);
          }
          else {
            REJECT(REQ.status);
          }
        }
      }
      REQ.send(DATA);
    });
  }
  ; // mettre le thread courant a Waiting, et le descheduler (uniquement si on appelle msg() avec await, mais ca doit toujours etre le cas ; meme chose pour call(), elle doit toujours etre appellee avec await, sauf si la fonction appellee est une fonction synchrone)
  return PROM;
});

channel.setMethod("handler_msg",function (METHOD,PATH,TYIN,TYOUT,DATA,RET) { // TODO: call that "handler.msg"
  if (isSymbol(METHOD)) {
    this.SRV.call(METHOD,[PATH,TYIN,TYOUT,DATA,RET]); // FIXME: return a 404 when the method doesn't exists
  }
  else {
    if (typeOf(DATA)!=str) DATA=JSON.parse(DATA.toString());
    var PARMS=JSON.parse(DATA),
        REQLOG=_REQLOG,
        THIS=this,
        GID=PARMS[1].shift(),
        SRV; // TODO: threads ;; FIXME: not good, le call ci-dessous est async !!!
    if (GID) {
      REQLOG.IDCLI=splitTrim(GID,":")[0]; // TODO: improve this
      SRV=server.getById(REQLOG.IDCLI);
    }
    else {
      REQLOG.IDCLI=GID;
      SRV=this.SRV;
    }
    if (isNil(SRV)) error("channel.handler_msg");
    thread(SRV,async function () {
      _REQLOG=REQLOG;
      var RES=await THIS.SRV.call(PARMS[0],{ACCEPT:TYOUT},PARMS[1]); // FIXME: return a 404 when the API entry doesn't exists
                 // FIXME: we should be able to directly use "SRV", rather than "THIS.SRV" here
      RET(200,TYOUT,DATA,RES);
    },GID+("["+PARMS[0]+"]"/*TODO: add a 1st class way of creating a thread from a full RPC, and to store the RPC info in the thread, not as a syntactic extension of the GID*/));
  }
});

channel.setMethod("start",function () {
  var REQNO=0;
  function req(REQ) {
    var PARMS=urlParse(REQ.url);
    return { "METHOD":REQ.method,
             "PATHNAME":PARMS.pathname,"QUERY":PARMS.query,
             "ADDR":REQ.socket.address(),"RADDR":REQ.socket.remoteAddress,
             "ACCEPT":REQ.headers.accept,"REFERER":REQ.headers.referer, // TODO: check we can use .headers directly, rather than getHeader() ;; seems getHeader() doesn't exists on IncomingMessage
             "IDCLI":-1
            };
  }
  function log(NO,REQ,BODY,ERR,BIN,ANSW) {
    out(REQ.METHOD+"<#"+NO+"><"+
        REQ.ADDR.address+":"+REQ.ADDR.port+"::"+
        REQ.IDCLI+" "+REQ.PATHNAME+" "+REQ.QUERY+">");
    if (REQ.METHOD=="GET") out("[]"); else out(BODY.toString());
    cr(),out("["+JSON.stringify(ERR)+"]=> ");
    if (BIN) out("...");
    else
    if (REQ.METHOD=="GET") out("..."/*substring(ANSW,0,10)+" ..."*/); else out(ANSW);
    cr(),origin.garbage();
    out("<<"+origin.TXC+" "+origin.TXCL+" "+origin.JXO+" ;; "
            +(process.memoryUsage().heapUsed/(1024*1024)).toFixed(2)+"Mb"
            +">>");
    cr(),cr();
  }
  var THIS=this;
  function handler(REQ,ANSW) {
    var REQLOG=_REQLOG=req(REQ);
    _CURSRV=THIS.SRV;
    function ret(ERR,CTYPE,MSG,RES,BIN) {
      if (CTYPE=="application/json") RES=isUndefined(RES)?"null"/*FIXME: clean this*/:JSON.stringify(RES);
      var SRES=RES;
      if (!BIN && !conf().LOG_FULLANSW) SRES=substring(SRES,0,80)+(length(SRES)>80?" ...":"_");
      log(REQNO++,REQLOG,MSG,ERR,BIN,SRES);
      ANSW.writeHead(ERR, {'Content-Type': CTYPE,
                           'Access-Control-Allow-Origin': '*' // Available to all
                          });
      if (isDefined(BIN)) ANSW.end(RES);
      else {
        ANSW.write(RES);
        ANSW.end("\n");
      }
      _REQLOG=_CURSRV=Nil;
    }
    var ISRPC=(REQLOG.PATHNAME=="/" && REQ.method=="POST");
    if (REQLOG.PATHNAME=="/" && REQ.method=="GET") REQLOG.PATHNAME="/index.html";
    var METHOD=lcase(REQLOG.METHOD),
        PATH=REQLOG.PATHNAME+(isString(REQLOG.QUERY) && REQLOG.QUERY!=""?"?"+REQLOG.QUERY:""),
        TYIN=REQ.headers["content-type"], // TODO: check we don't need the encoding
        TYOUT=REQLOG.ACCEPT;
    if (!ISRPC) METHOD=sy(METHOD);
    function fdataxc(FUNC) {
      var MSG="",ISOBJ=false;
      REQ.on('data',function (DATA) {
        if (ISOBJ) error("channel::handler(multipart obj)"); // TODO: check what ISOBJ was for
        else {
          if (typeOf(DATA)==str) MSG+=DATA;
          else
          if (isa0(DATA,Buffer)) {
            MSG=Buffer.concat(MSG==""?[DATA]:[MSG,DATA]);
          }
          else error("fdataxc");
        }
      });
      REQ.on('end',function () {
        FUNC(MSG); // ISOBJ == typeOf(MSG)!=str
      });
    }
    fdataxc(function (MSG) {
      THIS.handler_msg(METHOD,PATH,TYIN,TYOUT,MSG,ret);
    });
  }
  if (!this.isLocal()) error("channel.start(!local)");
  if (!isNil(this._RUNNING)) error('channel.start(already running)');
  var SRV=http.createServer(handler);
  this._RUNNING=SRV; // Can be too late, don't know why
  SRV.on('connection', function (SOCK) { SOCK.unref(); });
  SRV.listen(this.PORT,"0.0.0.0");
//console.log('Server running at http://localhost:'+this.PORT+'/');
});
