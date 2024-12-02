/*
 * iobjects.js
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

// Symbols
declare({ sPO  :"\u03c9",    // Part-of (greek letter omega)
          sIdx :"\u03b9",    // Indexed (greek letter iota)
          sUpi :"\u03af",    // Ilink   (greek letter iota with acute accent)
          sProx:"\u03e6",    // Proxy   (coptic capital letter Khei)
          sSelf:"\u00a7",    // Self
          sId  :"\u2640" }); // Unique identifier (to optionally be used instead of SymbolId)
origin   .sUp  =sPO;         // Up

// Props
function prop(TY,VAL,OBJ,POS,PREV,NEXT,FIRST) {
  var RES={};
  RES[sType]=TY;
  RES.VAL=VAL;
  RES.OBJ=OBJ;
  RES.POS=POS;
  if (TY==sIdx) {
    RES.PREV=PREV;
    RES.NEXT=NEXT;
    RES.FIRST=isTrue(First);
  }
  return RES;
}
function proppo(VAL,O,POS) {
  var TY=sPO;
  if (typeOf(O).attrHas(POS,"*>")) TY=sPO+"*";
  if (isNil(VAL) && TY==sPO+"*") VAL=arraypo();
  return prop(TY,VAL,O,POS);
}
function propi(VAL,O,POS,PREV,NEXT) {
  return prop(sIdx,VAL,O,POS,PREV,NEXT);
}

function isProppo(PROP) {
  return PROP[sType][0]==sPO;
}
function isPropmpo(PROP) {
  return PROP[sType]==sPO+"*";
}
function isPropi(PROP) {
  return PROP[sType]==sIdx;
}

function propiInsertBefore(P0,P) {
}
function propiUnlink(P) {
}

// Getters & setters (PO)
function _getpo(O,POS) {
  return O[POS].VAL;
}
function _getopo(O,POS) {
  return _getpo(O,sPO+POS);
}

function _setpo(O,POS,VAL) {
  var PROP=O[POS];
  if (isUndefined(PROP)) PROP=proppo(Nil,isDefined(O[sProx])?O[sProx]:O,
                                         POS[0]==sPO?substring(POS,1,length(POS)):POS);
//if (isUndefined(O[POS])) setpropgs(O,POS,_ggetv(POS),_gsetv(POS)); // TODO: turn that to an error, later
  _detachpo(PROP);
  _attachpo(PROP,VAL);
  if (PROP) O[POS]=PROP;
  return VAL;
}
function _setopo(O,POS,VAL) {
  return _setpo(O,sPO+POS,VAL);
}
function _detachpo(PROP) {
  if (isPropmpo(PROP)) return;
  var VAL=PROP.VAL;
  if (isDefined(VAL)) {
    if (!eqNil(VAL)) {
      if (isUnboxed(VAL) || isUndefined(VAL[sPO])) error("_detachpo");
      delete VAL[sPO];
    }
    PROP.VAL=Nil;
  }
}
function _attachpo(PROP,VAL) {
  if (isUndefined(PROP)) error("_attachpo(1)");
  if (isUnboxed(VAL)) {
    if (!isNil(VAL)) error("_attachpo(2) ==> "+pretty(VAL));
    VAL=Nil;
  }
  if (!isPropmpo(PROP) && !isNil(PROP.VAL) || isUndefined(PROP.POS)) error("_attachpo(3)");
  if (isPropmpo(PROP)) VAL=arraypo(VAL);
  PROP.VAL=VAL;
  if (VAL!=Nil) {
    if (isDefined(_getUp(VAL))) error("_attachpo(4)"); // NOTE: is a move ; check everything is okay containerwise otherwise move()
    VAL[sPO]=PROP;
  }
}
function _getUp(O,FULLREF,CLOSEST) {
  var REF=O[sPO];
  if (REF==Undefined) return REF;
  /*if (CLOSEST)*/ return FULLREF?REF:REF.OBJ;
  //return _getUp(REF.OBJ,FULLREF,1);
}

// Getters & setters (Indx)
function _geti(O,POS) {
  return O[sIdx+POS].VAL;
}
function _seti(O,POS,VAL) {
  O[sIdx+POS].VAL=VAL;
  return VAL;
}

function _getUpi(O) {
  return O[sUpi];
}

// Common methods
function _detach(O) {
  var PROP=_getUp(O,1);
  if (PROP) {
    if (isProppo(PROP)) _detachpo(PROP);
    if (isPropi(PROP)) _detachi(PROP);
  }
}

// Proxies
function proxy(O,HANDLER) {
  var RES=new Proxy(O,HANDLER);
  O[sProx]=RES;
  O[sSelf]=O; // NOTE: to be removed in production
  return RES;
}

// ArrayPO
var arraypo=type(function (O,CONT) {
                   if (isContainer(O)) {
                     if (isDefined(CONT)) error("arraypo");
                     CONT=O,O=[];
                   }
                   if (isUndefined(O)) O=[];
                   var A=arraypo.create([],CONT);
                       PR=proxy(A,{ get:_getapo,
                                    set:_setapo });
                   for (var I of _keys(O)) PR[I]=O[I]; // TODO: handle creation from an arraypo, too (?)
                   return PR;
                 },
                 { "NAME":"arraypo", "PARENT":array });

function isArrayPO(A) {
  return typeOf(A)==arraypo;
}

function _getapo(O,POS) {
  if (isNumStr(POS)) return _getpo(O,POS);
                else return O[POS];
}
function _setapo(O,POS,VAL) {
  if (isNumStr(POS)) _setpo(O,POS,VAL);
                else O[POS]=VAL;
  return VAL;
}
// Copy
function _keysXsymbs() {
  return [sPO,sProx,sSelf,sUp];
}
function _keys(O) {
  var RES=Object.getOwnPropertyNames(O)
                .map(function (S) {
                       if (S[0]==sPO) S=substring(S,1,length(S));
                       return S;
                     })
                .filter(function (X) {
                          return X!="" && !contains(_keysXsymbs(),X)
                              && X!=SymbolId && X!=SymbolUp && X!=SymbolCont
                              && X!="length";
                        })
              /*.concat(Object.getOwnPropertySymbols(O))*/;
  return rmdupvals(RES);
}

function _copy(CONT,O,MODE) {
  if (isUndefined(MODE)) MODE="flat";
  var T=typeOf(O);
  if (isUnboxed(O) || isFunction(O) || isType(O)/*TODO: check the cases Function or Type*/) return O;
  var ISARR=isArray(O);
  var O2=ISARR?[]:{};
  for (var N of _keys(O)) {
    var VAL=O[N],PO=False;
    if (!(ISARR && isNumStr(N))) PO=T.attrHas(N,">");
    var VAL2=VAL;
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("copy(!PO)::"+N); // FIXME: copy while keeping the references ? If the referred objects are in the same container, it should be okay.
    if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL2=_copy(CONT,VAL,MODE);
    }
    O2[N]=VAL2;
  }
  return T(O2,CONT);
}

// Object
setprop(obj,"getUp",_getUp);
setprop(obj,"getpo",_getopo);
setprop(obj,"setpo",_setopo);
setprop(obj,"_keys",_keys);
setprop(obj,"_copy",_copy);
setprop(obj,"oflags",oflags);
setprop(obj,"proxy",proxy);
