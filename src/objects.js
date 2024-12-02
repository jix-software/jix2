/*
 * objects.js
 *
 * Copyright (C) Henri Lesourd 2014, 2018, 2019.
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

// JS properties et al.
origin.setprop=function (O,NAME,VAL,E,W,C) {
  if (!isString(NAME)) error("setprop");
  if (isUndefined(E)) E=False;
  if (isUndefined(W)) W=False;
  if (isUndefined(C)) C=False;
  Object.defineProperty(O,NAME,{
    "value": VAL,
    "enumerable": E,
    "writable": W,
    "configurable": C
  });
}
origin.setpropgs=function (O,NAME,GET,SET,E,C) {
  if (!isString(NAME)) error("setpropgs");
  if (isUndefined(E)) E=False;
  if (isUndefined(C)) C=False;
  Object.defineProperty(O,NAME,{
    "get": GET,
    "set": SET,
    "enumerable": E,
    "configurable": C
  });
}

origin.getPrototypeOf=Object.getPrototypeOf || function (O) { // FIXME: Only works with Chrome and Firefox
  return O.__proto__; // FIXME: check when O==Nil and O==Undefined
}
origin.setPrototypeOf=Object.setPrototypeOf || function (O,PROTO) { // FIXME: Only works with Chrome and Firefox
  O.__proto__=PROTO;
  return O;
}
origin.hasPrototype=function (O,P) {
  O=getPrototypeOf(O);
  while (O!=Nil) {
    if (O==P) return True;
    O=getPrototypeOf(O);
  }
  return False;
}

// Types (1)
var SymbolType=Symbol("type");
function _mtypeOf() {
  var OBJ=this;
  if (!isNil(this.typeOf)) OBJ=prototype(this);//Object.getPrototypeOf(this);
  return OBJ[SymbolType];
}
function jsprotoCreate(JSPROTO,TYPE,JSPARENT) {
  var CLASS=Object;
  if (!isNil(JSPARENT)) CLASS=JSPARENT.constructor;
  var RES=JSPROTO;
  if (JSPROTO==Nil) RES=(class extends CLASS {}).prototype;
  RES[SymbolType]=TYPE;
  setprop(RES,"typeOf",_mtypeOf);
  return RES;
}
function jsprotoIsAtom(PROTO) {
  return PROTO==Symbol.prototype
      || PROTO==Boolean.prototype
      || PROTO==Number.prototype
      || PROTO==String.prototype;
}
function jsprotoInheritsAtom(PROTO) {
  if (PROTO==Nil) return False;
  if (jsprotoIsAtom(PROTO)) return True;
  return jsprotoInheritsAtom(Object.getPrototypeOf(PROTO));
}

var TYPEPROTO=jsprotoCreate(Nil,Nil);
if (typeof jix=="undefined") {
  if (isDefined(origin["type"])) error("objects(0)");
  origin.jix=jix={};
}
var type=function (CONS,O) {
  var PARENT=Nil;
  if (!isNil(O)) PARENT=O.PARENT;
  if (isString(PARENT)) {
    PARENT=type.getByName(P0=PARENT);
    if (isUndefined(PARENT)) error("type::PARENT");
  }
  if (isUndefined(PARENT)) PARENT=obj; // Lest we explicitely say PARENT=Nil, PARENT is always obj
  var JSPARENT=Nil;
  if (!isNil(PARENT)) JSPARENT=PARENT.JSPROTO;
  var JSPROTO=Nil;
  if (CONS==type) JSPROTO=TYPEPROTO;
  else
  if (!isNil(O) && !isNil(O.JSPROTO)) JSPROTO=O.JSPROTO;
  if (isNil(CONS) || CONS!=type) JSPROTO=jsprotoCreate(JSPROTO,CONS,JSPARENT);
  var CREATE=(function (VAL,CONT) {
                return _create.apply(JSPROTO[SymbolType],[VAL,CONT]);
              });
  if (isNil(CONS)) CONS=CREATE;
  JSPROTO[SymbolType]=CONS;
  Object.setPrototypeOf(CONS,TYPEPROTO);
  CONS.NAME=Nil;
  CONS.PARENT=PARENT;
  CONS.JSPROTO=JSPROTO;
  CONS.ATTRS=[];
  CONS.NOEVAL={};
  if (!isNil(O)) {
    if (!isNil(O.NAME)) {
      CONS.NAME=O.NAME;
      if (isDefined(jix["type"])) {
        jix.type.$[O.NAME]=CONS;
        origin[O.NAME]=CONS;
      }
    }
    if (!isArray(O.ATTRS)) { if (!isNil(O.ATTRS)) error("type::ATTRS"); }
                      else if (!empty(O.ATTRS)) CONS.setAttrs(O.ATTRS);
    for (var N in O) if (N!="NAME" && N!="PARENT" && N!="JSPROTO" && N!="ATTRS") CONS[N]=O[N];
  }
  delete CONS.name; // TODO: check that there is a long-lasting standard that states we can always do it
  setprop(CONS,"create",CREATE,False,True);
  return CONS;
}
if (isUndefined(jix["type"])) {
  type.$={ "type":type };
  jix.type=type;
  origin.type=type;
  origin.typeOf=typeOf; // Must be done here, otherwise due to the s$%&&y semantics of prototype inheritance (or to its somehow shitty implementation in V8), the read-only property "typeOf" in Object's prototype means (since origin inherits from Object) that we can't set it anymore in origin itself
}
type(function (VAL,CONT) {
       if (isUndefined(CONT) && isContainer(VAL)) CONT=VAL,VAL=Undefined;
       if (isContainer(VAL)) error("obj.cons");
       if (isDefined(VAL) && constructor(VAL)!=Object) {
         if (constructor(VAL)==Array && isDefined(tree)) return tree(VAL,CONT);
       }
       var RES=obj.create(CONT);
       if (isDefined(VAL)) Object.assign(RES,VAL); // FIXME: doesn't work with POs
       return RES;
     },
     { "NAME":"obj", "PARENT":Nil, "JSPROTO":Object.prototype, "ATTRS":[] });

type(type,
     { "NAME":"type", "PARENT":obj, "ATTRS":[] });
setprop(type,"create",function () { error("type.create"); });

setprop(type,"getByName",function (NAME) {
  return type.$[NAME];
});

origin.isType=function (O) {
  return isa(O,type);
}
setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  setprop(this.JSPROTO,NAME,FUNC,False,True);
},
False,True);
setprop(TYPEPROTO,"setAccessor",function (NAME,GET,SET) {
  setpropgs(this.JSPROTO,NAME,GET,SET);
},
False,True);

obj.setMethod("init",function () {});

type.setMethod("name",function () { // FIXME: reunify this with type.name() in containers ; add name() to other classes which have it, e.g. addr()
  return this.NAME;
});
type.setMethod("parent",function () {
  return this.PARENT;
});
type.setMethod("inherits",function (T) {
  var P=this.parent();
  if (!isType(T) || P==Nil) return False;
  if (P==T) return True;
       else return P.inherits(T);
});
type.setMethod("method",function (NAME) {
  var FUNC=this.JSPROTO[NAME]; // FIXME: only get inside own properties of JSPROTO, or rather, in ATTRS
  return isFunction(FUNC)?FUNC:Undefined;
});
type.setMethod("super",function (NAME) {
  return this.parent().method(NAME);
});
obj.setMethod("super",function (NAME,...PARMS) {
  var M=typeOf(this).super(NAME);
  if (isNil(M)) error("super::method "+NAME+" doesn't exists in class "+typeOf(this).parent().name());
  return M.apply(this,PARMS);
});
obj.setMethod("call",function (METHOD,...PARMS) {
  return METHOD.apply(this,PARMS);
});

// JS types (2)
type(function (VAL) {
       var RES=boxit(VAL);
       if (!isNil(RES.valueOf())) error("nil");
       return RES;
     },
     { "NAME":"nil", "PARENT":obj, "ATTRS":[] });

origin.BoxedNil=nil.create();
origin.BoxedUndefined=nil.create();

nil.setMethod("valueOf",function () {
  if (this==BoxedUndefined) return Undefined;
  if (this==BoxedNil) return Nil;
  error("nil.valueOf");
});

function isUnboxed(O) {
  if (O==Nil/*Nil or Undefined*/) return True;
  return isAtom(O) && O.valueOf()===O;
}
function isBoxed(O) { // FIXME: to make files independent of objects, put this in basics
  if (O==Nil) return False;
  return !isUnboxed(O);
}
origin.isBoxed=isBoxed;
origin.isUnboxed=isUnboxed;
origin.boxed=function (O) {
  if (O==Nil) return boxit(O);
  if (isUnboxed(O)) return Object(O);
  return O;
}

function boxit(O) {
  if (isUndefined(O)) return BoxedUndefined;
  if (eqNil(O)) return BoxedNil;
  return O;
}
origin.boxit=boxit;
function typeOf(O) {
  O=boxit(O);
  if (!isFunction(O.typeOf)) return obj;
  return O.typeOf();
}

// JS types (3)
type(function (S) {
       return Symbol(S);
     },
     { "NAME":"symb", "PARENT":obj, "JSPROTO":Symbol.prototype, "ATTRS":[] });
type(function (B,CONT) {
        return bool.create(B,CONT);
     },
     { "NAME":"bool", "PARENT":obj, "JSPROTO":Boolean.prototype, "ATTRS":[] });
type(function (N,CONT) {
       return num.create(N,CONT);
     },
     { "NAME":"num", "PARENT":obj, "JSPROTO":Number.prototype, "ATTRS":[] });
type(function (S,CONT) {
       return str.create(S,CONT);
     },
     { "NAME":"str", "PARENT":obj, "JSPROTO":String.prototype, "ATTRS":[] });
type(function (N,CONT) {
       return date.create(N,CONT);
     },
     { "NAME":"date", "PARENT":obj, "JSPROTO":Date.prototype, "ATTRS":[] });
type(function (VAL,CONT) {
       if (isString(VAL)) return explode(VAL);
       var RES=array.create(CONT);
       if (isDefined(VAL)) Object.assign(RES,VAL); // FIXME: doesn't work with POs
       return RES;
     },
     { "NAME":"array", "PARENT":obj, "JSPROTO":Array.prototype, "ATTRS":[] });

type.setMethod("isAtom",function (STRICT) {
  if (STRICT) return this==nil || this==bool || this==num || this==date || this==symb || this==str;
         else return this.isAtom(True) || this.inherits(nil)
                                       || this.inherits(bool) || this.inherits(num) || this.inherits(date)
                                       || this.inherits(symb) || this.inherits(str);
});
type.setMethod("root",function () {
  if (this.isAtom(True) || this==array) return this;
                                   else if (this.parent()==Nil) return obj;
                                                           else return this.parent().root();
});

// Sets
type(function (VAL) {
       if (isUndefined(VAL)) VAL=[];
       return set.create(implode(VAL)); // FIXME: everywhere with sets, when strings are given, eliminate duplicated elements
     },
     { "NAME":"set", "PARENT":str, "ATTRS":[], "ELEMS":Undefined });

origin.isSet=function (O) {
  return isa(O,set);
}
set.setMethod("contains",function (ELTS) { // FIXME: make contains() compatible with this method
  if (!isString(ELTS)) error("set.contains");
  ; // TODO: test that all elements in ELTS are part of this.ELEMS
  for (var I=0;I<length(ELTS);I++) if (!contains(this,ELTS[I])) return False;
  return True;
});
set.setMethod("has",set.method("contains"));

set.setMethod("inter",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=[];
  for (var I=0;I<length(this);I++) if (contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("union",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=explode(S);
  for (var I=0;I<length(this);I++) if (!contains(A,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("minus",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=[];
  for (var I=0;I<length(this);I++) if (!contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});

setprop(set,"parse",function (S) { // FIXME: adapt the function parse() to take parse() methods into account
  error("set.parse");
});
set.setMethod("serialize",function (VAL) { // Call it also str(), and adapt str() accordingly
  error("set.serialize");
});

origin.tset=function (NAME,ELEMS) { // TODO: parse ELEMS if it is a string
  if (!isArray(ELEMS)) error("tset");
  return type(function (VAL) {
                if (isUndefined(VAL)) VAL=[];
                return type.getByName(NAME).create(implode(VAL)); // FIXME: improve this
              },
              { "NAME":NAME, "PARENT":set, "ATTRS":[], "ELEMS":ELEMS });
}

// _create
function _objkeys(O) {
  return Object.getOwnPropertyNames(O).concat(Object.getOwnPropertySymbols(O));
}
obj.setMethod("keys",function () { return _objkeys(this); });
array.setMethod("akeys",function () { return _objkeys(this).filter(isNumStr); });

function _ggetv(VAR) {
  return function() {
    return _getopo(this,VAR);
  };
}
function _gsetv(VAR) {
  return function(VAL) {
    return _setopo(this,VAR,VAL);
  };
}
function _normid(O) {
  function setid(SY) {
    if (isDefined(O[SY])) {
      if (isDefined(O[SymbolId])) error("_normid");
      O[SymbolId]=O[SY];
      delete O[SY];
    }
  }
  if (isDefined(O["+o"]) && (typeof sId)!="undefined" && isDefined(O[sId])) error("_normid::duplicate ids");
  setid("+o");
  if ((typeof sId/*bootstrap*/)!="undefined") setid(sId);
}
function _create(VAL,CONT) {
  var DONE={};
  function isDone(VAR) {
    return isDefined(DONE[VAR]);
  }
  function done(VAR) {
    if (isDone(VAR)) error("_create::done");
    DONE[VAR]=1;
  }
  if (isUndefined(CONT) && isDefined(VAL)/*bootstrap*/ && isContainer(VAL)) CONT=VAL,VAL=Undefined;
  var BVAL=isBoxed(VAL);
  function rec(TYPE,TYPE_) {
    var RES;
    if (jsprotoIsAtom(TYPE.JSPROTO)) {
      if (BVAL) {
        VAL=VAL.$;
        if (isUndefined(VAL)) error("_create::VAL.$");
      }
      if (jsprotoIsAtom(TYPE_.JSPROTO) && !BVAL) RES=TYPE_.JSPROTO.constructor(VAL); // NOTE: is is the best ?
                                            else RES=new TYPE_.JSPROTO.constructor(VAL);
    }
    else
    if (TYPE.parent()==Nil) RES=new TYPE_.JSPROTO.constructor();
                       else RES=rec(TYPE.parent(),TYPE_,VAL,CONT);
    var ATTRS=TYPE.ATTRS; // Bootstrap: we don't use type.attrs(), here
    for (var I=0;I<length(ATTRS);I++) {
      if (ATTRS[I].QUALIF.has("v")) {
        var VAL0
        if (BVAL && VAL.hasOwnProperty(ATTRS[I].NAME)) VAL0=VAL[ATTRS[I].NAME],done(ATTRS[I].NAME);
                                                  else VAL0=ocopy(ATTRS[I].VAL0);
        if (ATTRS[I].TYPE==num && isString(VAL0)) VAL0=Number(VAL0); // TODO: improve this (boxed VAL0 with attrs), and add all the other conversions
        RES[ATTRS[I].NAME]=VAL0;
      }
    }
    if (isBoxed(RES)) TYPE.method("init").apply(RES,[]); //RES.call(TYPE.method("init")); FIXME: should be able to do it that way, but it interferes in case in RES, call is redefined (as when RES is a server, for example)
    return RES;
  }
  if (!isType(this)) error("_create");
  var RES=rec(this.JSPROTO[SymbolType],this.JSPROTO[SymbolType]);
  if (BVAL && isBoxed(RES)) for (var VAR of VAL.keys()) if (!isDone(VAR)) RES[VAR]=VAL[VAR];
  if (isBoxed(RES)) {
    _normid(RES);
    if (isDefined(CONT)) CONT.store(RES);
  }
  return RES;
}

// Addrs
origin.qualif=tset("qualif",[
  "v", // Var
  "c", // Const
  "i", // Immediate
  "p", // Public
  "a", // Parm
  "*", // Multi
  "!", // Set
  ">", // PO
  "l", // Volatile
  "k"  // Key
]);

origin.isQualif=function (O) {
  return isa(O,qualif);
}

type(function (NAME,TYPE,QUALIF,VAL0) {
       if (isUndefined(TYPE) && isUndefined(QUALIF)) return addr.obj(NAME);
       else {
         var RES=addr.create();
         RES.assign(NAME,TYPE,QUALIF,VAL0);
         return RES;
       }
     },
     { "NAME":"addr", "PARENT":obj, "ATTRS":[] });

addr.setMethod("assign",function (NAME,TYPE,QUALIF,VAL0) {
  if (isUndefined(TYPE)) TYPE=obj;
  if (isQualif(QUALIF)) ;
  else
  if (isString(QUALIF)) QUALIF=qualif(QUALIF);
                   else error("addr.assign");
  if (isUndefined(VAL0)) { // TODO: do all other cases
    if (QUALIF.has("*>")) VAL0=arraypo();
    else
    if (QUALIF.has(">")) VAL0=Nil;
  }
  Object.assign(this,{ "NAME":NAME, "TYPE":TYPE, "QUALIF":QUALIF, "VAL0":VAL0 });
});
setprop(addr,"obj",function (S) { // E.g.: cp*! A:num=1234
  S=trim(S," ",True,True);
  var A=splitOnce(S," ",["v",Undefined]);
  if ((typeof sId)!="undefined"/*bootstrap*/ && A[1][0]==sId) {
    if (!contains(A[0],"k")) A[0]+="k"; // TODO: check it's not an immediate or a constant
    A[1]=substring(A[1],1,length(A[1]));
  }
  var Q=qualif(A[0]);
  if (Q.inter("vci")=="") Q=Q.union("v");
  A=splitOnce(A[1],"=",[Undefined,Undefined]);
  var VAL0=eval("(function () { return "+A[1]+"; })()"); // because eval("2+2")==4, but eval("{}")==undefined
  A=splitOnce(A[0],":",[Undefined,"obj"]);
  var NAME=A[0],TYPE=type.getByName(A[1])/* FIXME: when not found, trigger an error, here (?)*/;
  return addr(NAME,TYPE,Q,VAL0);
});

origin.isAddr=function (O) {
  return isa(O,addr);
}

// Types (2)
type.setMethod("attr",function (NAME,INHERITED) {
  var RES=find(this.ATTRS,function (O) { return O.NAME==NAME; });
  if (isUndefined(RES) && INHERITED && !isNil(this.parent())) return this.parent().attr(NAME,1);
  return RES;
});
addr.setMethod("has",function (Q) {
  return this.QUALIF.has(Q);
});
type.setMethod("attrHas",function (NAME,Q) {
  var A=this.attr(NAME,1);
  return isDefined(A) && A.has(Q);
});
  
type.setMethod("setAttr",function (A) {
  if (isString(A)) A=addr(A);
  if (!isAddr(A)) error("setAttr");
  if (!isNil(this.attr(A.NAME))) error("type.setAttr");
  this.ATTRS.push(A);
  if (A.QUALIF.has("k")) {
    if (isDefined(this.KEYA)) error("type::setAttr");
    this.KEYA=A.NAME;
  }
  if (A.QUALIF.has("c")) {
    setprop(this.JSPROTO,A.NAME,A.VAL0,False,True/*False ; FIXME: assigning RO methods to obj prevents other modules to actually redefine methods of the same name ; in that case, it should be R/W, but stay RO for either data attributes, or even all attributes of the class obj*/);
  }
  else
  if (A.QUALIF.has("v>")) {
    setpropgs(this.JSPROTO,A.NAME,_ggetv(A.NAME),_gsetv(A.NAME));
  }
});

type.setMethod("attrs",function () {
  return this.ATTRS;
});
type.setMethod("setAttrs",function (L) {
  for (var I=0;I<length(L);I++) this.setAttr(L[I]);
});

type.setAttrs(["NAME","PARENT","JSPROTO","ATTRS"]);
addr.setAttrs(["NAME","TYPE","QUALIF","VAL0"]);

// Functions
type(function () {
      return func.create();
    },
    { "NAME":"func", "PARENT":obj, "JSPROTO":Function.prototype, "ATTRS":[] });

setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  if (!isFunction(FUNC)) error("setMethod");
  this.setAttr(addr(NAME,func,"c",FUNC));
});

// Objects (1)
/*setprop(obj,"create",function () {
  error("obj.create(!Yet)");
});*/
origin.isObject=function (O) {
  return isBoxed(O);
}

setprop(obj,"getById",function (ID) {
  error("obj.getById(!Yet)");
});

// Objects (2)
origin.create=obj; // Keep this (?)

function isa(O,T) {
  return typeOf(O)==T || typeOf(O).inherits(T);
}
origin.isa=isa;

obj.setMethod("equalAttrs",function (O) {
  var RES=True;
  for (var N in O) if (this[N]!=O[N]) RES=False;
  return RES;
});
obj.setMethod("setAttrs",function (O,NOSLOTS) {
  if (isUndefined(NOSLOTS)) NOSLOTS={};
  var RES=False;
  if (!isUndefined(O)) for (var N in O) if (isUndefined(NOSLOTS[N])) {
    if (this[N]!=O[N]) {
      this[N]=O[N];
      RES=True;
    }
  }
  return RES;
});

obj.setMethod("refByPath",function (P) {
  var O=this,
      L=splitTrim(P,"."),PREVO=O;
  for (var VAR of L) PREVO=O,O=O[VAR];
  return [PREVO,last(L)];
});
obj.setMethod("getByPath",function (P) {
  var R=this.refByPath(P);
  return R[0][R[1]];
});
obj.setMethod("setByPath",function (P,VAL) {
  var R=this.refByPath(P);
  R[0][R[1]]=VAL;
});

var oflags=tset("oflags",[
  "d" // Deleted
]);

var MEMORY;
origin.memory=function () {
  return MEMORY;
}

origin.copy=function (O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("copy");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.copy(O,MODE);
}
origin.move=function (O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("move");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.move(O,MODE);
}

origin.parse=function (S,CONT) {
  return parsef(S,CONT);
}
origin.serialize=function (O,MODE) {
  if (isUndefined(MODE)) MODE="full";
  if (!contains(["full","flat*","flat"],MODE)) error("serialize");
  var FMT=[["*",MODE=="flat*"?"flat":MODE,[]]];
  if (MODE=="flat") {
    sfinit();
    serializefBis(O,"flat",[]);
    return sfresult();
  }
  else return serializef(O,FMT);
}
obj.setMethod("serialize",function (MODE) {
  return serialize([this],MODE);
});

origin.isDeleted=function (O) {
  return O.hasFlags("d");
}
obj.setMethod("delete",function (MODE) { // TODO: detect loops
  if (isUndefined(MODE)) MODE="flat";
  if (isUnboxed(this)) return;
  var ISARR=isArray(this);
  for (var N of _keys(this)) {
    var VAL=this[N],PO=True;
    if (!(ISARR && isNumStr(N))) PO=typeOf(this).attrHas(N,">");
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("delete(!PO)::"+N);
    if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL.delete(MODE);
    }
  }
  this.addFlags("d");
});
setprop(obj,"delete",function (O,MODE) {
  if (isUnboxed(O)) O.delete(MODE);
});

// Trees
origin.tree=function (A,CONT) {
  if (isAtom(A) || constructor(A)!=Array && !isTemplate(A)/*FIXME: tree() should not need to know exceptional datatypes like template()*/ || length(A)<1 || !isType(A[0])) return A; // FIXME: should not return the array as such when there is no tag, there should be a default datatype (e.g. div, or columns (?) for markup)
  var O={};
  Object.assign(O,length(A)==1?{}:A[1]);
  if (constructor(O)!=Object) error("tree(1)");
  O.$=[];
  for (var I=2;I<length(A);I++) { // FIXME: should be able to work by means of doing directly push()es in RES.$ ; currently, it shits because of the expand(), which is only used in the constructor.
    var VAL=A[I];
    if (isUndefined(A[0].NOEVAL["$"])) VAL=tree(VAL,CONT);
    O.$.push(VAL);
  }
  var RES=A[0](O,CONT);
  if (!isArray(RES["$"]) && length(A)>2) error("tree(2)");
  return RES;
}

// Misc.
function type0(CONS,NAME,JSTYPE,PARENT) { // FIXME: make it 1st class
  CONS.NAME=NAME;
  CONS.PARENT=PARENT;
  CONS.JSPROTO=jsprotoCreate(JSTYPE,CONS,PARENT);
  CONS.JSPROTO[SymbolType]=CONS;
  Object.setPrototypeOf(CONS,TYPEPROTO);
  CONS.ATTRS=[];
  CONS.create=(function (VAL,CONT) {
                 return _create.apply(CONS.JSPROTO[SymbolType],[VAL,CONT]);
               });
}
