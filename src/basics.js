/*
 * basics.js
 *
 * Copyright (C) Henri Lesourd 2017, 2018, 2019.
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

// Origin
var SERVER=(typeof window)=="undefined",
    origin;
if (SERVER) origin=global;
       else origin=window;
origin.origin=origin;
origin.declare=function (O) { // TODO: improve this
  Object.assign(origin,O);
}

// Basic constants
origin.Nil=null;
origin.Undefined=undefined;
origin.BoxedNil=Symbol("nil"); // Bootstrap : should have values
origin.BoxedUndefined=Symbol("undefined");
origin._=Undefined;

origin.True=true;
origin.False=false;

// Error
var ERRCATCH=False;
origin.errorCatch=function (CATCH) {
  ERRCATCH=CATCH;
}
function errstop(errno) {
  if (ERRCATCH) throw "";
           else if (SERVER) process.exit(errno); else nofunc();
}
var ERRLI=-1,ERRCOL=-1,ERRFNAME=Nil;
function errlicolSet(LI,COL,FNAME) {
  ERRLI=LI>0?LI:-1;
  ERRCOL=COL>0?COL:-1;
  ERRFNAME=FNAME;
}
origin.error=function (msg) {
  if (!isNil(ERRFNAME)) msg+=" in "+ERRFNAME;
  if (ERRLI>0 || ERRCOL>0) msg+=" at (";
  if (ERRLI>0) msg+=ERRLI.toString();
  if (ERRCOL>0) {
    if (ERRLI>0) msg+=",";
    msg+=ERRCOL.toString();
  }
  if (ERRLI>0 || ERRCOL>0) msg+=")";
  (SERVER?console.log:alert)(msg);
  errstop(1);
}

// JS types (1)
function prototype(X) {
  var RES=Object.getPrototypeOf(X);
  if (RES==Nil) return Object.prototype;
  return RES;
}
function constructor(X) {
  return prototype(X).constructor;
}
function isa0(O,C,REC) {
  if (isNil(O)) return False;
  if (constructor(O)==C) return True;
  if (isUndefined(REC)) REC=True;
  if (!REC || constructor(O)==Object) return False;
  return isa0(prototype(O),C,REC);
}

origin.eqNil=function (O) { return O===Nil; }
origin.isDefined=function (O) { return O!==Undefined; }
origin.isUndefined=function (O) { return O===Undefined; }
origin.isNil=function (O) { return isUndefined(O) || O==BoxedUndefined
                                || eqNil(O) || O==BoxedNil; }
origin.isTrue=function (O) { return !isFalse(O); }
origin.isFalse=function (O) { return isNil(O) || O===False || O===0 || O=="0"/*FIXME: "0" is truthy*/; }
origin.isSymbol=function (O) { return isa0(O,Symbol); }
origin.isBoolean=function (O) { return isa0(O,Boolean); }
origin.isNumber=function (O) { return isa0(O,Number); }
origin.isString=function (O) { return isa0(O,String); }
origin.isNumStr=function (O) { return isNumber(O) || strIsNum(O); }
origin.isDate=function (O) { return isa0(O,Date); }
origin.isAtom=function (O) { return isNil(O) // TODO: perhaps Nil & Undefined should not even be atoms (?)
                                 || isSymbol(O) || isBoolean(O)
                                 || isNumber(O) || isString(O) || isDate(O); }
origin.isRootAtom=function (O) { return typeOf(O).root()==typeOf(O) && isAtom(O); }
origin.isArray=function (O) { return isa0(O,Array); }
origin.isFunction=function (O) { return isa0(O,Function); } // FIXME: doesn't work for JIX types, e.g. obj(), str(), etc.

// Symbols
var _SY={};
origin.sy=function (S) {
  if (isString(S)) { _SY[S]=1;return Symbol.for(S); }
  else
  if (isSymbol(S)) return Symbol.keyFor(S);
              else error("sy");
}
origin.syExists=function (S) {
  return isDefined(_SY[S]);
}

// Characters
declare({ CharNatNone:0,
          CharNatAlf:1,CharNatQuote:2,CharNatDQuote:3,
          CharNatOmg:4,CharNatDigit:5,CharNatBlank:6 });
origin   .CharNatUnknown=CharNatNone;
var CharNat=[];

origin.asc=function (c) {
  return c.codePointAt(0);
}
origin.chr=function (i) {
  return String.fromCharCode(i);
}
origin.charnat=function (c) {
  return CharNat[asc(c)];
}
origin.charnatSet=function (c,n) {
  if (isArray(c)) for (var e of c) charnatSet(e,n);
  else
  if (isString(c)) CharNat[asc(c)]=n;
              else error("charnatSet");
}
origin.charnatSetAll=function (n) {
  for (var i=0;i<256;i++) CharNat[i]=n;
}
origin.charIsLetter=function (C) {
  return asc(C)>=asc("A") && asc(C)<=asc("Z")
      || asc(C)>=asc("a") && asc(C)<=asc("z");
}
origin.charIsDigit10=function (C) {
  return asc(C)>=asc("0") && asc(C)<=asc("9");
}
origin.charIsXDigit=function (C) {
  return charIsDigit10(C) || (asc(C)>=asc('A') && asc(C)<=asc('F')) || (asc(C)>=asc('a') && asc(C)<=asc('f'));
}
origin.charIsDigitInRadix=function (C,RADIX) {
  if (RADIX<2 || RADIX>16) error("charIsDigitInRadix");
  if (RADIX<=10) return charIsDigit10(C) && asc(C)<=asc('0')+RADIX-1;
  return charIsDigit10(C) || (charIsXDigit(C) && ((asc(C)>=asc('A') && asc(C)<=asc('A')+RADIX-11)
                                               || (asc(C)>=asc('a') && asc(C)<=asc('a')+RADIX-11)));
}
origin.charIsAlpha=function (C) {
  return charnat(C)==CharNatAlf;
}
origin.charIsOmg=function (C) {
  return charnat(C)==CharNatOmg;
}
origin.charIsDigit=function (C) {
  return charnat(C)==CharNatDigit;
}
origin.charIsBlank=function (C) {
  return charnat(C)==CharNatBlank;
}
origin.charIsUnknown=function (C) {
  return charnat(C)==CharNatUnknown;
}
origin.charIs=function charIs(C,N) {
  return charnat(C)==N;
}
origin.strIs=function (S,N) {
  if (!isString(S) || length(S)==0) return False;
  for (var I=0;I<length(S);I++) if (!charIs(S[I],N)) return False;
  return True;
}
origin.strIsAlpha=function (S) { // FIXME: check all chars (and verify that everywhere its used, the change is ok)
  return strIs(S,CharNatAlf);
}
origin.strIsOmg=function (S) {
  return strIs(S,CharNatOmg);
}
origin.strIsNum=function (S) { // NOTE: exception: this one doesn't depends on the natchars' table
  if (!isString(S) || length(S)==0) return False;
  for (var I=0;I<length(S);I++) if (!charIsDigit10(S[I])) return False;
  return True;
}
origin.strIsBlank=function (S) {
  return strIs(S,CharNatBlank);
}

origin.charsInit=function (ALLALF) {
  var i;
  for (i=0;i<256;i++) CharNat[i]=CharNatNone;
  for (i=0;i<10;i++) CharNat[i]=CharNatAlf; // To enable, e.g. attribute names with these characters to be parsed
  for (i=32;i<=126;i++) CharNat[i]=ALLALF?CharNatAlf:CharNatOmg;
  for (i=asc('A');i<=asc('Z');i++) CharNat[i]=CharNatAlf;
  for (i=asc('a');i<=asc('z');i++) CharNat[i]=CharNatAlf;
  for (i=192;i<=255;i++) CharNat[i]=CharNatAlf;
  CharNat[asc('"')]=CharNatDQuote;
  CharNat[asc('\'')]=CharNatQuote; // These two ones to cut at beginning of a string
  CharNat[asc('_')]=CharNatAlf;
  CharNat[asc('$')]=CharNatAlf;
  for (i=asc('0');i<=asc('9');i++) CharNat[i]=ALLALF?CharNatAlf:CharNatDigit;
  CharNat[asc("\t")]=CharNatBlank;
  CharNat[asc(" ")]=CharNatBlank;
  CharNat[asc("\n")]=CharNatBlank;
  CharNat[asc("\r")]=CharNatBlank;
}

// Strings
origin.trim=function (s,chars,left,right) {
  if (chars==undefined) chars=" \r\n";
  if (left==undefined) left=true;
  if (right==undefined) right=true;
  var res="",a=s.split(""),i;
  if (left) {
    i=0;
    while (i<a.length && chars.indexOf(a[i])!=-1) {
      a[i]=null;
      i++;
    }
  }
  if (right) {
    i=a.length-1;
    while (i>=0 && chars.indexOf(a[i])!=-1) {
      a[i]=null;
      i--;
    }
  }
  for (i=0;i<a.length;i++) if (a[i]!=null) res+=a[i]; // TODO: in case there is nothing to trim, return S itself
  return res;
}
origin.startsWith=function (s,i,pref) {
  if (isUndefined(pref)) pref=i,i=0;
  if (s.length-i<pref.length) return false;
  else {
    return substring(s,i,pref.length)==pref;
  }
}
origin.endsWith=function (s,suff) {
  if (s.length<suff.length) return false;
  else {
    return substring(s,s.length-suff.length,s.length)==suff;
  }
}
origin.strFind=function (s,ss) {
  for (var i=0;i<s.length;i++) {
    if (startsWith(substring(s,i,s.length),0,ss)) return i;
  }
  return -1;
}
origin.strMatch=function (S,PATTERN) {
  if (isArray(PATTERN)) {
    for (P of PATTERN) if (strMatch(S,P)) return True;
    return False;
  }
  var A=PATTERN.split("*");
  if (length(A)==1) return S==PATTERN;
  if (length(A)==2) {
    if (A[0]=="" && A[1]=="") return True;
    if (A[0]=="") return endsWith(S,A[1]);
    if (A[1]=="") return startsWith(S,0,A[0]);
    if (length(A[0])>length(S) || length(A[1])>length(S)) return False;
    return startsWith(S,0,A[0]) && endsWith(substring(S,length(A[0]),length(S)),A[1]);
  }
  if (length(A)==3) {
    if (A[0]=="" && A[1]=="" && A[2]=="") return True;
    if (A[0]=="" && A[1]!="" && A[2]=="") return strFind(S,A[1])!=-1;
  }
  error("strMatch");
}
origin.substring=function (S,I0,I1) {
  if (I0>length(S)) return "";
  if (length(S)<I1) I1=length(S);
  return S.substring(I0,I1);
}
origin.splitTrim=function (s,chars) {
  var a=s==""?[]:s.split(chars); // FIXME: should return [""], when S==""
  for (var i=0;i<a.length;i++) a[i]=trim(a[i]," \r\n",true,true);
  return a;
}
origin.splitOnce=function (S,SEP,DFLT) {
  var A=splitTrim(S,SEP),RES=[DFLT[0],DFLT[1]];
  if (length(A)==0) error("splitOnce");
  if (length(A)==1) if (isUndefined(DFLT[0])) RES[0]=S; else RES[1]=S;
  else {
    RES[0]=A[0];
    RES[1]=substring(S,length(A[0])+length(SEP),length(S));
  }
  return RES;
}
origin.unsplit=function (L,SEP) {
  var RES="",FIRST=1;
  for (var S of L) {
    RES+=(FIRST?"":SEP)+S;
    FIRST=0;
  }
  return RES;
}
origin.replaceAll=function (s,s1,s2) { // FIXME: this function calculates a fixpoint, it doesn't replaces all the matches
  var s0;
  do {
    s0=s;
    s=s.replace(s1,s2);
  }
  while (s!=s0);
  return s; 
}
origin.lcase=function (s) {
  return s.toLowerCase();
}
origin.ucase=function (s) {
  return s.toUpperCase();
}
origin.count=function (S,CHARS,I0,ATBEG) {
  var RES=0;
  if (isUndefined(I0)) I0=0;
  for (var i=I0;i<length(S);i++) {
    var FOUND=False;
    for (var j=0;j<length(CHARS);j++) {
      if (CHARS=="" || S[i]==CHARS[j]) { RES++;FOUND=True;break; }
    }
    if (!FOUND && ATBEG) break;
  }
  return RES;
}
origin.explode=function (S) {
  if (!isUndefined(S) && !isString(S)) error("explode");
  return S.split("");
}
origin.implode=function (A) { // FIXME: check the type of A properly (should be an array of str)
  if (isString(A)) return A;
  if (!isArray(A)) error("implode");
  return A.join("");
}

// Tokenize0
origin.tokenize0=function (S) {
  var L=[],
      I0=0,NAT0=charnat(S[0]),NAT;
  for (var I=0;I<length(S);I++) {
    NAT=charnat(S[I]);
    if (NAT!=NAT0) {
      if (NAT0!=CharNatBlank) L.push(substring(S,I0,I));
      I0=I,NAT0=NAT;
    }
  }
  L.push(substring(S,I0,length(S)));
  return L;
}

// Arrays
origin.arrayN=function (N,VAL) {
  var A=[];
  while (N--) A.push(VAL);
  return A;
}
origin.length=function (o) {
  if (isString(o) || isArray(o)) return o.length;
  else
  if (isAtom(o)) return 0;
            else return Object.getOwnPropertyNames(o).length;
}
origin.empty=function (st) {
  return length(st)==0;
}
origin.last=function (st) { // TODO: Shit, top(), is already defined. Find a way to have it, or another decent name
  if (empty(st)) return null;
  return st[st.length-1];
}
origin.contains=function (a,o,weak) {
  if (isString(a)) return strFind(a,o)!=-1;
  else
  if (isArray(a)) {
    for (var i=0;i<a.length;i++) if (weak?a[i]==o:a[i]===o) return true;
  }
  else out(display(a)),error("contains");
  return false;
}
origin.containsVal=function (a,o) {
  return contains(a,o,True);
}
origin.index=function (a,o,weak) {
  for (var i=0;i<a.length;i++) if (weak?a[i]==o:a[i]===o) return i;
  return -1;
}
origin.find=function (a,o,data) {
  for (var i=0;i<a.length;i++) {
    if (!data && o(a[i]) || data && (isNil(o)?a[i]===o:a[i]==o)) return a[i];
  }
  return Undefined;
}
function arrayToDict(a) {
  var d={};
  for (var i=0;i<a.length;i++) if (a[i]!=null) d[a[i][0]]=a[i][1];
  return d;
}
origin.splice=function (t,i,ndel,t2) {
  t.splice.apply(t,[i,ndel].concat(t2));
}
origin.acopy=function (A,I0,I1) {
  var RES=arrayN(I1-I0);
  for (var I=I0;I<I1;I++) RES[I-I0]=A[I];
  return RES;
}
origin.atrim0=function (L) {
  var RES=[];
  for (var S of L) { if (S!=Undefined) RES.push(S); }
  return RES;
}
origin.atrim=function (L,VALS,ONCE) {
  if (!VALS) VALS=["", Nil];
  var DEL=[];
  var CPY=0;
  for (var I in L) if (contains(VALS,L[I],1)) {
    DEL[I]=L[I];
    L[I]=Undefined,CPY=1;
    if (ONCE) break;
  }
  for (var S of L) if (S==Undefined) CPY=1;
  var RES=[];
  if (CPY) {
    RES=atrim0(L);
    for (var I in DEL) L[I]=DEL[I];
  }
  else RES=L;
  return RES;
}
origin.acontains=function (L,VALS,N) {
  var NW=0;
  for (var S of L) {
    if (contains(VALS,S)) NW++;
    if (isDefined(N) && NW>=N) return 1;
  }
  if (isUndefined(N)) return NW>0;
                 else return 0;
}
origin.acontainsAll=function (L,VALS) {
  for (var S of VALS) {
    if (!contains(L,S)) return False;
  }
  return True;
}
origin.rmdupvals=function (A) {
  return [...new Set(A)];
}
origin.sort=function (A,SLOTS) {
  if (isUndefined(SLOTS) || isString(SLOTS) && length(SLOTS)==0) return A;
  if (!isString(SLOTS)) error("sort"); // TODO: implement multislot sorting
  var SIGN=+1;
  if (SLOTS[0]=="+" || SLOTS[0]=="-") {
    SIGN=SLOTS[0]=="+"?+1:-1;
    SLOTS=substring(SLOTS,1,length(SLOTS));
    if (length(SLOTS)==0) error("sort(2)");
  }
  A.sort(function (O1,O2) {
    return O1[SLOTS]>O2[SLOTS]?SIGN:-SIGN;
  });
  return A;
}

// Objects
origin.ocopy=function (O) {
  if (!isAtom(O) && !isFunction(O)) {
    var O2={};
    if (isArray(O)) O2=[];
    Object.assign(O2,O);
    O=O2;
  }
  return O;
}

// Display
function strEscape(s) {
  var res="";
  for (var i=0;i<s.length;i++) {
    var c=s[i];
    if (c=='"') c="\\\"";
    if (c=='\n') c="\\n";
    res+=c;
  }
  return res;
}
var displaying=[],display_mode="cooked";
function displayMode(mode) {
  display_mode=mode;
}
origin.display=function (o) { // Similar to JSON.stringify()
  var res=null;
  if (isUndefined(o)) res="Undefined";
  else
  if (isNil(o)) res="Nil";
  else
  if (isBoolean(o)) res=o.toString();
  else
  if (isNumber(o)) res=o.toString();
  else
  if (isString(o)) {
  /*if (display_mode=="raw")*/ res=o;
    if (display_mode=="cooked") res='"'+strEscape(o)+'"';
  }
  else
  if (isSymbol(o)) res=o.toString();
  else
  if (isFunction(o)) res="<JSFunc>";
  else
  if (contains(displaying,o)) res="^^";
  else
  if (isArray(o)) {
    displaying.push(o);
    res="[";
    for (var i=0;i<o.length;i++) {
      if (i>0) res+="|";
      res+=display(o[i]);
    }
    res+="]";
    displaying.pop();
  }
  else {
    displaying.push(o);
    res="{";
    var first=true;
    for (var val in o) {
      if (!first) { if (val!="parent") res+="|"; } else first=false;
      if (val!="parent") {
        res+=val+"="+display(o[val]);
      }
    }
    res+="}";
    displaying.pop();
  }
  return res;
}

// Misc
origin.garbage=function () {
  if (origin.gc) {
  //console.log("Garbaging ...");
    origin.gc();
  }
//else console.log("No gc !!! ...");
}
origin.whenIdle=Undefined;
if (SERVER) {
  origin.whenIdle=setImmediate;
}
else {
  origin.whenIdle=queueMicrotask;
}

// Init
charsInit();
