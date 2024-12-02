/*
 * containers.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019.
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

// Containers
type(function (NAME,FNAME,CATEG,SRV) {
       var RES=container.create();
       RES.IDCONT=container.LASTIDCONT++;
       if (isString(NAME) && isString(FNAME)) { // From file
         if (!isString(CATEG)) SRV=CATEG,CATEG=FNAME,FNAME=NAME,NAME=Undefined; // FIXME: doesnt work well, unintuitive
         RES.load(FNAME,CATEG);
       }
       else
       if (isContainer(NAME) || isContainer(FNAME)) { // Derived container
         var CONT=FNAME;
         if (isContainer(NAME)) CONT=NAME,NAME=Undefined,SRV=FNAME;
         else {
           if (!isString(NAME)) error("container.cons(1)");
           SRV=CATEG;
         }
         RES.setParent(CONT);
         error("container.derived(!Yet)");
       }
       else
       if (isUndefined(NAME) || isString(NAME) || isServer(NAME)) { // Pure container
         if (isServer(NAME)) SRV=NAME;
                        else SRV=FNAME;
       }
       else error("container.cons(2)");
       RES.NAME=NAME;
       if (isDefined(SRV)) {
         if (!isServer(SRV)) error("container.cons(3)");
         SRV.attach(RES);
       }
       return RES;
     },
     { "NAME":"container", "PARENT":obj,
       "ATTRS":["SRV",
                "IDCONT","PARENT",
                "NAME","FNAME=''",
                "LASTID=0","FULLIDS=0","LASTSTORED=Nil",
                "QMETHODS={}",
                "TYPES={}",
                "$={}"] });

container.LASTIDCONT=0; // FIXME: implement classes that remember their instances & set id to them

function isContainer(O) {
  return (typeof container!="undefined"/*bootstrap*/) && isa(O,container);
}
origin.isContainer=isContainer; // Bootstrap

container.setMethod("getById",function (ID) {
  return this.$[ID];
});
container.setMethod("parent",function () {
  return this.PARENT;
});
container.setMethod("setParent",function (CONT) {
  if (!isContainer(CONT)) error("setParent");
  this.PARENT=CONT;
});
// TODO: add a method name() for containers
container.setMethod("qmethod",function (NAME) {
  return this.QMETHODS[NAME];
});
container.setMethod("setQMethod",function (NAME,FUNC) {
  this.QMETHODS[NAME]=FUNC;
});
container.setMethod("types",function () { // TODO: add a method type()
  return this.TYPES;
});
container.setMethod("typeAdd",async function (TYPE) {
  if (isDefined(this.TYPES[TYPE.NAME])) return;
  this.TYPES[TYPE.NAME]=TYPE;
});

// Store
declare({ SymbolCont:sy("^$"),
          SymbolId:sy("+o"),
          SymbolFlags:sy("%"),
          SymbolUp:sy("^"),
          SymbolTs:sy("t") });

obj.setMethod("containerOf",function () {
  return this[SymbolCont];
});
obj.setMethod("setContainerOf",function (CONT) {
  if (!isContainer(CONT)) error("setContainerOf");
  var OCONT=this.containerOf();
  if (OCONT && OCONT!=CONT) error("setContainerOf(2)");
  this[SymbolCont]=CONT;
});
obj.setMethod("getId",function () {
  return this[SymbolId];
});
obj.setMethod("setId",function (ID) { // FIXME: rule out ID=="", and full IDs (or either, use them properly)
  var CONT=this.containerOf(),ID0=this.getId();
  if (ID0 && !isNil(CONT)) {
    delete CONT.$[ID0];
  }
  this[SymbolId]=ID;
  if (!isNil(CONT)) {
    if (!isUndefined(CONT.$[ID])) error("obj.setId");
    CONT.$[ID]=this;
  }
});
obj.setMethod("flags",function () {
  var F=this[SymbolFlags];
  if (isNil(F)) return set(""); else return F;
});
obj.setMethod("hasFlags",function (F) {
  return this.flags().has(F);
});
obj.setMethod("setFlags",function (FLAGS) {
  if (typeOf(FLAGS)==str) FLAGS=oflags(FLAGS);
  this[SymbolFlags]=FLAGS;
  if (this[SymbolFlags]=="") delete this[SymbolFlags];
});
obj.setMethod("addFlags",function (FLAGS) {
  this.setFlags(this.flags().union(FLAGS));
});
obj.setMethod("delFlags",function (FLAGS) {
  if (isDefined(this.flags())) this.setFlags(this.flags().minus(FLAGS));
});
obj.setMethod("up",function (FULLREF,CLOSEST) {
  return _getUp(this,FULLREF,CLOSEST);
});
obj.setMethod("detach",function () {
  _detach(this);
});

container.setMethod("newId",function () {
//if (this.FULLIDS) error("newId"); Why is this here ???
  while (this.getById(this.LASTID)) this.LASTID++;
  return this.LASTID++;  // FIXME: generate IDs in such a way that the generated ID can never be in collision with an ID that has been choosen by the user (e.g. ID=Chr(1)+(LASTID++))
});
origin.sFullIdSep="#";
type.setMethod("name",function (SHORT) {
  var TYNAME=this.NAME;
  return SHORT && contains(TYNAME,".")?last(splitTrim(TYNAME,".")):TYNAME;
});
obj.setMethod("fullId",function (ID) {
  if (!ID && ID!=0 || contains(ID.toString(),sFullIdSep)) error("fullId::"+ID);
  var TY=typeOf(this).name(1);
  return TY+sFullIdSep+ID;
});
container.setMethod("fullIds",function (B) {
  this.FULLIDS=B;
});
container.setMethod("store",function (O,ID,FOP) {
  if (isUndefined(ID)) {
    if (isDefined(O[SymbolId])) ID=O[SymbolId];
                           else ID=this.newId();
  }
  var IDO=this.getById(ID);
  if (!FOP && isDefined(IDO) && IDO!=O) error("store<"+this.NAME+"::"+ID+">");
  O.setContainerOf(this);
  if (this.FULLIDS) ID=O.fullId(ID);
  O.setId(ID);
  this.LASTSTORED=O;
});

// Access & PO
obj.setMethod("remove",function (NAME,N) {
  function rm(A,I) {
    var VAL=A[I];
    if (isBoxed(VAL) && VAL.up()==A) VAL.detach();
  }
  if (isArray(this) && isNumStr(NAME)) {
    if (isUndefined(N)) N=1;
    if (NAME<0 || NAME+N>length(this)) error("obj.remove");
    var M=N;
    while (M--) {
      rm(this,NAME);
      this.splice0(NAME,1);
    }
    for (var I=NAME;I<length(this);I++) {
      var VAL=this[I],UP;
      if (isBoxed(VAL)) UP=VAL.up(1);
      if (isDefined(UP)) UP.POS-=N;
    }
  }
  else {
    rm(this,NAME);
    delete this[NAME];
  }
});
obj.setMethod("cut",function (NAME,N) { // Useable to replace pop() and shift()
  var NDEF=True,RES=[];
  if (isUndefined(N)) N=1,NDEF=False;
  if (isArray(this) && isNumStr(NAME)) {
    if (NAME<0 || NAME+N>length(this)) error("obj.cut");
    for (var I=NAME;I<NAME+N;I++) RES.push(this[NAME]);
  }
  else RES.push(this[NAME]);
  this.remove(NAME,N);
  return NDEF?RES:RES[0];
});

array.setMethod("splice0",array.method("splice"));
array.setMethod("insert",function (I,...VAL) { // Useable to replace push() and unshift()
  if (!isNumStr(I)) error("array.insert");
  for (var J=0;J<length(VAL);J++) this.splice0(I,0,Undefined);
  var N=length(VAL);
  for (var J=I+N;J<length(this);J++) {
    var UP=this[J].up(1);
    if (isDefined(UP)) UP.POS+=N;
  }
  for (var J=0;J<length(VAL);J++) this[I+J]=VAL[J];
});
array.setMethod("push0",array.method("push"));
array.setMethod("push",function (VAL) {
  if (typeOf(A)==array) return this.push0(VAL);
  this.insert(length(this),VAL);
  return VAL;
});

array.setMethod("splice",function (I,N,...VAL) {
  if (typeOf(A)==array) return this.splice0(I,N,...VAL);
  if (isUndefined(N)) N=0;
  var RES=this.cut(I,N);
  this.insert(I,...VAL);
  return RES;
});

obj.setMethod("first",function () {
  if (isArray(this)) return this[0];
  else {
    if (!this.$) error("obj.first");
    return this.$[0];
  }
});
obj.setMethod("last",function () {
  if (isArray(this)) return this[length(this)-1];
  else {
    if (!this.$) error("obj.last");
    return this.$[length(this.$)-1];
  }
});

obj.setMethod("prev",function () {
  error("obj.prev (!Yet)");
});
obj.setMethod("next",function () {
  var UP=this.up(1);
  if (!UP || !isArray(UP.OBJ)) return Undefined;
  return UP.OBJ[UP.POS+1]; // TODO: add BOL et EOL (?)
});

// Copy & move
container.setMethod("copy",function (O,MODE) { // TODO: detect loops
  return _copy(this,O,MODE);
});
container.setMethod("move",function (O,MODE) {
  var RES=this.copy(O,MODE);
  O.delete(MODE);
  return RES;
});

// Load & save
container.setMethod("load",function (FNAME,CATEG) {
  FNAME=fnameNormalize(FNAME);
  if (!CATEG && contains(FNAME,".")) CATEG=fileExt(FNAME),FNAME=FNAME.split(".")[0]; // FIXME: error-prone
  FNAME=FNAME+(CATEG?"."+CATEG:"");
  if (isNil(this.FNAME) || this.FNAME!="") this.FNAME=FNAME;
                                      else ;//error("container.load");
  if (CATEG) {
    var S=fileRead(FNAME);
    if (CATEG=="db") {
      parsef(S,this,"lisp");
    }
    else
    if (CATEG=="csv") {
      csvparsef(S,this);
    }
    else error("container.load(2)");
    this.typeAdd(typeOf(this.LASTSTORED));
  }
  else {
    if (!fileIsDir(FNAME)) error("container.load(3)");
    var L=dirRead(FNAME),THIS=this;
    this.fullIds(1); // FIXME: Not useful
    foreach_vfile(L,function (F) {
      if (!F.isDir) THIS.load(F.dir+"/"+F.fname);
    });
  }
});
container.setMethod("save",function () { // TODO: recognize when FNAME is a directory, and save the content in the respective appropriate files from FNAME of the format CATEG
  if (isNil(this.FNAME)) error("container.save");
  var L=[];
  for (N in this.$) L.push(this.$[N]);
  var S;
  if (fileExt(this.FNAME)=="db") {
    var S=serializef(L,[],"lisp");
  }
  else error("container.save(2)");
  fileWrite(this.FNAME,S+"\n");
});

// Queries
container.query=type(function (VARS,OBJ) {
                  var RES=container.query.create();
                  if (isUndefined(OBJ)) OBJ=VARS,VARS=Undefined;
                  if (isUndefined(VARS)) VARS=["*"];
                  if (!isObject(OBJ)) error("container.query");
                  RES.VARS=VARS;
                  RES.QUERY=OBJ;
                  return RES;
                },
                { "NAME":"container.query", "PARENT":obj, "ATTRS":["VARS=[]","QUERY={}"] });

origin.isQuery=function (O) {
  return isa(O,container.query);
}

// Matching
container.query.setMethod("match",function (O,Q) {
  if (isDefined(Q) || isAtom(O)) {
    if (isDefined(Q) && O==Q) return True;
    if (!isAtom(O)) return False;
    if (!isString(O)) O=str(O);
    if (!isString(Q)) error("query.match::str");
    return strMatch(O,Q[0]=="'"?substring(Q,1,length(Q)-1)/*FIXME: hack*/:Q);
  }
  if (!isObject(O)) return False;
  var RES=True;
  if (typeOf(this.QUERY)==array) {
    var CONT=O.containerOf();
    if (isDefined(CONT)) {
      var M=CONT.qmethod(this.QUERY[0]);
      if (isUndefined(M)) error("query.match::qmethod(1)");
      RES=M(O,...acopy(this.QUERY,1,length(this.QUERY)));
    }
    else error("query.match::qmethod(2)");
  }
  else {
    var KEYS=O.keys().concat([SymbolType]);
    for (VAR in this.QUERY) {
      if (VAR=="") VAR=SymbolType;
      if (!contains(KEYS,VAR)) { RES=False;break; }
      else {
        var QVAL=this.QUERY[VAR==SymbolType?"":VAR];
        if (VAR==SymbolType) QVAL=type.getByName(QVAL);
        if (!QVAL || !this.match(O[VAR],QVAL)) { RES=False;break; }
      }
    }
  }
  return RES;
});
container.setMethod("query",function (VARS,QUERY,FETCH) {
  if (typeOf(VARS)==obj || isQuery(VARS)) {
    FETCH=QUERY;
    QUERY=VARS;
    VARS=Undefined;
  }
  if (!isQuery(QUERY)) {
    QUERY=container.query(VARS,QUERY);
  }
  if (FETCH && isRemote(this.SRV)) {
    var THIS=this;
    return (async function () {
      var S=await THIS.SRV.call("_grep",[THIS.NAME,QUERY.QUERY]);
      return parse(S,THIS);
    })();
  }
  else
  if (typeOf(QUERY.QUERY)==array && QUERY.QUERY[0]=="!") {
    var TYPE=QUERY.QUERY[1],O=QUERY.QUERY[2];
    TYPE=type.getByName(TYPE);
    if (!isType(TYPE)) return [];
    return [TYPE(O,this)];
  }
  else {
    var L=[];
    for (var ID in this.$) {
      var O=this.$[ID];
      if (QUERY.match(O)) L.push(O);
    }
/*out("Query:\n");
for (var O of L) outd(O.getId()),out("; ");
out("<==="),cr();*/
    return L;
  }
});

// Open, close
container.setMethod("open",function () {
});
container.setMethod("close",function () {
});

// Sync
origin.isModified=function (O) {
  return O.hasFlags("m");
}
obj.setMethod("setModified",function (B) {
  if (isUndefined(B) || B) this.addFlags("m");
                      else this.delFlags("m");
});
obj.setMethod("getTs",function () {
  return this[SymbolTs];
});
obj.setMethod("setTs",function (TS) {
  return this[SymbolTs]=TS;
});
container.setMethod("sync",function (L,FORCE) {
  if (isUndefined(L)) L=this.$;
  else
  if (typeOf(L)!=array) {
    if (isAtom(L)) FORCE=L,L=this.$;
              else L=[L];
  }
  if (isUndefined(FORCE)) FORCE=False;
  if (isRemote(this.SRV)) {
    if (!FORCE) L=L.filter(isModified);
    for (var O of L) O.setModified(False);
    var PARMS=[this.NAME,serialize(L,"flat*")];
    return this.SRV.call("_syncobjs",PARMS); // TODO: once the container has been updated, propagate to parents, and save to file if it's the mapping of a file (find a way to do this in an incremental way)
  }
  else
  if (isClient(this.SRV)) error("container.sync(Client !Yet)");
  else
  if (isLocal(this.SRV)) error("container.sync(Local !Yet)");
                    else error("container.sync");
});

// Patch
container.getByObj=function (O2) {
  var CONT=O2.containerOf(),ID=O2.getId(),O;
  if (CONT || isUndefined(ID)) O=O2;
  if (isUndefined(O)) {
    var L=splitTrim(ID,"#");
    if (length(L)==3) L=[L[0],ID=L[1]+"#"+L[2]]; // NOTE: hsss ...
    if (length(L)==2) {
      var CLI=server.currentClient(); // FIXME: do that only once, by setting a context
      if (CLI) CONT=server.getById(CLI.IDSRVPARENT).container(L[0]);
      ID=L[1];
      if (ID=="") ID=Undefined;
    }
    if (isDefined(CONT) && ID) O=CONT.getById(ID);
    else {
      CONT=jxdom();
      if (CONT) O=CONT.getById(ID);
      if (isUndefined(O)) {
        CONT=jxadf();
        if (isDefined(CONT)) O=CONT.getById(ID);
      }
      if (isUndefined(O)) error("container.getById");
    }
  }
  return [CONT,ID,O];
};
container.patcho=function (O2) {
  _normid(O2);
  var CONT,O,ID,
      L=container.getByObj(O2);
  CONT=L[0],ID=L[1],O=L[2];
  if (O==O2 && isDefined(ID)) return O;
  var TYPE=O2[""];
  if (isDefined(TYPE)) {
    TYPE=type.getByName(TYPE);
    if (TYPE/*FIXME: crappy hack to differentiate queries from raw objects*/) delete O2[""];
  }
  if (isUndefined(O)) {
    if (isUndefined(TYPE)) TYPE=obj;
    if (ID) error("container.patcho::ID");
    O=TYPE(O2,CONT);
  }
  else {
    Object.assign(O,O2);
    O.setModified(); // TODO: diff it and only set modified if there is something
    if (CONT/*TODO: check this*/) container.write(O);
  }
  for (var VAR of Object.getOwnPropertyNames(O)) if (contains(VAR,".")) { // TODO: put that in _create()
    var VAL=O[VAR];
    delete O[VAR];
    O.setByPath(VAR,VAL);
  }
  return O;
};
var _CONTCOMMIT=[];
container.write=function (O) {
if (origin.DBGQUERY) console.log("container.write=> "+pretty(O));
  if (isUndefined(O)) _CONTCOMMIT=[];
                 else _CONTCOMMIT.push(O);
};
container.commit=function () {
  var LC=[];
  for (var O of _CONTCOMMIT) {
    var CONT=O.containerOf();
    if (!CONT) error("container.commit => "+pretty(O));
    if (!find(LC,CONT,1)) LC.push(CONT);
    if (!CONT._commits) CONT._commits=[];
    CONT._commits.push(O);
  }
  for (var CONT of LC) {
    var L=CONT._commits;
    delete CONT._commits;
    if (isMysql(CONT)) CONT.write(L); // TODO: verify write() encodes all values correctly in the INSERT queries
  }
  container.write();
};
container.patch=function (P) {
  var OBJ={};
  function rec(O) {
    _normid(O);
    for (var N in O) if (isBoxed(O[N])) {
      var ID=O[N].getId();
          OV=OBJ[ID];
      if (OV) O[N]=OV;
         else O[N]=rec(O[N]);
    }
    var ID=O.getId();
    O=container.patcho(O);
    if (ID) OBJ[ID]=O;
    return O;
  }
  var RES=rec(P);
  container.commit();
  return RES;
};

// Init
MEMORY=container("memory");
setprop(MEMORY,"store",function () {});
