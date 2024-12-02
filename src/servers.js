/*
 * servers.js
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

// APIs
var APIDefault={};
type(Nil,
     { "NAME":"api", "PARENT":obj, "ATTRS":[] });

origin.isApi=function (O) {
  return isa(O,api);
}

// Servers
type(function (PORT,API) {
       function create(CATEG,ISPHYS/*FIXME: as a parameter, unused at the moment*/) {
         var RES=server.create(),
             ROOT=server.root();
         if (isUndefined(ROOT) && !ISPHYS && CATEG=="l") ISPHYS="root"; // TODO: improve this
         if (ISPHYS) {
           RES.IDPHYS=server.LASTIDPHYSSRV++;
           RES.IDSRV=0;
           if (ISPHYS=="root") server.LASTIDSRV++;
         }
         else {
           if (isUndefined(ROOT) && CATEG=="c") error("server.create");
           if (isDefined(ROOT)) RES.IDPHYS=ROOT.IDPHYS;
           RES.IDSRV=server.LASTIDSRV++;
         }
         RES.CATEG=CATEG;
         server.SRV[ISPHYS && ISPHYS!="root"?gserverId(RES,1):RES.IDSRV]=RES;
         return RES;
       }
       var RES;
       if (isNumber(PORT)) {
         RES=server.getBy("PORT",PORT);
         if (RES==Nil) {
           RES=create("l"); // Local
           if (isUndefined(API) || typeOf(API)==obj) API=api(API);
           if (!isApi(API)) error("server.cons(1)");
           RES.ADDR="0.0.0.0";
           RES.PORT=PORT;
           RES.API=API;
           setPrototypeOf(API,APIDefault); // FIXME: not super nice way of inheriting APIs
                                           // TODO: implement virtual servers
           RES.CH=channel(PORT,RES); // TODO: do that also for Clients
         }
       }
       else
       if (PORT=="c") {
         if (!isNumber(API)) error("server.cons(2)");
         RES=create("c"); // Client
         RES.IDSRVPARENT=API;
       }
       else {
         var URL=server.urlNormalize(PORT),IDCLI;
         if (!isString(URL)) error("server.cons(3)");
         if (isDefined(API)) IDCLI=API;
         RES=server.getBy("HREF",URL);
         if (RES==Nil) RES=(async function () {
           var RES=create("r"); // Remote
           var URL0=urlParse(URL);
           RES.HREF=URL;
           RES.ADDR=URL0.hostname;
           RES.PORT=JSON.parse(URL0.port==""?"80":URL0.port);
           RES.CH=channel(URL);
           if (IDCLI!=-1) await RES.connect(IDCLI);
           return RES;
         })();
       }
       return RES;
     },
     { "NAME":"server", "PARENT":obj,
       "ATTRS":["IDPHYS=0","IDSRV=0",
                "IDCLI","IDSRVPARENT",
                "CATEG=''","PORT=0",
                "ADDR=''","HREF=''",
                "API={}","_RUNNING=Nil","CH=Nil","EVTNO=0",
                "CONT=[]",
                "THREAD=[]","PROC=Nil"] });

server.SRV=[];
server.LASTIDSRV=0; // FIXME: implement classes that remember their instances, and let server be one such class
server.LASTIDPHYSSRV=0;

setprop(server,"root",function () {
  return server.SRV[0];
});
setprop(server,"getById",function (ID) {
  return server.SRV[ID];
});
setprop(server,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in server.SRV) if (isDefined(server.SRV[I])
                             && server.SRV[I][NAME]==VAL) RES=server.SRV[I];
  return RES;
});

origin.isServer=function (O) {
  return isa(O,server);
}
origin.isLocal=function (O) { // FIXME: turn that to methods, and add a Niv0 function call that does the dispatch
  return isServer(O) && O.CATEG=="l";
}
origin.isRemote=function (O) {
  return isServer(O) && O.CATEG=="r";
}
origin.isClient=function (O) {
  return isServer(O) && O.CATEG=="c";
}

// Find
setprop(server,"find",function (ADDR,PORT,IDCLI) {
  var RES=Nil;
  for (var I in server.SRV) {
    var SRV2=server.SRV[I];
    if (isDefined(SRV2) && SRV2.ADDR==ADDR && SRV2.PORT==PORT && SRV2.IDSRV==IDCLI) {
      if (RES!=Nil) error("server.find"); // Not reached
      RES=SRV2;
    }
  }
  return RES;
});

// urlNormalize
setprop(server,"urlApp",function () {
  return server.APP_URL;
});
setprop(server,"urlWeb",function () {
  return server.WEB_URL;
});
setprop(server,"urlNormalize",function (U) {
  return urlNormalize(U,server.urlApp());
});

// Connect/close
server.setMethod("evtNo",function (NO) {
  if (isUndefined(NO)) NO=this.EVTNO,this.EVTNO++;
                       if (this.EVTNO<=NO) this.EVTNO=NO+1;
                                           else error("evtNo");
});

// Connect/close
function _connect(IDSRV) {
  var RES;
  if (isDefined(IDSRV)) {
    RES=server.getById(IDSRV);
    if (isUndefined(RES)) error("_connect(1)");
  }
  else {
    if (isNil(server.currentServer())) error("_connect(2)");
    RES=server("c",server.currentServer().IDSRV);
    RES.ADDR=_REQLOG.ADDR.address;
    RES.PORT=_REQLOG.ADDR.port;
  }
  return { "IDSRV":RES.IDSRV, "IDPHYSCLI":RES.IDPHYSCLI, "CONF":conf(1) };
}
function _allocPhys() {
  var RES=_connect();
  server.getById(RES.IDSRV).IDPHYSCLI=server.LASTIDPHYSSRV++; // TODO: create the full physical remote server
  return RES;
}
server.setMethod("connect",async function (IDCLI) {
  var CLI=await this.call("_connect",isDefined(IDCLI)?[IDCLI]:[]);
  this.IDCLI=CLI.IDSRV;
  if (CLI.IDPHYSCLI) {
    if (this.IDSRV!=0) error("connect.PHYS");
    this.IDPHYS=CLI.IDPHYSCLI;
  }
  if (isUndefined(this.IDPHYS)) error("connect::IDPHYS");
  confExec(CLI.CONF); // FIXME: do it only in case URL==APP_URL (and use it also in the future, in a more local way, when this local way will have been defined)
});

server.setMethod("close",function () {
  var THIS=this; // F%&ck you the F"$/&NG designers of the F/()=/G Javascript PL !!!!!!!!!!!
  function rm() {
    var IRM=index(server.SRV,THIS);
    if (IRM!=THIS.IDSRV) error("close::rm");
    server.SRV[THIS.IDSRV]=Undefined;
  }
  if (this.CATEG=="r") this.call("_close",[]),rm();
  else
  if (this.CATEG=="c") rm();
// TODO: detach all containers
  ;
});
function _close() {
  var SRV=server.currentClient();
  SRV.close();
  return True;
}

// Threads
server.setMethod("enter",function (TH) {
  ; // TODO: check there is no thread with this GID already in this.THREAD
  this.THREAD.push(TH);
});

// Calls
server.setMethod("call",function (FNAME,OPT,PARMS,CALLBACK) { // FIXME: remove CALLBACK
  var RES=Nil,
      METHOD="POST";
  if (isArray(OPT)) CALLBACK=PARMS,PARMS=OPT;
               else METHOD=[OPT.METHOD,OPT.ACCEPT];
  if (isLocal(this)) {
  //if (server.currentClient().IDSRVPARENT!=server.currentServer()) return Nil; // TODO: later, return a more sophisticated kind of error value ;; FIXME
    var F=this.API[FNAME];
    if (isFunction(F)) {
      RES=F.apply(Nil,PARMS);
    }
  }
  else
  if (isRemote(this)) {
    var TH=thread.current(),IDCLI;
    if (TH) IDCLI=TH.GID;
       else IDCLI=gserverId(this,1)+":"+(this.EVTNO++/*When there is no thread we consume an event ; TODO: improve this*/);
    PARMS.unshift(IDCLI);
    RES=this.send(METHOD,"",JSON.stringify([FNAME,PARMS]),CALLBACK);
  }
  else error("server.call");
  return RES;
});

server.setMethod("send",function (METHOD,PARMS,DATA) { // TODO: deprecate it at some point (?)
  var REQ,RES=Nil,ACCEPT;
  if (isArray(METHOD)) ACCEPT=METHOD[1],METHOD=METHOD[0];
  if (isUndefined(METHOD)) METHOD="POST";
  if (endsWith(METHOD,":bin")) METHOD=substring(METHOD,0,length(METHOD)-4);
  if (isUndefined(ACCEPT)) ACCEPT="application/json";
  if (!isRemote(this)) error("server.send(!remote)");
  return this.CH.msg(METHOD,PARMS,"",ACCEPT,DATA);
});

// Current client & server
var _REQLOG=Nil,_CURSRV=Nil;
setprop(server,"currentClient",function () { // Physical
  if (isNil(_REQLOG)) return Nil;
  var SRV=server.find(_REQLOG.ADDR.address,_REQLOG.ADDR.port,_REQLOG.IDCLI);
  if (!isClient(SRV)) error("server.currentClient");
  return SRV;
});
setprop(server,"currentServer",function () { // Physical
  return _CURSRV;
});

// Handler
var http=Undefined;
server.setMethod("start",function () {
  this.CH.start();
});

server.setMethod("stop",function () {
  if (isNil(this._RUNNING)) error("server.stop"); // FIXME: postpone this a bit to make this work in case createServer() activated the handler, but _RUNNING has not been set yet
  this._RUNNING.unref();
  this._RUNNING.close();
  this._RUNNING=Nil;
});

// Containers
server.setMethod("attach",function (CONT) {
  if (!isContainer(CONT) || isDefined(CONT.SRV)) error("server.attach");
  this.CONT[CONT.IDCONT]=CONT;
  CONT.SRV=this;
});

server.setMethod("container",function (NAME,FOP) {
  if (FOP) {
    var CONT=this.container(NAME);
    if (isNil(CONT)) {
      CONT=container(NAME,this);
    }
    return CONT;
  }
  else return find(this.CONT,function (X) { return isDefined(X) && X.NAME==NAME });
});
function _fetchconts() {
  return RES=server.currentClient().containers(True).map(function (C) {
    return {"NAME":C.NAME};
  });
}
server.setMethod("containers",function (FETCH) {
  if (FETCH) {
    if (isLocal(this)) ;
    else
    if (isRemote(this)) {
      var THIS=this;
      return (async function () {
        var L=await THIS.call("_fetchconts",[]);
        for (var C of L) {
          THIS.container(C.NAME,True);
        }
        return THIS.containers();
      })();
    }
    else
    if (isClient(this)) {
      var SRV=server.getById(this.IDSRVPARENT);
      for (var C of SRV.containers()) {
        if (isString(C.NAME) && C.NAME!="") {
          this.container(C.NAME,True);
        }
      }
    }
    return this.containers();
  }
  else return this.CONT.filter(function (X) { return isDefined(X); });
});

// Queries
function _grep(NAME/*Local*/,Q) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_grep");
  return serialize(CONT.query(Q),"flat*");
}

// Synchronization
function _syncobjs(NAME/*Local*/,S) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_syncobjs");
  parse(S,CONT);
  return True;
}
function _reboot(NAME,S) {
  server.currentServer().stop();
  timers.setTimeout(function () {
    console.log("Bye bye !");
    var /*out=fs.openSync('./out.log', 'a'),
        err=fs.openSync('./out.log', 'a'),*/
        PROC=child_process.fork(process.argv[1],{ detached:True, stdio:"ignore"/*["ignore", out, err]*/ });
    PROC.unref();
    process.exit(1);
  },1000);
  console.log("Rebooting ...");
  return True;
}

// Misc.
function _srvls() {
  var T={ "l":"LOC", "r":"REM", "c":"CLI" };
  function cls(CONT) {
    outd(CONT.IDCONT),out(" ");
    outd(CONT.SRV.IDSRV),out(" [");
    outd(CONT.NAME),out(";");
    outd(CONT.FNAME),out("]");
  }
  function ls(SRV) {
    out(T[SRV.CATEG]),
    out(" "),outd(SRV.IDSRV);
    out(" "),outd(SRV.IDCLI);
    out(" "),outd(SRV.HREF);
    out(" "),outd(SRV.ADDR);
    out(" "),outd(SRV.PORT);
    for (var C of SRV.containers()) cr(),out("  "),cls(C);
    for (var TH of SRV.THREAD) cr(),out("  "),out(TH.ID+" "+TH.GID);
  }
  for (var I in server.SRV) if (isDefined(server.SRV[I])) ls(server.SRV[I]),cr();
  return Nil;
}

// Re-submitting a client's DOM node
async function _submit(ID,ATTRS) {
  if (origin.DBGQUERY) console.log("=> ",ID,ATTRS);
  ATTRS=container.patch(ATTRS);
  var CLI=server.currentClient();
  jxstart(CLI.PROC);
  var RES=toHtml(jx$(await jixReeval(ID,ATTRS)));
  jxstart(Nil);
  function gc(CONT,MYSQL) {
    if (CONT) {
    //console.log("garbaging "+CONT.NAME);
      CONT.$={};
      if (CONT.PERSIST) for (var I in CONT.PERSIST) CONT.$[I]=CONT.PERSIST[I];
      if (0 && MYSQL) {
        CONT.CON.end(function () { console.log("Pool ended"); });
        CONT.CON=_mysql.createPool({
                        host:CONT.ADDR, user:CONT.USER, password:CONT.PASS, database:CONT.DB,
                        multipleStatements: True
                      });
      }
    }
  }
  var TH=thread.current();
  if (TH) {
    var SRV=TH.SRV,C;
    gc(SRV.container("ADF"));
    gc(SRV.container("DOM"));
  //gc(SRV.container("atspsoft_nglsnep",1));
    SRV.PROC.MOD=Nil;
    origin.garbage();
  }
  return RES;
}

// HTTP methods
function _HTTPPut(PATH,TYIN,TYOUT,DATA,RET) {
  var ISOBJ=typeOf(MSG)!=str;
  console.log("Putting ",PATH,"<<",DATA,">>["+ISOBJ+"]");
  fs.writeFileSync(conf().WEB+'/'+PATH,DATA);
  RET(200,"text/html","","OK",False);
}
function _HTTPPost(PATH,TYIN,TYOUT,DATA,RET) {
  RET(404,"text/html","","<h1>Doesn't handle POSTs</h1>");
}
function _HTTPGet(PATH,TYIN,TYOUT,DATA,RET) {
  function rd(PATH,BIN,FUNC) {
    if (BIN) fs.readFile(PATH,FUNC); // DOESN'T WORK with 'binary' as the second parameter, e.g. for images !
        else fs.readFile(PATH,'utf-8',FUNC);
  }
  function jixh(PROC,CLI) {
    var HTML='<meta charset="utf8">\n'+
             '<script src="/lib/jixlib.js"></script>\n', // TODO: use the env vars to always fetch correctly the "lib" folder's location
        _$=jxr(PROC.MOD,"_$"),
        BODY=jx$(_$)[sType]!="body";
    if (CLI) {
      HTML+='<script language=javascript>\n'+
            '  (async function () {\n'+
            '    server.CLI_SRV=await server("http://'+REQLOG.ADDR.address+':'+
                                                       REQLOG.ADDR.port+'",'+
                                                       CLI.IDSRV+');\n'+
            '  })();\n'+
            '</script>\n';
    }
    HTML+=(BODY?"<body>\n":"")+toHtml(jx$(_$))+(BODY?"\n</body>":"")+"\n";
    RET(200,"text/html","",HTML,False);
  }
  var BIN=False,
      REQLOG=_REQLOG,
      EXT=fileExt(REQLOG.PATHNAME);
  if (contains(["jpg","png","gif"],EXT)) BIN=True;
  var IDCLI; //= get the session id in the GET parameters
  if ((EXT=="jix" || EXT=="jxml") && isDefined(IDCLI)/*[CAN'T WORK !!!]*/) {
    var CLI=server.getById(IDCLI);
    jixh(CLI.PROC,CLI);
  }
  else
  rd(conf().WEB+'/'+REQLOG.PATHNAME,BIN,function(ERR,DATA) {
    ; // FIXME: if the pathname is void, set pathname=index.html
    if (ERR) {
      RET(404,"text/html","",'<h1>Page Not Found</h1>');
    }
    else { 
      var MIME="text/html", EXT=fileExt(REQLOG.PATHNAME);
      if (endsWith(REQLOG.PATHNAME,".css")) MIME="text/css";
      if (contains(["jpg","png","gif"],EXT)) MIME="image/"+(EXT=="jpg"?"jpeg":EXT);
      if (EXT=="jix" || EXT=="jxml") { // no session id
        var FPATH=conf().WEB+'/'+REQLOG.PATHNAME,
            JSPATH=filePath(FPATH)+"/"+fileName(FPATH)+".js"
            JS=0;
        if (fileExists(JSPATH)) JS=1,DATA=fileRead(JSPATH); // FIXME: only do this if date(JIX)<date(JS)
if (origin.DBGQUERY) console.log("===>(JS)",JS);
        var CLI=server.getById(_allocPhys().IDSRV);
        if (isUndefined(CLI)) error("server.start::createSession");
        CLI.container("ADF",1);
        CLI.container("DOM",1);
        REQLOG.IDCLI=CLI.IDSRV;
        (async function () {
          var PERSIST=False,
              PROC=await jixEvalMod(DATA,fileName(FPATH),JS,EXT); // FIXME: improve this : in case e.g. the import file is not found (return 404 ; or either ignore it ; or either have an import which works dynamically)
          for (var VAR of PROC.MOD.PARM) if (isContainer(jx$(VAR))) PERSIST=True;
          if (PERSIST) {
if (origin.DBGQUERY) console.log("Persisting ...");
            CLI.containers(True);
            CLI.PROC=PROC;
          }
          else CLI.close(),CLI=Nil; // TODO: check that everythings works without leaks when performing close()
          jixh(PROC,CLI);
        })();
      }
      else RET(200,MIME,"",DATA,BIN);
    }
  });
}

// Init
if (SERVER) {
  http=require('http');
  timers=require('timers');
  APIDefault={ "_connect": _connect,
               "_close": _close,
               "_srvls": _srvls,
               "_fetchconts": _fetchconts,
               "_grep": _grep,
               "_syncobjs": _syncobjs,
               "_reboot": _reboot,
               "_submit": _submit
             };
  APIDefault[sy("put")]=_HTTPPut;
  APIDefault[sy("post")]=_HTTPPost;
  APIDefault[sy("get")]=_HTTPGet;
}
else { // FIXME: vars in Niv0 blocks (e.g. below, U, PATH, A, ...) leak in the global, due to the fucking way JS manages local var decls in blocks
  var U=urlSelf();
  if (U.protocol=="file:") U=urlParse("http://localhost");
  var PATH=U.pathname,A=splitTrim(PATH,"/"),I=length(A)-1,HASWEB=False;
  if (endsWith(A[I],".html")) {
    I--;
    if (I>=0 && A[I]=="web") HASWEB=True,I--;
    var S="";
    for (var J=1;J<=I;J++) S+="/"+A[J];
    PATH=S;
  }
  U=urlParse(U.origin+PATH);
  server.APP_URL=U.href;
  server.WEB_URL=U.href+(HASWEB?"web":"");
}
