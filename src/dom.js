/*
 * dom.js
 *
 * Copyright (C) Henri Lesourd 2014, 2018, 2019, 2020.
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

// Dom elements
var ELEMENT_NODE=1,
    ATTRIBUTE_NODE=2,
    TEXT_NODE=3,
    CDATA_SECTION_NODE=4,
    ENTITY_REFERENCE_NODE=5,
    ENTITY_NODE=6,
    PROCESSING_INSTRUCTION_NODE=7,
    COMMENT_NODE=8,
    DOCUMENT_NODE=9,
    DOCUMENT_TYPE_NODE=10,
    DOCUMENT_FRAGMENT_NODE=11,
    NOTATION_NODE=12;

var DomElement={},DomList={};

if (SERVER) {
  function dom(TAG,VAL) {
    if (!isString(TAG)) error("dom.cons(0)");
    var RES=dom.create(); // TODO: check this
    if (TAG=="#text") {
      if (!isString(VAL)) error("dom.cons(1)");
      RES.nodeType=TEXT_NODE;
    }
    else {
    //if (/*TODO: check TAG is an actual HTML tag*/) error("physdom.cons(2)");
      RES.nodeType=ELEMENT_NODE;
      RES.nodeName=TAG;
      RES.childNodes=[];
      RES.style={};
    }
    
    return RES;
  }
}
else {
  function dom(TAG,VAL) {
    if (!isString(TAG)) error("dom.cons(0)");
    if (TAG=="#text") {
      if (!isString(VAL)) error("dom.cons(1)");
      return document.createTextNode(VAL);
    }
    else {
    //if (/*TODO: check TAG is an actual HTML tag*/) error("physdom.cons(2)");
      return document.createElement(TAG);
    }
  }
  (function () {
     var DIV=dom("div");
     DomElement=constructor(prototype(prototype(prototype(DIV)))); // TODO: check that this is robust
     DomList=constructor(DIV.childNodes);
  })();
}
origin.dom=dom;
function doml() { error("doml"); }
type0(dom,"dom",DomElement.prototype,obj);
type0(doml,"doml",DomList.prototype,obj);

origin.isDom=function (O) {
  return isa(O,dom);
}
origin.isDomTextNode=function (O) {
  return isDom(O) && O.nodeType==TEXT_NODE;
}
origin.isDomElement=function (O) {
  return isDom(O) && O.nodeType==ELEMENT_NODE;
}

setprop(dom,"getById",function (ID) {
  if (SERVER) return Undefined; // TODO: implement indexing by ID 
         else return document.getElementById(ID);
});
setprop(dom,"getByName",function (NAME) {
  if (SERVER) return []; // TODO: implement indexing by TagName
         else return document.getElementsByTagName(NAME);
});
setprop(dom,"getElementsByClassName",function (CLASS) {
  if (SERVER) return []; // TODO: implement indexing by ClassName
         else return document.getElementsByClassName(CLASS);
});
setprop(dom,"root",function () {
  if (SERVER) return Undefined; // TODO: implement DOM root
         else return document.documentElement;
});
setprop(dom,"body",function () {
  if (SERVER) return Undefined; // TODO: implement DOM root
         else return document.body;
});

if (SERVER) {
  dom.setAccessor("parentNode",function () {
    return this[SymbolUp];
  },
  function () {
    error("dom.parentNode.set");
  });
  dom.setMethod("getAttribute",function (NAME) {
    return this[lcase(NAME)];
  });
  dom.setMethod("setAttribute",function (NAME,VAL) {
    this[lcase(NAME)]=VAL;
  });
  dom.setMethod("removeAttribute",function (NAME) {
    delete this[lcase(NAME)];
  });
  dom.setMethod("appendChild",function (E) {
  });
  dom.setMethod("insertBefore",function (NEW,E) {
  });
  dom.setMethod("insertAfter",function (NEW,E) {
  });
  dom.setMethod("replaceChild",function (E,OLD) {
  });
  dom.setMethod("removeChild",function (E) {
  });
}

dom.setMethod("up",function () {
  return this.parentNode;
});
var _BOOLATTRS={ "hidden":1 };
dom.setMethod("getv",function (NAME) { // FIXME: test that NAME is appropriate
  if (isDomElement(this)) {
    var VAL=this.getAttribute(NAME);
    if (NAME in _BOOLATTRS) {
      return isNil(VAL)?"0":"1";
    }
    else return VAL;
  }
  return this[NAME];
});
dom.setMethod("setv",function (NAME,VAL) { // FIXME: should not accept null as a value
  if (isDomElement(this)) {
    if (NAME in _BOOLATTRS) {
      if (isUndefined(VAL) || isFalse(VAL)) this.removeAttribute(NAME);
                                       else this.setAttribute(NAME,"1");
    }
    else this.setAttribute(NAME,VAL);
  }
  this[NAME]=VAL;
});

dom.setMethod("tag",function () {
  return lcase(this.nodeName);
});
dom.setMethod("categ",function () {
  return this.nodeType;
});

dom.setAccessor("$",function () {
  this.childNodes[SymbolUp]=this;/*TODO: check if it is robust*/ // Hmmm ...
  return this.childNodes;
},
function () {
  error("dom.$.set");
});
doml.setMethod("up",function () {
  return this[SymbolUp];
});
doml.setMethod("push",function (E) {
  var UP=this.up();
  if (isUndefined(UP)) error("doml.push");
  UP.appendChild(E); 
});

// Dom (class)
dom.setMethod("hasClass",function (CLA) {
  var CLA0=this.getv("class");
  if (!CLA0) return False;
  return acontainsAll(splitTrim(CLA0," "),splitTrim(CLA," "));
});
dom.setMethod("spliceClass",function (ADD,RM) {
  var L=atrim(splitTrim(this.getv("class")," "),splitTrim(RM," "));
  this.setv("class",L.concat(splitTrim(ADD," ")).join(" "));
});
dom.setMethod("upClass",function (CLA) {
  var E=this;
  while (E!=Nil) {
    if (E.hasClass(CLA)) return E;
    E=E.up();
  }
  return Nil;
});

// Dom (log & debug)
setprop(dom,"log",function (LEVEL) {
  if (isUndefined(LEVEL)) return dom.LOGLEVEL;
  dom.LOGLEVEL=LEVEL;
});
setprop(dom,"bkt",function () {
  return dom.BACKTRACE;
});
dom.LOGLEVEL=0;
dom.BACKTRACE=[];

// Dom (focus)
var _DOMFOCUS=Nil;
setprop(dom,"focussed",function () {
  return _DOMFOCUS;
});
setprop(dom,"focus",function (E) {
  E.focus();
  _DOMFOCUS=E;
});

// Dom (events)
var _SHIFT=False,_CTRL=False,_ALT=False;
setprop(dom,"event",function (EVT) {
  var TARGET=EVT.target;
//alert("dom.event<"+display(TARGET.id)+";"+TARGET.nodeName+"> "+EVT.type+" "+EVT.charCode);
  if (TARGET.tag()=="html") TARGET=dom.body(); // NOTE: Firefox hack, due to the fact that the HTML element is catching the events
  var EVT2=new event(EVT.type,TARGET,EVT),EVT3=Nil;
  if (EVT.type=="keydown" || EVT.type=="keyup" || EVT.type=="keypress") {
    if (EVT.shiftKey!=Nil) _SHIFT=EVT.shiftKey;
    if (EVT.ctrlKey!=Nil) _CTRL=EVT.ctrlKey;
    if (EVT.altKey!=Nil) _ALT=EVT.altKey;
    EVT2.KEY=keyboardGetAscii(EVT.shiftKey,EVT.charCode,EVT.keyCode);
    EVT2.SCANCODE=EVT.keyCode;
    if (EVT.type=="keydown" && EVT2.KEY!=Nil
     && EVT.keyIdentifier!=Nil && EVT.keyIdentifier.substring(0,2)!="U+") { // TODO: Check that testing "U+" always generates the missing keypress correctly
      EVT3=new event("keypress",TARGET,EVT);
      EVT3.KEY=EVT2.KEY;
      EVT3.SCANCODE=EVT2.SCANCODE;
      EVT3.SHIFT=_SHIFT;
      EVT3.CTRL=_CTRL;
      EVT3.ALT=_ALT;
    }
    if (EVT2.KEY==Nil) EVT2.KEY=EVT2.SCANCODE;
  }
  if (EVT.type=="click" || EVT.type=="mousemove") {
    if (EVT.type=="click") EVT2.KEY=KeyClick;
    if (EVT.type=="move") EVT2.KEY=KeyMove;
    EVT2.X=0; // EVT.clientX-TARGET.x(); // FIXME: implement x(), y()
    EVT2.Y=0; // EVT.clientY-TARGET.y();
  }
  EVT2.SHIFT=_SHIFT;
  EVT2.CTRL=_CTRL;
  EVT2.ALT=_ALT;
  if (EVT3!=Nil) return EVT3;
  if (EVT2.TAG=="keyup"
   || EVT2.TAG=="keydown" && (keyboardIsChar(EVT2.KEY) || EVT2.KEY==KeyReturn/*FIXME: hack ; it's because return returns two events, just like normal keys ; nevertheless, you don't want it to be a normal char*/)) return Nil;
  if (EVT2.TAG=="keydown") EVT2.TAG="keypress";
  return EVT2;
});

// Dom (parsing events & targets attribute values)
setprop(dom,"parseEvent",function (E) {
  var A=splitTrim(E,"=>");
  return [splitTrim(A[0],"|"),splitTrim(A[1],"&")];
});
setprop(dom,"parseLEvent",function (L) {
  if (isString(L)) L=splitTrim(L,";");
  if (!isArray(L)) error("dom.parseLEvent");
  return L.map(dom.parseEvent);
});
setprop(dom,"eventMatch",function (E,KEY) {
  var LHS=E[0],S=keyToStr(KEY);
//alert(LHS[0]+" "+S+" "+KEY);
  for (var I in LHS) {
    if (LHS[I]=="alpha" && keyboardIsChar(KEY) && strIsAlpha(S)) return True;
    if (LHS[I]=="num" && keyboardIsChar(KEY) && strIsNum(S)) return True;
    if (LHS[I]==S) return True;
  }
  return False;
});
setprop(dom,"leventMatch",function (L,KEY) {
  for (var I in L) if (dom.eventMatch(L[I],KEY)) return L[I];
  return Nil;
});

setprop(dom,"parseTarget",function (L,T) {
  var A=splitTrim(T,":"),L2=L[A[0]];
  if (isUndefined(L2)) L2=[],L[A[0]]=L2;
  A.shift();
  L2.push(unsplit(A,":"))
});
setprop(dom,"parseLTarget",function (L) {
  if (isString(L)) L=splitTrim(L,";");
  if (!isArray(L)) return L;
  var RES={};
  for (var T of L) dom.parseTarget(RES,T);
  return RES;
});

// Dom (propagate)
setprop(dom,"evalTarget",function (TARGET,EXPR) {
  if (!isString(EXPR) || length(EXPR)==0) error("dom.evalTarget");
  var O=Nil;
  if (EXPR=="$") O=TARGET;
  else {
    var ID;
    if (EXPR[0]=="#") ID=substring(EXPR,1,length(EXPR));
    if (ID) O=domext.getById(ID);
  }
  return O;
});
setprop(dom,"evalFn",function (ACTION,RAW) {
  var FN=splitTrim(ACTION,"!")[0];
  if (!RAW) {
    if (FN=="focus") FN="focus_";
  }
  return FN;
});
setprop(dom,"defaultParm",function (ACTION) {
  switch (ACTION) {
    case "load": return "^"; // TODO: replace "^" by "$.obj", or ".obj"
    case "add": return "^";
    case "mode": return "^";
    case "alert": return "^";
    case "save": return "";
    case "focus": return "_^"; // Hmm ...
    default: return "_^"; // E.g. focus() ; en fait, focus() ne prend aucun parametre, c'est moveTo(), le focus qui permet de deplacer le curseur a l'interieur d'un element, et focus() l'action qui permet de lui transmettre le jeton. Eventuellement, O.focus(TARGET) est en fait <=> a O.moveTo(TARGET),O.focus() <=> O.moveTo(TARGET)&focus()
  }
});
function evalObj(E,ESTOP) {
  var VAL;
  while (E!=Nil && E!=ESTOP && isNil(VAL)) {
    if (!(E.tag()=="input" && E.getv("type")=="button")) VAL=E.getv("value");
    E=E.up();
  }
  return VAL;
}
origin.DOMT=0;
setprop(dom,"evalParm",function (ACTION,PARM,THIS,TARGET) {
  var A=ACTION.split("!"); // FIXME: replace .split() by splitTrim() (?)
  ACTION=A[0];
  if (length(A)>1) PARM=A[1];
  if (PARM=="") PARM=dom.defaultParm(ACTION);
  switch (PARM) {
    case "$": return THIS;
    case "*": return THIS.collect()/*FIXME: hmm, see how we can disambiguate collect()s stemming from forms, and collect()s stemming from an edit view*/;
    case "^": return evalObj(TARGET,THIS);
    case "_^": return TARGET;
    case "$t": return DOMT++;
    case "": return Nil;
    default: return PARM; //error("dom.evalParm");
  }
});
setprop(dom,"propagate",function (EVT) { // FIXME: make all that more concise & organized
  EVT=dom.event(EVT);
  if (EVT==Nil) return;
  if (dom.focussed()!=Nil
   && (EVT.TAG=="keydown" || EVT.TAG=="keyup" || EVT.TAG=="keypress")) EVT.TARGET=dom.focussed();
  if (dom.log()>0) dom.BACKTRACE=[];
  if (dom.log()==2) alert("dom.propagate "+EVT.TARGET.id+" "+EVT.TAG.toString()+" "+EVT.KEY);
  var E=EVT.TARGET,
      EVTS,ACTION;
  while (E!=Nil && isNil(ACTION)) {
    var EVTS=E.getv("events");
    if (!isNil(EVTS)) {
      EVTS=dom.parseLEvent(EVTS);
      ACTION=dom.leventMatch(EVTS,EVT.KEY);
    }
    E=E.up();
  }
  if (isNil(ACTION)) return;
  if (dom.log()==2) alert("Action "+display(ACTION));
  _LASTEVENT=EVT; // FIXME: put it there (?)
  ACTION=ACTION[1];
  E=EVT.TARGET;
  var TARGETA,TARGET,TGTS;
  while (E!=Nil && isNil(TARGETA)) {
    TGTS=E.getv("targets");
    if (!isNil(TGTS)) {
      TGTS=dom.parseLTarget(TGTS);
      TARGETA=TGTS[dom.evalFn(ACTION[0],1)];
      TARGET=E;
    }
    E=E.up();
  }
  if (isNil(TARGETA)) return;
  function doit(L,ACTION) {
    if (isNil(L)) return;
    if (!isArray(L)) L=[L];
    for (var MSG of L) {
      var A=splitTrim(MSG,"!"),PARM="",
          TARGETA=A[0];
      if (length(A)>1) PARM=A[1];
      TARGETA=dom.evalTarget(TARGET,TARGETA);
      if (isNil(TARGETA)) error("dom.propagate(1)");
      if (dom.log()==2) alert("Target "+TARGETA.id+" "+display(ACTION)+" "+EVT.TARGET.id);
      var FIRST=1;
   // FIXME: if there is a collect, apply it only on the first parm, or in any case, calculate it only once
      for (var I in ACTION) {
        var FN=dom.evalFn(ACTION[I]);
        if (isFunction(TARGETA[FN])) {
          TARGETA[FN](dom.evalParm(ACTION[I],PARM,TARGET,EVT.TARGET));
        }
        else
        if (FIRST) error("dom.propagate(2)");
              else doit(TGTS[dom.evalFn(ACTION[I],1)],[dom.evalFn(ACTION[I],1)/*FIXME: pick parms from the original action, here*/]);
        FIRST=0;
      }
    }
  }
  doit(TARGETA,ACTION);
});

// Dom (collect, patch)
dom.setMethod("collect",function () {
  var RES={},N=0,W0=this;
  function traverse(W) {
    if (isDomTextNode(W) || W.tag()=="form" && W!=W0) return;
    var TY;
    if (isDomElement(W) && W.tag()=="input" && contains(["hidden","text","date","radio","checkbox"],TY=W.getv("type"))) {
      var NAME=W.getv("name"),VALUE=W["value"]/*FIXME: clear that *shit* once for all !!!*/;
      if (isNil(NAME)) NAME="in"+N,N++; // TODO: Ignore Nil names (?)
      if (!startsWith(NAME,"-")) {
        if (isNil(VALUE)) VALUE="";
        if (TY=="checkbox") RES[NAME]=W.checked;
        else
        if (TY!="radio" || W["checked"]) RES[NAME]=VALUE;
      }
    }
    for (var I=0;I<length(W.$);I++) traverse(W.$[I]);
  }
  traverse(this);
  if ("msg" in this.attributes) { // TODO: poor man's template ; restore full templating
    var VAR=this.getv("msg");
    if (VAR[0]!="$") error("dom.load::msg");
    VAR=substring(VAR,1,length(VAR));
    RES=RES[VAR];
  }
  return RES;
});
setprop(dom,"patch",function (HTML) {
  var DIV=dom(startsWith(HTML,"<tr") || startsWith(HTML,"<td")?"tbody":"div"/*FIXME: hmmmm...*/); // NOTE: due to the shitty stripping of the embedded HTML parser
  DIV.innerHTML=HTML;
  var ELT=DIV.$[0];
  if (isUndefined(ELT)) return; // TODO: detect and remove all possibilities of having incorrect patches
  var ID=ELT.getv("id");
  if (isUndefined(ID)) return;
  ELT=dom.getById(ID);
  if (isUndefined(ELT)) return;
  ELT.up().replaceChild(DIV.$[0],dom.getById(ID));
});

// Dom (volatile methods)
dom.setMethod("alert",function (MSG) {
  if (!isString(MSG)) MSG=pretty(MSG);
  alert(MSG);
});
function ldo(E,O) {
  function traverse(W) {
    if (isDomTextNode(W)) return;
    var TY;
    if (isDomElement(W) && W.tag()=="input" && contains(["hidden","text","date"],TY=W.getv("type"))) {
      var NAME=W.getv("name");
      if (isString(NAME)) {
        var VAL=O[NAME];
        if (isString(VAL) || isNumStr(VAL)) W.setv("value",VAL);
      }
    }
    for (var I=0;I<length(W.$);I++) traverse(W.$[I]);
  }
  traverse(E);
}
dom.setMethod("load",function (VAL) { // TODO: extend dispatch to enable variations of load & other methods
  if (!isString(VAL) && !isNumStr(VAL)) return; //error("dom.load");
  if (isString(VAL)) {
    if (length(VAL)==0) return;
    if (VAL[0]=="{") { ldo(this,parse(VAL)[0]);return; }
  }
  if ("value" in this.attributes) this.setv("value",VAL.toString());
                             else this.innerHTML=VAL;
});
dom.setMethod("focus_",function () {
  if (this.hasClass("tab")) this.tabFocus(); // TODO: improve this (do a proper class for tabs)
//error("Focussing::"+E.getv("id"));
});

// Dom (volatile methods ; tabs)
dom.setMethod("tabFocus",function () {
  var TABS=this.upClass("tabs"),L={};
  for (var E of TABS.$) if (E.hasClass("tab")) {
    var ID=E.getv("id");
    if (ID) {
      L[ID]=E==this;
    }
    if (E==this) E.spliceClass("","hidden");
            else E.spliceClass("hidden","");
  }
  var TABBS=document.getElementsByClassName("tabb");
  for (var E of TABBS) {
    var LT=dom.parseLTarget(E.getv("targets"));
    if (LT) LT=LT["focus"];
    if (LT) for (var T of LT) {
      T=splitTrim(T,"!")[0];
      T=substring(T,1,length(T));
      if (isDefined(L[T])) if (L[T]) E.spliceClass("selected","");
                                else E.spliceClass("","selected");
    }
  }
});

// Domext (external elements)
type(Nil,
     { NAME:"domext", PARENT:obj, ATTRS:[] });

setprop(domext,"getById",function (ID) {
  var RES;
  if (isNil(ID)) ;
  else
  if (SERVER) ; // TODO: implement indexing by ID 
  else {
    RES=dom.getById(ID);
    if (!RES) RES=domext({}),RES["id"]=ID; // TODO: replace that when views will be available
  }
  return RES;
});

setprop(domext,"submit",function (ID,ATTRS) {
  ; // S'il y a deja un thread actif dans CLI_SRV, ignorer l'evenement
  thread(server.CLI_SRV,async function () { // FIXME: prevent calls to server.CLI_SRV when the async all to _connect is not finished ; queue them (?)
    var HTML=await server.CLI_SRV.call("_submit",{ METHOD:"POST", ACCEPT:"text/html" },[ID,ATTRS]);
    dom.patch(HTML);
  });
});
domext.setMethod("load",function (VAL) {
  var ID=this["id"];
  if (isUndefined(ID)) error("domext.load(ID)");
  domext.submit(ID,{ value:VAL });
});
domext.setMethod("save",function () {
});

// Init
if (!SERVER) {
  document.addEventListener("keyup",dom.propagate,false);
  document.addEventListener("keydown",dom.propagate,false);
  document.addEventListener("keypress",dom.propagate,false);
  document.addEventListener("click",dom.propagate,false);
//document.addEventListener("mousemove",dom.propagate,false);
}
