/*
 * sexpr.js
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

// Symbols
declare({ sType:"\u03c4",    // Type     (greek letter tau)
          sFunc:"\u03c6",    // Function (greek letter phi)
          sAord:"\u03bf",    // Ordering (greek letter omicron)
          sSymb:"\u03c3" }); // Symbol   (greek letter sigma)

var _SYMBNO=0;
origin.gensym=function () {
  var RES=sSymb+_SYMBNO;
  _SYMBNO++;
  return RES;
}

// S-Expressions
/* TODO:
   -> indiquer la li,col de la parenthese ouvrante non fermee ;
   -> indiquer la li,col de la parenthese fermante en trop ;
*/
function parseSexprAtom(VAL) {
  if (!isString(VAL)) error("parseSexprAtom"); // Should never happen
  if (VAL=="true" || VAL=="True") return True;
  if (VAL=="false" || VAL=="False") return False;
  if (VAL=="null" || VAL=="Nil") return Nil;
  if (VAL=="undefined" || VAL=="Undefined") return Undefined;
  if (length(VAL)>0 && charIsDigit10(VAL[0])) return Number(VAL);
  return VAL.replace(/\\"/g,'"'); // TODO: add support for \xABCD UTF8 escaped characters
}
var _PSEBEG,_PSEEND,_PSESEP,_PSELET,_PSELISP;
function parseSexprList(L,LANG) {
  var RES=[[]],POSSTACK=[];
  function push(O) {
    var L=last(RES);
    if (isNil(L)) error("parseSexprList::push");
    L.push(O);
  }
  function pushup(L,POS) {
    if (isNil(last(RES))) error("parseSexprList::pushup");
    RES.push(L);
    POSSTACK.push(POS);
  }
  function pushupv(L) {
    if (isNil(last(RES))) error("parseSexprList::pushupv");
    last(RES).push(L);
  }
  function popup(SY) {
    var L=last(RES);
    if (isNil(L)) error("parseSexprList::popup");
    RES.pop();
    if (SY=="(" && length(L)>0 && L[0]==sy("array")) error("parseSexprList::popup(2)");
    if (SY=="[" && (length(L)==0 || L[0]!=sy("array"))) error("parseSexprList::popup(3)");
    if (isNil(last(RES))) error("parseSexprList::popup(4)");
  //if (length(L)==0) L={}; FIXME: should only be active when turning to the {} format
    pushupv(L);
    return POSSTACK.pop();
  }
  function posnext(POS) {
    if (POS=="var") POS="let";
    else
    if (POS=="let") POS="val";
    else
    if (POS=="val") POS="sep";
    else
    if (POS=="sep") POS="var";
    return POS;
  }
  var I=0,N=length(L),FIRST=True,POS="var",NEXTTAG;
  while (I<N) {
  //out(L[I]+"=> "+pretty(RES)),cr();
    if (POS=="let" && _PSESEP!="" && L[I]==_PSESEP) POS="sep";
    if (POS=="let" && L[I]!=_PSELET) POS="sep";
    if (POS=="sep" && _PSESEP=="") POS="var";
    errlicolSet2(L[I]);
    if (!FIRST && _PSESEP!="" && POS=="sep" && !containsVal([_PSEEND,"]"],L[I])) {
      if (L[I]!=_PSESEP) ;//error("parseSexprList::missing '"+_PSESEP+"'"); // TODO: omit separator only at Niv0
      else {
        I++;
        if (I>=N) error("parseSexprList::_PSESEP");
      }
      POS="var";
    }
    FIRST=False;
    if (L[I]==_PSEBEG) pushup(NEXTTAG?[NEXTTAG]:[],POS),POS="var",FIRST=True,NEXTTAG=Undefined;
    else
    if (L[I]=="[") pushup([sy("array")],POS),POS="var",FIRST=True;
    else
    if (L[I]==_PSEEND) POS=posnext(popup("("));
    else
    if (L[I]=="]") POS=posnext(popup("["));
    else
    if (L[I]==_PSELET) {
      if (POS!="let") error("parseSexprList::unexpected '"+_PSELET+"'");
      pushupv(parseSexpr.RAW?_PSELET:sy("="));
      POS="val";
    }
    else {
      if (POS!="var" && POS!="val") error("parseSexprList::Variable or Value expected");
      var VAL=L[I];
      if (POS=="var" && !_PSELISP && I+1<N && L[I+1]==_PSEBEG) {
        if (!strIsAlpha(VAL)) error("parseSexprList::Alphanumeric type name expected=>"+pretty(VAL));
        NEXTTAG=VAL;
      }
      else {
        if (isAtom(VAL)) VAL=parseSexprAtom(VAL);
        pushupv(VAL);
      }
      POS=posnext(POS);
    }
  //out(L[I]+" > "+pretty(RES)),cr();
    I+=1;
  }
  if (length(RES)>1) error("parseSexprList::missing '"+_PSEEND+"'");
  return RES[0];
}

origin.parseSexpr=function (S,LANG,RAW) { // FIXME: remove RAW, at some point
  if (isUndefined(RAW)) {
    if (isDefined(LANG) && !contains(["json","lisp"],LANG)) RAW=LANG,LANG=Undefined;
  }
  if (isUndefined(LANG)) LANG="json";
  if (LANG!="lisp" && LANG!="json") error("parseSexpr::LANG");
  parseSexpr.RAW=isTrue(RAW);
  parseSexprStart(LANG);
  var RES=parseSexprList(tokenize(S));
  parseSexpr.RAW=False;
  return RES;
}
origin.parseSexprStart=function (LANG) {
  charsInit();
  charnatSet("#",CharNatAlf);
  charnatSet("+",CharNatAlf);
  charnatSet("-",CharNatAlf);
  charnatSet("*",CharNatAlf);
  charnatSet("%",CharNatAlf);
  charnatSet("^",CharNatAlf);
  charnatSet(".",CharNatAlf);
  charnatSet(sSymb,CharNatAlf);
  _PSEBEG="{",_PSEEND="}",
  _PSESEP=",",_PSELET=":",
  _PSELISP=False;
  if (LANG=="lisp") {
    _PSEBEG="(",_PSEEND=")",
    _PSESEP="",_PSELET="=",
    _PSELISP=True;
  }
  if (_PSELET!=":") charnatSet(":",CharNatAlf);
  tokenizeStart(_PSEBEG+" "+_PSEEND+" [ ] | "+_PSELET+" "+(_PSESEP!=""?_PSESEP+" ":"")+"...");
}

// Preprocessing
function preprocSexprAtom(VAL) {
  var PP;
  function pp(Q) {
    if (isString(VAL) && length(VAL)>=2 && VAL[0]==Q) {
      if (VAL[length(VAL)-1]!=Q) error("preprocSexprAtom");
      VAL=substring(VAL,1,length(VAL)-1); // FIXME: don't lose licol()
      PP=1;
    }
  }
  pp('"');
  if (!PP) pp("'");
  return VAL;
}
origin.preprocSexpr=function (L,TAG0) {
  if (isUndefined(TAG0)) TAG0="obj";
  if (isAtom(L)) return preprocSexprAtom(L);
  if (!isArray(L)) error("preprocSexpr");
  var I=0,N=length(L),RES=[],
      PUSH=N==0 || !isString(L[0]) && !isSymbol(L[0])
                || N>=2 && L[1]===sy("=");
  if (PUSH) RES.push(TAG0);
  while (I<N) {
    var VAL=L[I];
    if (VAL===sy("=")) error("preprocSexpr(2)");
    if (I==0 && isSymbol(VAL)) VAL=sy(VAL);
    if (I+1<N && L[I+1]===sy("=")) {
      if (!isString(VAL) || I+2>=N) error("preprocSexpr(3)");
      VAL=preprocSexprAtom(VAL); // TODO: improve this ...
      RES.push(":"+VAL);
      I++;
    }
    else RES.push(preprocSexpr(VAL,"obj"));
    I++;
  }
  return RES;
}

// Serializing
origin.sexprSerialize=function (S) {
  if (isNumber(S)) return String(S);
  if (isString(S)) return '"'+S.replace(/\"/g,'\\"')+'"';
  if (isArray(S)) {
    var TY=S[0],
        RES=TY=="array"?"[":"("+TY,
        FIRST=TY=="array"?1:0,I=1;
    while (I<length(S)) {
      var VAL=S[I];
      if (FIRST) FIRST=False;
            else RES+=" ";
      if (isString(VAL) && VAL[0]==":") {
        RES+=substring(VAL,1,length(VAL))+"=";
        if (I+1>=length(S)) error("sexprSerialize(1)");
        I++;
      }
      RES+=sexprSerialize(S[I]);
      I++;
    }
    RES+=TY=="array"?"]":")";
  }
  else error("sexprSerialize");
  return RES;
}
origin.lsexprSerialize=function (L) {
  if (!isArray(L)) error("lsexprSerialize");
  var RES="";
  for (var E of L) RES+=sexprSerialize(E)+"\n";
  return RES;
}
