/*
 * pretty.js
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

var _SERIALIZING=[],_IDS_ON=[],
    SERIALIZEINDENT=0,
    SERIALIZING=False,PRETTYLEVEL=0;
    _PRETTYID=0,
    PRETTYSTRID=0,PRETTYINDENT2=False; // TODO: reunify this later with the rest

var SymbolPrettyId=sy("pretty::+o")/*FIXME: this SHIT is buggy, it leaks*/,
    SymbolCont=sy("^$")/*FIXME: duplicate ; remove this asap*/,
    sOn="\u263a",sOff="\u263b";
function prettyGetId(O) {
  if (isDefined(O[SymbolPrettyId])) return O[SymbolPrettyId];
  if (isFunction(O.getId)) return O.getId();
  return "^^";
}
function prettyStrId(O) {
  if (length(O)>0) return "<"+(PRETTYSTRID?"":sOff)+prettyGetId(O)+">";
              else return "";
}
function prettyStore(O) {
  O[SymbolPrettyId]=_PRETTYID++;
  _SERIALIZING.push(O);
}
function prettySetIdOn(ID) {
  _IDS_ON[ID]=1;
  return ID;
}
function prettySetIdPrefs(S) {
  var RES=[],I=0;
  while (I<length(S)) {
    if (S[I]=="<" && S[I+1]==sOff) {
      I+=2;
      var A=[];
      while (I<length(S) && S[I]!=">") {
        A.push(S[I]);
        I++;
      }
      if (S[I]!=">") error("prettySetIdPrefs");
      A=implode(A);
      if (_IDS_ON[Number(A)]) RES.push("<"+A+">");
    }
    else RES.push(S[I]);
    I++;
  }
  return implode(RES);
}
function prettyFreeBufs() {
  if (isArray(_SERIALIZING)) {
    for (O of _SERIALIZING) if (isDefined(O[SymbolPrettyId])) delete O[SymbolPrettyId];
  }
  _SERIALIZING=[];
  _IDS_ON={};
  _PRETTYID=0;
}
function prettyTypeOf(O) {
  if (isDefined(O[sType])) return O[sType];
                      else return typeOf(O);
}
function prettyXsymbs() {
  return [sPO,sProx,sSelf];
}
function prettyNames(O) {
  var RES=Object.getOwnPropertyNames(O)
                .map(function (S) {
                       if (S[0]==sPO) S=substring(S,1,length(S));
                       return S;
                     })
                .filter(function (X) { return X!="" && !contains(prettyXsymbs(),X); })
                /*.concat([SymbolId,SymbolCont]*//*Object.getOwnPropertySymbols(O))*/;
  if (!isNil(O[SymbolId])) RES=RES.concat([SymbolId]);
  if (!isNil(O[SymbolCont])) RES=RES.concat([SymbolCont]);
  return rmdupvals(RES);
}
function prettyBis(O,MODE,SKIN,INDENT) {
  if (INDENT==Undefined) INDENT=False;
  var OSERIALIZING=SERIALIZING;
  if (isFunction(MODE)) return MODE(O);
  if (isType(O)) if (PRETTYLEVEL>0) return O.NAME; // TODO: displaying types should be made in a completely standard way, with parameters enabling default value which do what we want, namely at Niv0 the type is a symbol, and at other levels, its possible to revert to the full or flat object display ; another (related) thing is that we would like to be able to specify the skin elements that can be given for attributes at the level of a whole type as well (see how the type-level and the slot-level skin elements should interact)
  if (isUndefined(O)) return "Undef";
  if (isNil(O)) return "Nil";
  if (isBoolean(O)) return O?"True":"False"; // FIXME: for atoms, display their attrs when they are boxed
  if (isNumber(O)) return O.toString();
  if (isSymbol(O)) return isUndefined(sy(O))?O.toString():sy(O);
  if (isString(O)) return '"'+strEscape(O)+'"';
  if (isDate(O)) return 'd"'+O.toISOString()+'"';
  if (isFunction(O)) return "<Func"+(isString(O.name) && O.name!=""?" "+O.name:
                                    (isString(O[SymbolId]) && O[SymbolId]!=""?" "+O[SymbolId]:""))+">";
  if (contains(_SERIALIZING,O)) return "@"+prettySetIdOn(prettyGetId(O));
  SERIALIZING=True,PRETTYLEVEL++;
  var RES="";
  if (MODE=="name") {
    if (isArray(O)) RES="[...]";
    else {
      var NAME=O.NAME;
      if (!isUndefined(NAME)) RES=NAME;
                         else RES="{...}";
    }
  }
  else {
    function incIndent(N) {
      SERIALIZEINDENT+=N;
    }
    if (isArray(O)) {
      prettyStore(O);
      RES+=prettyStrId(O)+"[";
      if (INDENT) incIndent(2);
      var PREVINDENT2=False,FIRST=True,
          D=Object.getOwnPropertyNames(O),TODO="";
      for (var I of D) {
        if (I=="length" || contains(prettyXsymbs(),I)) continue;
        if (!FIRST) RES+=",";
               else FIRST=False;
        RES+=TODO,TODO="";
        if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
        var ISATOM=isAtom(O[I]) || isType(O[I]),
            ISUP=contains(_SERIALIZING,O[I]);
        if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
          incIndent(+2);
          if (!PREVINDENT2) RES+="\n"+spc(SERIALIZEINDENT);
        }
        if (!isNumStr(I)) RES+=I+":"; // FIXME: when there are gaps in the array, should find a way to print the indexes ; fix also the same mistake in serializef()
        RES+=prettyBis(O[I],MODE,SKIN);
        if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
          if (I+1<length(O)) TODO="\n"+spc(SERIALIZEINDENT);
          incIndent(-2);
          PREVINDENT2=True;
        }
        else PREVINDENT2=False;
      }
      RES+=TODO;
      if (INDENT) incIndent(-2);
      RES+="]";
    //_SERIALIZING.pop();
    }
    else {
      prettyStore(O);
      var TYPE=prettyTypeOf(O),TYPENAME=isString(TYPE)?TYPE:TYPE.NAME,
          PATTERN=Nil;
      RES+=prettyStrId(O)+(TYPE==obj?"":TYPENAME)+"{";
      if (SKIN!=Undefined) {
        var SKINT=SKIN[TYPENAME];
        if (isUndefined(SKINT)) SKINT=SKIN["*"];
        if (SKINT!=Undefined) {
          if (MODE==Undefined) MODE=SKINT["default"];
          if (MODE==Undefined || MODE=="") MODE="short";
          if (MODE!=Undefined) PATTERN=SKINT[MODE];
        }
      }
      if (MODE==Undefined) MODE="short"; // FIXME: unused
      if (isNil(PATTERN)) PATTERN={"*":["av","full"]},
                          PATTERN[SymbolId]=["-",""],PATTERN[SymbolCont]=["-",""],
                          PATTERN[sType]=["-",""];
      if (INDENT) incIndent(2);
      var PREVINDENT2=False;
      var FIRST=True,I=0,
          NAMES=prettyNames(O),LNAMES=length(NAMES),TRGI/*FIXME: horrible hack*/="";
      for (var NAME of NAMES/*.concat(Object.getOwnPropertySymbols(O))*//*FIXME: do a method allKeys() or something, for this ; FIXME(2): find a way to control OwnPropertySymbols() display via the skin or the mode */) {
        var MODE2=Undefined; // TODO: display attributes in the order in which they are given in the skin
        if (isDefined(PATTERN[NAME])) MODE2=PATTERN[NAME];
        if (MODE2==Undefined) MODE2=PATTERN["*"];
        if (MODE2!=Undefined && !contains(MODE2[0],"-")) {
          var SA=contains(MODE2[0],"a"),
              SV=contains(MODE2[0],"v");
          if (!FIRST && (SA||SV)) RES+=",";
          RES+=TRGI,TRGI="";
          var VAL;
          if (NAME=="caller" || NAME=="callee" || NAME=="arguments") VAL="<Forbidden>";
                                                                else VAL=O[NAME];
          var ISATOM=(isAtom(VAL) || isType(VAL)) && !(isString(VAL) && length(VAL)>5) && !isDate(VAL),
              ISUP=contains(_SERIALIZING,VAL);
          if (SA||SV) {
            if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
            if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
              incIndent(+2);
              if (!PREVINDENT2) RES+="\n"+spc(SERIALIZEINDENT);
            }
            FIRST=False;
          }
          if (SA) RES+=isSymbol(NAME)?pretty(NAME):NAME;
          if (SA&&SV) RES+=":";
          if (SV) RES+=prettyBis(VAL,MODE2[1],SKIN,contains(MODE2[0],"i"));
          if (SA||SV) {
            if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
              if (I+1<LNAMES) TRGI+="\n"+spc(SERIALIZEINDENT);
              incIndent(-2);
              PREVINDENT2=True;
            }
            else PREVINDENT2=False;
            I++;
          }
        }
      }
      RES+=TRGI,TRGI="";
      if (INDENT) incIndent(-2);
      RES+="}";
    //_SERIALIZING.pop();
    }
  }  
  SERIALIZING=OSERIALIZING,PRETTYLEVEL--;
  return RES;  
}
origin.pretty=function (O,MODE,SKIN) { // Similar to JSON.stringify()
  var INDENT=False;
  if (MODE=="indent") MODE=Undefined,INDENT=True; // Hack (cf. PRETTYINDENT2)
  var OPRETTYINDENT2=PRETTYINDENT2,OPRETTYLEVEL=PRETTYLEVEL;
  PRETTYLEVEL=0;
  if (INDENT) PRETTYINDENT2=1;
  if (!SERIALIZING) _SERIALIZING=[],_IDS_ON=[];
  if (isUndefined(MODE)) MODE="short";
  var RES=prettyBis(O,MODE,SKIN);
  if (!SERIALIZING) RES=prettySetIdPrefs(RES),prettyFreeBufs();
  PRETTYINDENT2=OPRETTYINDENT2,PRETTYLEVEL=OPRETTYLEVEL;
  return RES;
}
