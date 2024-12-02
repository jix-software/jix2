/*
 * serializef.js
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

// Store
var sSymb="\u03c3",sHSymb="\u03b7",
    _SFID,_SFOBJ;
function sfid(HIDDEN) {
  HIDDEN=isDefined(HIDDEN);
  return (HIDDEN?sHSymb:sSymb)+_SFID++;
}
function sfisHiddenId(ID) {
  if (!isNumber(ID) && !isString(ID)) outd(ID),cr(),error("sfisHiddenId");
  return ID[0]==sHSymb;
}
function sfisLocId(ID) {
  if (!isNumber(ID) && !isString(ID)) error("sfisLocId");
  return ID[0]==sHSymb || ID[0]==sSymb;
}
function sffetch(ID) {
  return _SFOBJ[ID];
}
function sfoid(O) {
  if (!contains(Object.getOwnPropertySymbols(O),SymbolId)) return Undefined;
  return O[SymbolId];
}
function sfstore(O,HIDDEN) {
  if (isUnboxed(O) || isRootAtom(O)) return;
  var ID=sfoid(O);
  if (isUndefined(ID)) ID=sfid(isAtom(O)?True:HIDDEN);
                  else if (isDefined(sffetch(ID))) return;
  O[SymbolId]=ID;
  _SFOBJ[ID]=O;
}
function sfrelease() {
  for (N in _SFOBJ) {
    if (sfisLocId(N)) delete sffetch(N)[SymbolId];
  }
}
function sfinit() {
  _SFID=0;
  _SFOBJ={};
  _SFLANG="json";
  _SFOUT=[];
  _SFDONE={};
  _SFFIRST=True;
  _SFINDENT=0;
}

// Parse
origin.sexprToObj=function (L0,CONT,FULL) { // TODO: add parsing syntax & creating objects for slotnames with '.' inside
  function rec(L,FULL) {
    if (isAtom(L)) return L;
    if (!isArray(L)) error("sexprToObj");
    var I=1,N=length(L),
        RES=L[0]=="array"?[]:{};
    RES[sType]=L[0];
    var ISTYPE=L[0]=="type"; // FIXME: for types whose constructor _interprets_ the VAL, then we should not do full recurse. Find a way to make detecting it and do the right thing fully automatic
    while (I<N) {
      var VAL=L[I];
      if (isString(VAL) && VAL[0]==":") {
        RES[substring(VAL,1,length(VAL))]=rec(L[I+1],ISTYPE?False:FULL);
        I++;
      }
      else {
        VAL=rec(VAL,ISTYPE?False:FULL);
        if (isArray(RES)) RES.push(VAL);
        else {
          if (isUndefined(RES.$)) RES.$=[];
          RES.$.push(VAL);
        }
      }
      I++;
    }
    if (FULL) {
      if (ISTYPE) {
        var NAME=RES.NAME,PARENT=RES.PARENT,TYPE;
        if (isDefined(NAME)) TYPE=type.getByName(NAME);
        if (1/*isUndefined(TYPE)*/) { // FIXME: it's recreating it each time ; when already exists, match types
          if (!isNil(PARENT)) {
            PARENT=type.getByName(PARENT);
            if (isUndefined(PARENT)) error("sexprToObj::FULL(type)=>"+pretty(RES.PARENT));
            RES.PARENT=PARENT;
          }
          delete RES[sType]; // NOTE: not very nice to modify the input to hide sType from type()
          if (isDefined(RES.ATTRS)) RES.ATTRS=RES.ATTRS.map(function (S) {
            if (contains(S,":")) {
              var A=splitTrim(S,":"),TY=A[1],Q,I=0;
              while (I<length(TY) && !charIsAlpha(TY[I])) I++;
              if (I>=length(TY)) error("sexprToObj::type");
              Q=substring(TY,0,I);
              TY=substring(TY,I,length(TY));
              S=Q+" "+A[0]+":"+TY;
            }
            return S;
          });
          TYPE=type(Nil,RES); // FIXME: the addrs are not parsed correctly by the type() constructor
        }
        RES=TYPE;
      }
      else {
      /*if (isDefined(CONT) && RES.getId()) {
          obj.assign(CONT.getById(RES.getId()),RES); // assign() checks that the two types fit
        }
        else {*/
          var TYPE=type.getByName(RES[sType]);
          if (isUndefined(TYPE)) TYPE=type(Nil,{ NAME:RES[sType], PARENT:obj })/*TODO: find a better way*/; //error("sexprToObj::FULL(type)(2)=>"+pretty(RES[sType]));
          delete RES[sType]; // NOTE: not very nice to modify the input to hide sType from TYPE()
          RES=TYPE(RES,CONT);
      //}
      }
    }
    return RES;
  }
  if (!isNil(CONT) && isAtom(CONT)) FULL=isTrue(CONT),CONT=Undefined;
  if (isDefined(CONT) && !isContainer(CONT)) error("sexprToObj");
  charsInit(); // NOTE: necessary to have parsing type decls work correctly ; improve that
  return rec(L0,FULL);
}

// parsef
origin.parsef=function (S,CONT,LANG) {
  if (isString(CONT)) LANG=CONT,CONT=Undefined;
  if (isUndefined(LANG)) LANG="json";
  if (LANG!="lisp" && LANG!="json") error("parsef(0)");
  var L=S;
  if (isString(S)) {
    L=parseSexpr(S,LANG);
    L=L.map(function (O) { return preprocSexpr(O); });
  }
  return L.map(function (O) { return sexprToObj(O,CONT,1); });
}
origin.parsefStart=function () { // TODO: unused, except in tests ; remove it asap.
  charsInit();
  charnatSet("#",CharNatAlf);
  charnatSet("+",CharNatAlf);
  charnatSet("%",CharNatAlf);
  charnatSet(".",CharNatAlf);
  tokenizeStart("( ) [ ] { } = : ,");
}

// Serialize
var _SFOUT,_SFDONE,_SFFIRST,_SFINDENT;
function sfout(S) {
  _SFOUT.push(S);
  return S;
}
function sfresult() {
  return _SFOUT.join("");
}
function sfattrs(O) {
  return RES=Object.getOwnPropertyNames(O).concat(Object.getOwnPropertySymbols(O)).filter(function (X) {
               return X!=SymbolUp && X!=SymbolCont && X!="TO" /*FIXME: use SymbolTo, instead*/
                   && X!="length" && (!isNumStr(X) || !isAtom(O));
             });
}
var _SFLANG;
function serializefBis(O,MODE,MODES) {
// TODO: implement setting or not setting container id when displaying IDs
// TODO: implement serializing object of a type inheriting from an atomic type
/* TODO: implement adding links for external objects that are outside the border, including UP links
         only for those objects that are not pointed by PO links inside the group of objects we serialize.
         If one of these external objects has no ID, there is an error. */
// TODO: include flags ; do not include the container.
  var ISFIRST,SKIPSPC,SFSDONE;
  function sfslot(N,SMODE) {
    if (isUndefined(SMODE)) SMODE={};
    if ((isAtom(O) && N=="$" || O.hasOwnProperty(N)) && !(N==sy("+o") && sfisHiddenId(O[N]))) {
      var NAME=isSymbol(N)?sy(N):N;
      if (contains(NAME,":")) return; // FIXME: Hack
      if (!SKIPSPC) {
        if (_SFLANG=="json" && !ISFIRST) sfout(",");
        if (isDefined(SMODE["nl"])) sfout("\n"+spc(_SFINDENT));
                               else if (_SFLANG=="lisp") sfout(" ");
      }
      SKIPSPC=False;
      sfout(NAME),sfout(_SFLANG=="lisp"?"=":":");
      if (N=="caller" || N=="callee" || N=="arguments") VAL="<Forbidden>";
      else
      if (isAtom(O) && N=="$") VAL=O.valueOf();
                          else VAL=O[N];
      if (N==sy("+o")) sfout(VAL);
                  else serializefBis(VAL,typeOf(VAL)==type?"name"
                                                          :MODE=="flat" && !isAtom(VAL)?"symb":MODE,MODES);
      ISFIRST=False;
      SFSDONE[N]=1;
    }
  }
  if (isUndefined(O)) return sfout("Undef");
  if (isNil(O)) return sfout("Nil");
  if (isBoolean(O)) return sfout(O?"True":"False");
  if (isNumber(O)) return sfout(O.toString());
  if (isDate(O)) return sfout(O.toString());
  if (typeOf(O)==str) return sfout('"'+strEscape(O)+'"'); // TODO: Strings containing no blanks are serialized as symbols
  if (isFunction(O)) return sfout('<Func>');
  if (isArray(O)) {
    ISFIRST=True;
    sfout("[");
    for (var I=0;I<length(O);I++) {
      if (ISFIRST) ISFIRST=False;
              else sfout(_SFLANG=="lisp"?" ":",");
      serializefBis(O[I],typeOf(O[I])==type?"name":MODE=="flat" && !isAtom(VAL)?"symb":MODE,MODES);
    }
    sfout("]");
  }
  else {
    if (isRootAtom(O)) out(pretty(O)),cr(),error("serializefBis(1)");
    if (MODE=="symb" && isUndefined(sfoid(O))) error("serializefBis(undef ID)");
    var DEFINED=isDefined(_SFDONE[sfoid(O)]);
    sfstore(O,True);
    if (!DEFINED) _SFDONE[sfoid(O)]=O;
    if (MODE=="name") {
      if (!isFunction(O.name)) error("serializefBis(name)");
      return sfout(O.name());
    }
    if (DEFINED || MODE=="symb") return sfout("#"+sfoid(O));
    if (_SFLANG=="lisp") sfout("(");
    if (typeOf(O)!=obj) sfout(typeOf(O).name()); else SKIPSPC=True;
    if (_SFLANG=="json") sfout("{"),SKIPSPC=True;
    _SFINDENT+=2;
    SFSDONE={};
    ISFIRST=True;
    for (var I=0;I<length(MODES);I++) sfslot(MODES[I][0],MODES[I][1]);
    if (isAtom(O)) sfslot("$",{});
    for (var N of sfattrs(O)) if (isUndefined(SFSDONE[N])) sfslot(N,{}); // FIXME: serialize UP if needed
    if (_SFLANG=="lisp") sfout(")");
                    else sfout("}");
    _SFINDENT-=2;
  }
}
function serializefAllOfType(O,TYPE,MODE,MODES,SETID) { // TODO: have a special case with TYPE=="*"
  if (isUndefined(SETID)) SETID=False;
  if (isRootAtom(O) || isFunction(O)) return;
  if (typeOf(O).root()==obj && isDefined(_SFDONE[sfoid(O)])) return;
  if (isArray(O)) {
    for (var I=0;I<length(O);I++) {
      serializefAllOfType(O[I],TYPE,MODE,MODES,SETID);
    }
  }
  else {
    if (SETID) sfstore(O);
    for (var N of sfattrs(O)) {
      if (!isRootAtom(O[N]) && !isArray(O[N]) && MODE!="full"/*TODO: take PO into account here*/) sfstore(O[N]);
    }
    if (!_SFDONE[sfoid(O)] && (TYPE=="*" || typeOf(O)==TYPE)) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O,MODE,MODES);
    }
    for (var N of sfattrs(O)) {
      serializefAllOfType(O[N],TYPE,MODE,MODES,True);
    }
  }
}
origin.serializef=function (O,FMT,LANG) {
  sfinit();
  if (isRootAtom(O)) return serializefBis(O);
  if (isUndefined(LANG)) LANG="json";
  _SFLANG=LANG;
  if (LANG!="lisp" && LANG!="json") error("serializef(0)");
  for (var I=0;I<length(FMT);I++) {
    var F=FMT[I],TYPE="*";
    if (F[0]!="*") TYPE=type.getByName(F[0]);
    if (isUndefined(TYPE)) error("serializef(1)");
    serializefAllOfType(O,TYPE,F[1],F[2]);
  }
  if (isArray(O)) { // FIXME: hack, somehow, to enable traversing graphs of objects while excluding arrays, and in the end, use O as an array to mean : "several objects", not an array to serialize.
    for (var I=0;I<length(O);I++) if (!_SFDONE[sfoid(O[I])]) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O[I],"full",[]);
    }
  }
  else serializefAllOfType(O,"*","full",[]);
  sfrelease();
  return sfresult();
}
