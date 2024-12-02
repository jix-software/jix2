/*
 * jxml.js
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

// Compilation (p-code)
/* NOTE: Rule for function calls [obsolete: the simpler version is full ok]
   => If there is no $ in the function's proto, then the not-named parameters
      are stuffed on the stack after the position of the previous named parm.
      When it doesnt starts with a named parm, one starts from zero ;
   => If there is a $ in the function's proto, then the not-named parameters
      are simply the elements of the function's $ parameter ;
   So to preprocess, one always needs to know the functions that are called ;
   => simpler version: if it's a function with $ as a parm, named parms are
        mandatory and are passed as the 1st part, the others are passed in $.
 */
var _PCP={ "_$S":Undefined, "_$T":Undefined };
function isCallPrefix(VAR) {
  return isString(VAR) && (endsWith(VAR,"^") || endsWith(VAR,"."));
}
function pushCallPrefix(VAR) {
  if (!isString(VAR) || VAR=="...") return False;
  if (endsWith(VAR,"^")) {
    if (isDefined(_PCP._$S)) error("pushCallPrefix(1)");
    _PCP._$S=substring(VAR,0,length(VAR)-1);
    return True;
  }
  if (VAR!="..." && endsWith(VAR,".")) {
    if (isDefined(_PCP._$T)) error("pushCallPrefix(2)");
    _PCP._$T=substring(VAR,0,length(VAR)-1);
    return True;
  }
  return False;
}
function resetCallPrefix() {
  _PCP._$S=Undefined;
  _PCP._$T=Undefined;
}
function isCallPrefixEmpty() {
  return isUndefined(_PCP._$S) && isUndefined(_PCP._$T);
}
var _ENV=[];
function envEnter(E) {
  _ENV.push(E);
}
function envLeave() {
  _ENV.pop();
}
function envGet() {
  if (empty(_ENV)) return Nil;
              else return last(_ENV);
}
function compileExpr(E,VAR,SELFV) {
  if (!isArray(E)) {
    if (!isCallPrefixEmpty()) error("compileExpr(0)");
    var F=envGet();
    if (isString(E) && length(E)>0 && E[0]!='"' && F!=Nil) {
      var L=splitTrim(E,".");
      if (isDefined(F.BODY["$_."+L[0]])) L[0]="$_."+L[0],E=L.join(".");
    }
    return E;
  }
  var N=length(E),$_={},I=1,RES=[];
  if (N<1) error("compileExpr(1)");
  if (E[0]=="function") return compileFunction(E,Undefined);
  RES[sType]="expr";
  RES.push(E[0]);
  ASYNCEXPR=ASYNCEXPR || isAsyncFunc(E[0]);
  RES.push(_PCP._$S);
  RES.push(_PCP._$T);
  resetCallPrefix();
  RES.push($_);
  while (I<N) {
    if (I+1<N && E[I+1]=="=") {
      if (I+2>=N || isCallPrefix(E[I+2])) error("compileExpr(2)");
      $_[E[I]]=compileExpr(E[I+2]);
      I+=2;
    }
    else {
      var B=pushCallPrefix(E[I]);
      if (!B) RES.push(compileExpr(E[I]));
    }
    I++;
  }
  return RES;
}
origin.sAsync="\u00a1"; // Async (inverted exclamation mark)
function isAsyncFunc(F) {
  if (isString(F)) F=findFunction(F,1);
  return (isFunction(F) || isPcodeFunc(F)) && F.QUALIF && contains(F.QUALIF,sAsync);
}
function isPcodeFunc(F) {
  return isObject(F) && F[sType]=="function";
}
var FUNCS={}; // FIXME: reset that each time we compile
function createFunction(ENV,NAME,QUALIF,ATTRS,BODY) {
  var RES={ ENV:ENV, NAME:NAME, QUALIF:QUALIF, ATTRS:ATTRS, BODY:BODY, ENMAX:Undefined };
  RES[sType]="function";
  if (isString(NAME)) FUNCS[NAME]=RES; // TODO: faire ca _per env_
  return RES;
}
function findFunction(NAME,ALLFUNCS) {
  var RES=FUNCS[NAME];
  if (RES || !ALLFUNCS) return RES;
  RES=origin[NAME]; // TODO: do a first-class environment for JS/runtime functions
  return isFunction(RES)?RES:Nil;
}
function inheritFuncs(F0,INHF) { // TODO: inherit async flag to F0 if one of the functions is async
  function ff(NAME) {
    var F=findFunction(NAME);
    if (isNil(F)) error("inheritFuncs::ff");
    return F;
  }
  if (length(INHF)==0) return;
  INHF=INHF.map(ff);
  var ATTRS0=F0.ATTRS,A=[];
  for (var F of INHF) {
    A.splice(length(A),0,...F.ATTRS);
  }
  A.splice(length(A),0,...ATTRS0);
  F0.ATTRS=A;
  var _$=F0.BODY._$;
  for (var F of INHF) if (isDefined(F.BODY._$)) {
    if (isDefined(_$)) error("inheritFuncs::_$ already defined in "+F.NAME);
    _$=F.BODY._$;
  }
  var LO=[],F$,SELF$,THIS$,doit=function (F) {
    if (F!=F0 && isDefined(F.BODY["_$"])) F$=F;
    var L=F.BODY;
        N=length(L[sAord]);
    for (var I=0; I<N; I++) {
      var V=L[sAord][I];
      if (V!="_$" && V!="_$S" && V!="_$T") {
        if (I==0) {
          if (isDefined(SELF$)) error("inheritFuncs::SELF$");
          SELF$=V;
        }
        if (I==1) {
          if (isDefined(THIS$)) error("inheritFuncs::THIS$");
          THIS$=V;
        }
        if (F!=F0 && isDefined(F0.BODY[V])) error("inheritFuncs::"+V+" already defined in "+F.NAME);
        if (I>1) LO.push(V);
        F0.BODY[V]=F.BODY[V];
      }
    }
  };
  for (var F of INHF) doit(F);
  doit(F0);
  if (isUndefined(SELF$)) SELF$="_$S";
  if (isUndefined(THIS$)) THIS$="_$T";
  LO.unshift(THIS$); // TODO: recover the initialized versions of _$S and _$T if they exist (and verify they exist only once), and assign them inside F0's body
  LO.unshift(SELF$);
  LO.push("_$");
  if (isUndefined(F0.BODY._$)) {
    F0.BODY._$=F$.BODY["_$"];
  }
  F0.BODY[sAord]=LO;
}
var ASYNCEXPR=False;
function compileFunction(E,NAME) { // TODO: check that name({named parms}) inter name({regular parms})={} 
  if (!isArray(E) || E[0]!="function") error("compileFunction");
  var OASYNCEXPR=ASYNCEXPR;
  ASYNCEXPR=False;
  var I=1;
  if (isString(E[I])) NAME=E[I],I++;
  if (isUndefined(NAME)) NAME=gensym();
  var INHF=[];
  if (contains(NAME,":")) {
    INHF=splitTrim(NAME,":");
    NAME=INHF[0];
    INHF.shift();
  }
  var BODY=compileBody([],0),
      PROTO=E[I],MULTI=False;
  var J0=index(PROTO,"|",1),
      SELFV="_$S",THISV="_$T";
  for (var J=0;J<2 && J<length(PROTO);J++) {
    var V=PROTO[J];
    if (endsWith(V,"^")) SELFV=substring(V,0,length(V)-1);
    if (V!="..." && endsWith(V,".")) THISV=substring(V,0,length(V)-1);
  }
  compileLet(BODY,SELFV,Undefined,False,True);
  compileLet(BODY,THISV,Undefined,False,True);
  var ATTRS=[];
  if (J0!=-1) for (var J=0;J<J0;J++) {
    var V=PROTO[J];
    if (contains(["^","."],V[length(V)-1],1)) continue;
    ATTRS.push(V);
  }
  var RES=createFunction(envGet(),NAME,"",ATTRS,BODY);
  envEnter(RES);
  J0++;
  for (var J=J0;J<length(PROTO);J++) {
    var V=PROTO[J];
    if (endsWith(V,"^") || V!="..." && endsWith(V,".")) continue;
    if (V=="...") { if (MULTI) error("compileFunction::MULTI");MULTI=True; }
             else compileLet(BODY,V,Undefined,MULTI,True),MULTI=False;
  }
  for (var V of ATTRS) {
    compileLet(BODY,"$_."+V,Undefined,False,True);
  }
  compileBody(E,I+1,BODY,SELFV);
  envLeave();
  inheritFuncs(RES,INHF);
  if (ASYNCEXPR) RES.QUALIF+=sAsync; // TODO: use sets here
  ASYNCEXPR=OASYNCEXPR;
  return RES;
}
origin.compileModule=function (NAME,E) {
  return createFunction(Nil,NAME,"",[],compileBody(E,0));
}
function createVar(NAME,EXPR,MULTI,ISPARM) {
  var RES={ NAME:NAME, EXPR:EXPR, MULTI:MULTI, ISPARM:ISPARM };
  if (!charIsLetter(NAME[0]) && NAME[0]!="_" && NAME[0]!="$") error("createVar::NAME<"+NAME+">");
  RES[sType]="var";
  return RES;
}
function compileLet(CODE,VAR,VAL,MULTI,ISPARM) {
//out("Let "+VAR.toString()+" "),outd(VAL),out(" "),outd(MULTI),cr();
  CODE[sAord].push(VAR);
  MULTI=isDefined(MULTI) && MULTI!=False;
  ISPARM=isDefined(ISPARM) && ISPARM!=False;
  CODE[VAR]=createVar(VAR,VAL,MULTI,ISPARM);
}
origin.compileBody=function (L,I,RES,SELFV) {
  if (isUndefined(RES)) {
    RES={};
    RES[sAord]=[];
  }
  var N=length(L);
  while (I<N) {
    var E=L[I],VAR=Undefined/*Whazzis s%&t ? Why is VAR not resetted at each turn of the while loop ?*/;
    if (isString(E) && I+1<N && L[I+1]=="=") {
      VAR=E;
      I+=2;
      E=L[I];
    }
    if (isObject(E) && E[0]=="import") {
      if (isDefined(VAR)) outd(VAR),cr(),error("compileBody::X=(import ...)");
      var FNAME=trim(E[1],'"');
      splice(L,I,1,parseSexpr(fileRead(FNAME),"lisp",1)); // FIXME: load it only if it was not already loaded
      N=length(L),I--;
    }
    else
    if (isObject(E) && E[0]=="type") {
      if (isDefined(VAR)) outd(VAR),cr(),error("compileBody::X=(type ...)");
      compileLet(RES,E[1],compileExpr(E)); 
    }
    else
    if (isObject(E) && E[0]=="function") {
      var FNAME;
      if (isString(E[1])) {
        FNAME=E[1];
        if (isUndefined(VAR)) VAR=E[1];
      }
      else
      if (isDefined(VAR)) FNAME=VAR;
      if (isUndefined(VAR) && !isString(E[1])) error("compileBody::function (X) with no name");
      if (contains(VAR,":")) VAR=splitTrim(VAR,":")[0];
      compileLet(RES,VAR,compileFunction(E,FNAME)); 
    }
    else {
      if (isUndefined(VAR)) VAR="_$";
                     //else if (I==N-1) error("compileBody($)"); // NOTE: we enable abstract functions
      if (isCallPrefix(E)) {
        if (!isCallPrefixEmpty()) error("compileBody(PREFIX)");
        while (isCallPrefix(E)) {
          pushCallPrefix(E);
          I++,E=L[I];
        }
      }
      if (VAR=="_$" && I!=N-1) error("compileBody(VAR)");
      compileLet(RES,VAR,compileExpr(E,VAR,SELFV)); 
    }
    I+=1;
  }
  return RES;
}

// Pretty
function prettyScode(L) {
  if (isPcodeFunc(L)) prettyPcodeFunc(L);
  else
  if (isString(L)) {
    if (empty(L)) error("prettyScode::String");
    out(L.toString());
  }
  else
  if (!isArray(L)) out(pretty(L));
  else {
    var I,N=length(L);
    out("[");
    prettyScode((isAsyncFunc(L[0])?sAsync:"")+L[0]);
    if (N>1) out(" "),prettyScode(L[1]);
    if (N>2) out(" "),prettyScode(L[2]);
    outIndentInc(+2);
    if (N>3) {
      crIndent();
      out(pretty(L[3]));
    }
    if (N>4) {
      crIndent();
      for (I=4;I<N;I++) {
        prettyScode(L[I]),out(I+1<N?" ":"");
      }
    }
    out("]");
    outIndentInc(-2);
  }
}
function prettyScodeEnv(E) {
  var FIRST=True;
  while (E) {
    if (!FIRST) out(" "); else FIRST=False;
    var NAME=E.NAME;
    if (NAME) NAME=NAME.toString(); else NAME="\u00d8";
    out(NAME);
    E=E.ENV;
  }
}
function prettyPcodeFunc(F) {
  var NAME=F.NAME.toString();
  out((isAsyncFunc(NAME)?sAsync:"")+sFunc),out(NAME);
  out(" {");
  prettyScodeEnv(F.ENV);
  out("}");
  outIndentInc(+2);
  crIndent();
  prettyScodeBody(F.BODY);
  outIndentInc(-2);
  crIndent();
}
origin.prettyScodeBody=function (L,CR) {
  var N=length(L[sAord]);
  for (var I=0; I<N; I++) {
    var V=L[sAord][I];
    out(L[V].ISPARM?"p":"v"),out(" ");
    if (L[V].MULTI) out("*");
    out(V.toString()),out("=");
    if (isPcodeFunc(L[V].EXPR)) {
      prettyPcodeFunc(L[V].EXPR);
    }
    else {
      prettyScode(L[V].EXPR);
      if (I+1<N) cr(),outIndent();
    }
    if (CR) cr();
  }
}

// Compilation (Javascript)
function jscompScodeSelf(BODY,V,LEV,MLEV,VAR,FLT,SPR) {
  if (isUndefined(VAR) || LEV==0) error("jscompScodeSelf");
  if (isUndefined(FLT)) FLT=False;
  if (FLT) out("(");
  if (LEV<MLEV) out("_"+LEV+"=");
  if (FLT) out("(_s"+LEV+"=[],");
  var NAMED=isString(VAR);
  if (LEV==1) {
    if (!NAMED) error("jscompScodeSelf(2)");
    out(VAR+".E");
  }
  else {
    if (NAMED) out("jxne"),VAR='"'+VAR+'"';
          else out(SPR?"jxaspe":"jxae");
    out("(_"+(LEV-1)+","+VAR+")");
  }
  if (FLT) out("))");
}
function jscompScodeVar(BODY,V) {
  if (V in BODY) {
    if (startsWith(V,"$_.")) V="$_.$."+splitTrim(V,".")[1]; // CHECK: shouldn't it be jx$() here, too ?
    return V;
  }
//if ("$_."+V in BODY) return "$_."+V; do we need this ?
  if (V[0]!="'" && V[0]!='"') { // FIXME: check that it's actually a variable name/chunk of code in a better way
    var L=V.split(".");
    if (L[0]!=V) {
      var RES="";
      L[0]=jscompScodeVar(BODY,L[0]);
      for (var S of L) {
        if (RES!="") RES="jx$("+RES+")."+S;
                else RES=S;
      }
      return RES;
    }
  }
  return V; // FIXME: it's not going to be able to see the named vars of the closure level above
  //console.log(BODY),console.log(V),error("jscompScodeVar");
}
function jscompScodeFVarSymb(V) {
  if (V=="+") V="__sy__add";
  return V;
}
function jscompScodeFVar(V) {
  var RES,F=envGet();
  while (F) {
    if (V in F.BODY && !isPcodeFunc(F.BODY[V].EXPR)) {
      RES="jx$("+V+")";break;
    }
    F=F.ENV;
  }
  if (!RES) RES=V;
  return jscompScodeFVarSymb(RES);
}
function jscompScode(BODY,L,LEV,MLEV,VAR,_FLT,SPR) {
  if (isPcodeFunc(L)) jscompPcodeFunc(L);
  else
  if (isString(L)) {
    if (empty(L)) error("jscompScode::String");
    if (L[0]=='"' || strIsNum(L)) out(L.toString());
                             else out(jscompScodeVar(BODY,L));
  }
  else
  if (!isArray(L)) out(pretty(L));
  else {
    var I,N=length(L);
    if (!isString(L[0])) error("jscompScode::F");
    out((isAsyncFunc(L[0])?"await ":"")+jscompScodeFVar(L[0])),out("(");
    var FLT=False;
    if (N>4) {
      for (I=4;I<N;I++) {
        if (L[I]=="...") { FLT=True;break; }
      }
    }
    if (N>1) (isDefined(L[1])?jscompScode:jscompScodeSelf)(BODY,L[1],LEV+1,MLEV,VAR,FLT,SPR); // FIXME: what do we do if _$S is an expression ? In that case it's not VAR, which is the level below
    if (N>2) out(","),jscompScode(BODY,L[2],LEV+1,MLEV,1/*VAR for _$T*/);
    outIndentInc(+2);
    if (N>3) {
      out(",");
      crIndent();
      out("{");
      var FIRST=True;
      if (FLT) {
        out("_s:_s"+(LEV+1));
        FIRST=False;
      }
      for (var V in L[3]) {
        out(FIRST?"":","),FIRST=False;
        out((V=="♀"?'"♀"':V)+":");
        jscompScode(BODY,L[3][V],LEV+1,MLEV,V);
      }
      out("}");
    }
    out(N>4?",":"");
    if (N>4) {
      crIndent();
      var FLATTEN=False;
      for (I=4;I<N;I++) {
        if (L[I]=="...") {
          if (FLATTEN) error("jscompScode:flatten");
          FLATTEN=True;
          continue;
        }
        if (FLATTEN) out("...jxsp(_s"+(LEV+1)+","+(I-3)+",");
        jscompScode(BODY,L[I],LEV+1,MLEV,I-2-(FLATTEN?1:0),0,FLATTEN);
        if (FLATTEN) out(")"),FLATTEN=False;
        out(I+1<N?",":"");
      }
    }
    out(")");
    outIndentInc(-2);
  }
}
function jscompPcodeFunc(F) {
// FIXME: check that the attributes we receive as named parameters were all actually declared
// FIXME: check that there is no clash name between named parameters and others
  var NAME=F.NAME.toString();
  out((isAsyncFunc(NAME)?"async ":"")+"function "),out(NAME),out("(");
  var L=F.BODY,
      N=length(L[sAord]),
      FIRST=True,NV=0,VMULTI;
  for (var I=0; I<N; I++) {
    if (NV==2) out(",$_"),NV++;
    var V=L[sAord][I];
    if (L[V].ISPARM && !startsWith(V,"$_.")) {
      if (FIRST) FIRST=False;
            else out(",");
      if (L[V].MULTI) {
        out("...");
        if (I+1<N && L[sAord][I+1].ISPARM || V=="$_") error("jscompPcodeFunc::MULTI");
        VMULTI=V;
      }
      out(V),NV++;
    }
  } 
  out(") {");
  outIndentInc(+2);
  crIndent();
  var VAR=L[sAord];
  if (VMULTI) {
    out(VMULTI+"=jx$(jxargs(arguments,$_._s,2,"+VMULTI+"));");
    crIndent();
    out("delete $_._s;");
    crIndent();
  }
  out("var MDF;");
  crIndent();
  out("if (!"+VAR[0]+" || "+VAR[0]+".FUNC.FUNC.name!="+NAME+".name) {"); // FIXME: doesn't work for named subfunctions, in that case there can be collisions
  outIndentInc(+2);
  crIndent();
  out("MDF=1;");
  crIndent();
  var FIRST=True;
  out("var $_2;");
  crIndent();
  out(VAR[0]+"=jxe("+NAME+",[");
  out("$_2=jxv({"+'"'+sId+'":$_["'+sId+'"],"+o":$_["+o"]');
  for (var I=2; I<length(VAR); I++) if (L[VAR[I]].ISPARM && startsWith(VAR[I],"$_.")) {
    var N=splitTrim(VAR[I],".")[1];
    out(",");
    out(N+":"+VAR[I]+"=");
    out("jxv("+VAR[I]+',"'+N+'")');
  }
  if (FIRST) FIRST=False;
        else out(",");
  out("},\"$_\")");
  for (var I=1; I<length(VAR); I++) if (L[VAR[I]].ISPARM && !startsWith(VAR[I],"$_.")) {
    if (FIRST) FIRST=False;
          else out(",");
    out(VAR[I]+"=");
    out("jxv("+VAR[I]+',"'+VAR[I]+'")');
  }
  out("]"+(VMULTI?",1":"")+");");
  crIndent();
  out("for (var N in $_) if (!(N in jx$($_2))) jx$($_2)[N]=jxv($_[N],N);");
  crIndent();
  out("$_=$_2;");
  outIndentInc(-2);
  crIndent();
  out("}");
  crIndent();
  out("else {");
  outIndentInc(+2);
  crIndent();
  out("var _$=jxr("+VAR[0]+',"_$");');
  crIndent();
  out("MDF=0;");
  crIndent();
  out("var $_o=jxar("+VAR[0]+",0);");
  for (var I=1; I<length(VAR); I++) if (L[VAR[I]].ISPARM && VAR[I]!="$_" && !startsWith(VAR[I],"$_.")) {
    crIndent();
    out(VAR[I]+"=jxsr(jxar("+VAR[0]+","+I+"),"+VAR[I]+");");
    crIndent();
    out("MDF|=_$.TS<"+VAR[I]+".TS;");
  }
/*for (var I=2; I<length(VAR); I++) if (L[VAR[I]].ISPARM && startsWith(VAR[I],"$_.")) {
    crIndent();
    var V=splitTrim(VAR[I],".")[1];
    out("jxsr($_o.$."+V+","+VAR[I]+");");
    crIndent();
    out("MDF|=_$.TS<$_o.$."+V+".TS;");
  }*/
  crIndent();
  out("$_=jx$($_);");
  crIndent();
  out("for (var N in $_) {");
  outIndentInc(+2);
  crIndent();
  out("jxsr($_o.$[N],$_[N]);");
  crIndent();
  out("MDF|=_$.TS<$_o.$[N].TS;");
  outIndentInc(-2);
  crIndent();
  out("}");
  crIndent();
  out("$_=$_o;");
  outIndentInc(-2);
  crIndent();
  out("}");
  crIndent();
  envEnter(F);
  jscompScodeBody(F.BODY,0,1);
  envLeave();
  crIndent();
  out("jxelu("+VAR[0]+");");
  out("return jxv0(_$.$,"+VAR[0]+",_$.TS);");
  outIndentInc(-2);
  crIndent();
  out("}");
}
function jscompScodeEMN(L) {
  var FLT=False;
  function ML2(E) {
    if (!isArray(E)) {
      FLT|=E=="...";
      return 0;
    }
    var N=length(E),MN=0;
    for (var I=1;I<N;I++) if (I!=3) {
      var M=ML2(E[I])+1;
      if (M>MN) MN=M;
    }
    var A=E[3];
    for (var V in A) {
      var M=ML2(A[V])+1;
      if (M>MN) MN=M;
    }
    return MN;
  }
  var N=length(L[sAord]),MN=0;
  for (var I=0; I<N; I++) {
    var V=L[sAord][I],
        M=ML2(L[V].EXPR);
    if (M>MN) MN=M;
  }
  return [MN,FLT];
}
function jscompScodeDE(L,N,PREF) {
  if (isUndefined(PREF)) PREF="";
  out("var ");
  if (N<=0) N=1;
  for (var I=0;I<N;I++) out((I>0?",":"")+"_"+PREF+I);
  out(";");
}
function jscompScodeBody(L,CR,WITHMDF) {
  var EMN0=jscompScodeEMN(L),
      EMN=EMN0[0],FLT=EMN0[1];
  jscompScodeDE(L,EMN);
  if (FLT) {
    crIndent();
    jscompScodeDE(L,EMN+1,"s");
  }
  if (CR) crIndent();
  var VAR=L[sAord],
      N=length(VAR);
  crIndent();
  out("var _$=jxr("+VAR[0]+',"_$");');
  if (CR) crIndent();
  if (WITHMDF) {
    crIndent();
    out("if (MDF) {");
    outIndentInc(+2);
  }
  for (var I=0; I<N; I++) {
    if (!L[VAR[I]].ISPARM && !isPcodeFunc(L[VAR[I]].EXPR)) {
      crIndent();
      out((VAR[I]!="_$"?"var ":"")+VAR[I]+"=jxi("+VAR[0]+',"'+VAR[I]+'");'); // TODO: faire traiter les variables locales qui sont initialisées à une valeur constante comme des paramètres
    }
  }
  if (CR) crIndent(); // Hmm, not perfect
  for (var I=0; I<N; I++) {
    var V=L[sAord][I],OUT=0;
    if (isPcodeFunc(L[V].EXPR)) {
      crIndent(),OUT=1;
      jscompPcodeFunc(L[V].EXPR);
    }
    else
    if (!L[V].ISPARM && isDefined(L[V].EXPR)) {
      crIndent(),OUT=1;
      out("_0=");
      jscompScode(L,L[V].EXPR,0,EMN,V);
      out(";");
      crIndent();
      out("jxsr("+V.toString()+",_0"+(V=="_$"?",jixTime()":"")+");");
    }
    if (OUT && CR) cr();
  }
  if (WITHMDF) {
    outIndentInc(-2);
    crIndent();
    out("}");
  }
}
function jscompScodeBodyEnv(L) {
  var N=length(L[sAord]);
  out("{");
  var FIRST=True;
  for (var I=0; I<N; I++) {
    var V=L[sAord][I];
    if (!L[V].ISPARM) {
      out(FIRST?"":","),FIRST=False;
      out(V+":"+V);
    }
  }
  out("}");
}
origin.jscomp=function (L,NAME0,JS) {
  startOutS();
  var NAME="mod"+jscomp.MODNO;
  if (NAME0) NAME=fileName(NAME0);
        else jscomp.MODNO++;
  out("(function "+NAME+"(_$S,_$T,$_) {\nvar Undef=undefined;\n");
  out("if (!_$S) {"),cr();
  out('  _$S=jxe('+NAME+',[$_=jxv({},"$_")]);'),cr();
  out("}"),cr(),cr();
  envEnter(L);
  jscompScodeBody(L.BODY,1,0);
  envLeave();
  cr();
  out("return jxv0(_$.$,_$S,_$.TS);"),cr();
//out("return "),jscompScodeBodyEnv(L),out(";"),cr();
  out("})"),cr();
  var S=getOutS();
  stopOutS();
  if (isDefined(JS)) fileWrite(NAME+".js",S);
  return S;
}
jscomp.MODNO=0;

// Compilation (HTML)
function isHtmlTag(TAG) {
  return ["br", "hr", "input", "textarea",
          "span", "div", "p",
          "table", "tr", "td", "thead", "tbody", "th",
          "form",
          "pre",
          "img",
          "svg","path","g",
          "head", "link", "script",
          "html", "body", "iframe"].includes(TAG);
}
function isHtmlSelfClosingTag(TAG) {
  return ["br", "hr", "input", "link", "import"].includes(TAG);
}
function isHtmlBooleanAttribute(NAME) {
  return ["checked", "selected", "hidden", "readonly"].includes(NAME);
}
origin.toHtml=function (O) {
  function zpad(I) {
    if (isString(I)) I=Number(I); // TODO: handle this case more robustly
    I=String(I);
    if (I<10) I="0"+I;
    return I;
  }
  function val(V) {
    if (isNil(V)) V=""; //"\u00d8"; TODO: we forget nulls, here ; improve this
    if (isBoolean(V)) V=V?"1":"0";
    if (isa0(V,Buffer)) V=V.toString("hex");
    if (isDate(V)) V=V.getFullYear()+"-"+zpad(V.getMonth()+1)+"-"+zpad(V.getDate());
    return V.toString();
  }
  function rec(O) { // FIXME: if O is not an HTML tree, display it as JSON
    if (isAtom(O)) {
      out(val(O)+" ");
    }
    else {
      if (isHtmlTag(O[sType])) {
        out("<"+O[sType]),outIndentInc(+2);
        for (var ATTR in O) if (!contains([sType,sId,"+o","$"/*FIXME: not nice, especially for sId and "+o"*/],ATTR)) {
          var Q="",
              VAL=val(O[ATTR]);
          if (VAL=="" || length(VAL)>0 && VAL[0]!='"' && !strIsNum(VAL)) Q='"';
          if (isHtmlBooleanAttribute(ATTR)) out(Number(VAL)==0?"":" "+ATTR);
                                       else out(" "+ATTR+"="+Q+VAL+Q);
        }
        out(">");
        var INTABLE=O[sType]=="table"
            INTR=O[sType]=="tr";
        for (var ELT of O.$) {
          if (!isAtom(ELT)) crIndent();
          var EMBED=0;
          if (INTABLE) {
            EMBED=2;
            if (isHtmlTag(ELT[sType])) {
              if (contains(["thead","tbody","tr"],ELT[sType])) EMBED=0;
              if (ELT[sType]=="td" || ELT[sType]=="th") EMBED=1;
            }
          }
          if (INTR) {
            EMBED=3;
            if (isHtmlTag(ELT[sType]) && contains(["th","td"],ELT[sType])) EMBED=0;
          }
          if (EMBED==1) out("<tr>");
          if (EMBED==2) out("<tr><td>");
          if (EMBED==3) out("<td>");
          rec(ELT);
          if (EMBED==1) out("</tr>");
          if (EMBED==2) out("</td></tr>");
          if (EMBED==3) out("</td>");
        }
        outIndentInc(-2);
        if (!isHtmlSelfClosingTag(O[sType])) {
          crIndent();
          out("</"+O[sType]+">");
        }
      }
      else out(pretty(O));
    }
  }
  startOutS();
  rec(O);
  var S=getOutS();
  stopOutS();
  return S;
}
function jixCurrentClient(TH) {
  var CLI=server.currentClient();
  if (!TH || CLI && TH.CLI && TH.CLI!=CLI) error("jixCurrentClient");
  if (!CLI) CLI=TH.CLI;
  return CLI;
}
function jixEvalStart(B,TH) {
  if (B) {
    var CLI=jixCurrentClient(TH);
    if (CLI) {
      var DOM=CLI.container("DOM"),
          ADF=CLI.container("ADF");
      if (DOM) jxdom(DOM);
      if (ADF) jxadf(ADF);
    }
  }
  else {
    jxdom(Nil);
    jxadf(Nil);
  }
}
origin.jixBodyMod=function (L,NAME) { // TODO; factor this out, somehow
  var BODY=compileBody([],0);
  compileLet(BODY,"_$S",Undefined,False,True);
  var RES=createFunction(Nil,NAME,"",[],BODY);
  envEnter(RES);
  compileBody(L,0,BODY);
  envLeave();
  return RES;
}
function jixProp(LW) {
//console.log("jixProp=>",jixTime());
  for (var E of LW) {
    while (E) {
      var V=jxr(E,"_$");
    //if (!V) console.log(E),error("jixProp");
      if (V && isJxv(V)) V.TS=jixTime()-2; // TODO: check this thoroughly
    //console.log("  pps",E.NAME,jixTime());
      E=E[SymbolUp];
    }
  }
}
origin.jixEvalMod0=function (MOD,ESTART) {
  if (isUndefined(ESTART)) ESTART=1;
  jixTick();
  var CURTS=jixTick();
  var TH=jxthread(Nil,server.currentClient());
  if (ESTART) jixEvalStart(1,TH);
  jxstart(TH);
  var V=MOD(Nil,Nil,{});
  jixProp(TH.LWAIT);
  jxstart(Nil);
  TH.MOD=V.E;
  var RES;
  if (TH.WAITING) {
  //jixTick();
    TH.RESTART=jixRestart(TH.MOD,Nil,CURTS,ESTART);
    RES=(async function () {
      await TH.NEXT;
      return TH;
    })();
  }
  else RES=TH;
  if (ESTART) jixEvalStart(0);
  return RES;
}
function jixEvalMod(S,NAME,JS,EXT) {
  var L,FUNC;
  if (!JS) {
    if (EXT=="jxml") {
      L=S.fromHtml();
      if (L[0]=="jxml") L.shift(); // FIXME: remove that s%&t asap
    }
    else L=parseSexpr(S,"lisp",1);
    FUNC=jixBodyMod(L,NAME);
    S=jscomp(FUNC,NAME);
  }
  var MOD=eval(S.toString());
  return jixEvalMod0(MOD);
}

// Reeval
var _JXDOM=Nil,_JXADF=Nil,_JXTS=0;
origin.jxdom=function (DOM) {
  if (isDefined(DOM)) _JXDOM=DOM;
                 else return _JXDOM; 
}
function jxdomById(ID) {
  if (jxdom()) return jxdom().getById(ID);
}
origin.jxadf=function (ADF) {
  if (isDefined(ADF)) _JXADF=ADF;
                 else return _JXADF; 
}
function jxadfById(ID) {
  if (jxadf()) return jxadf().getById(ID);
}
origin.jixTick=function (TS) {
  if (isDefined(TS)) _JXTS=TS;
                else _JXTS+=1;
  return _JXTS;
}
origin.jixTickW=function () {
  _JXTS-=1;
}
origin.jixTime=function () {
  return _JXTS;
}
origin.jixEParms=function (E) {
  var PARMS=[E,E.PARM[1],E.PARM[0],...E.PARM.slice(2,E.NP-(E.MULTI?1:0))];
  if (E.MULTI) PARMS.splice(length(PARMS),0,...jx$(E.PARM[E.NP-1])); // TODO: add a spread, otherwise we lose the trexel of the multi parms' containing list
  return PARMS;
}
origin.jixRestart=function (E,PARMS,CURTS,ESTART) {
  function restart(TH,FIRST) {
  //reset jxwaiting() // Probably not needed, if the waiting functions always manage to return an empty res
    if (!FIRST && ESTART) jixEvalStart(1,TH);
    var NOW=jixTime();
    jixTick(CURTS);
    if (!PARMS) PARMS=jixEParms(E);
  //TH.LWAIT=[]; // FIXME: Would be nice, but erases too much ; otoh, there are exprs added more than once
    jxstart(TH);
    if (origin.DBGQUERY) console.log("RESTART ",E.FUNC.NAME,jixTime());
    var RES=E.FUNC.FUNC.apply(Undefined,PARMS);
    jixProp(TH.LWAIT);
    jxstart(Nil);
    jixTick(NOW);
    if (!FIRST && ESTART) jixEvalStart(0);
    if (TH && TH.WAITING) RES=TH.NEXT;
    else {
      if (TH) {
        for (var E2 of TH.LWAIT) {
          E2.STATE=jxFinished;
          E2.PAYLOAD=Nil;
        }
        TH.LWAIT=[];
      }
    }
    return RES;
  }
  return restart;
}
origin.jixReeval=function (E,PARM,ESTART) {
  if (isUndefined(ESTART)) ESTART=1;
  jixTick();
  var CURTS=jixTick();
  var TH=jxcurrent();
  if (ESTART) jixEvalStart(1,TH);
  if (isString(E)) { // TODO: test this
    var ADF=jxadf();
    if (!ADF) error("jixReeval(1)");
    E=ADF.getById(E);
    if (!E) error("jixReeval(2)");
  }
  for (var P in PARM) {
    jxsv(E,P,PARM[P],0,1);
  }
  var PARMS=jixEParms(E);
  var RESTART=jixRestart(E,PARMS,CURTS,ESTART);
  if (TH) TH.RESTART=RESTART;
  var V=RESTART(TH,1);
  if (ESTART) jixEvalStart(0);
  return V;
}

// Threads
origin.jxthread=function (MOD,CLI) {
  var RES={ CLI:CLI, MOD:MOD, WAITING:Undefined, LWAIT:[] };
  RES[sType]="thread";
  return RES;
}
var _JXTHREAD=Nil;
origin.jxstart=function (THREAD) {
  if (THREAD && _JXTHREAD && THREAD!=_JXTHREAD) error("jxstart");
  _JXTHREAD=THREAD;
}
origin.jxcurrent=function () {
  return _JXTHREAD;
}

// Runtime
function jsfunc(NAME,FUNC) {
  var RES={ NAME:NAME, FUNC:FUNC };
  RES[sType]="jsfunc";
  return RES;
}

origin.nop=function () { // No operation
}
origin.jxf=function (FUNC) { // Not sure we need it
}
origin.isJxv=function (O) {
  return !isNil(O) && O[sType]=="var";
}
origin.jxv0=function (VAL,E,TS,NAME) {
  var RES={ TS:TS, NAME:NAME, $:Undefined, E:Undefined };
  if (isUndefined(NAME)) delete RES.NAME;
  if (isUndefined(TS)) delete RES.TS;
  RES.$=VAL,RES.E=E;
  RES[sType]="var";
  return RES;
}
function jxmdf(VAL) {
  var MDF=0,V;
  if (isJxv(VAL)) V=VAL,VAL=V.$;
  if (!VAL) return 0;
  if (isModified(VAL)) {
    VAL.setTs(_JXTS);
    VAL.setModified(0);
    MDF=1;
  }
  var TS=VAL.getTs();
  if (V && TS && (!V.TS || TS>V.TS)) {
    V.TS=TS
    MDF=1;
  }
  return MDF;
}
origin.jxv=function (VAL,NAME,RES) {
  if (isDefined(NAME) && isDefined(RES) && RES.NAME!=NAME) error("jxv::NAME");
  var EX=isDefined(RES),
      MDF=!EX || jxmdf(VAL) || EX
       && (isJxv(VAL) && (RES.$!=VAL.$ || RES.E!=VAL.E
                                       || isDefined(VAL.TS) && isDefined(RES.TS) && RES.TS!=VAL.TS)
        || !isJxv(VAL) && (RES.$!=VAL));
  if (!MDF) return RES;
  if (EX) {
    if (isJxv(RES) && isDefined(RES.$)) {
      RES.OLD=jxv0(RES.$,RES.E,RES.TS,RES.NAME);
    }
  }
  else RES=jxv0(Undefined,Undefined,_JXTS,NAME);
  if (isJxv(VAL)) {
    RES.$=VAL.$,RES.E=VAL.E;
    if (isDefined(VAL.TS)) RES.TS=VAL.TS;
  }
  else RES.$=VAL,RES.E=isUndefined(VAL)?VAL:Nil,RES.TS=_JXTS;
  return RES;
}
declare({ jxFinished:0,
          jxWaiting:1,
          jxLoaded:2 });
origin.jxelu=function (E) {
//console.log("linkUp0=>",E.NAME,E.MULTI);
  function linkUp(V) {
  //if (isJxv(V)) console.log("  var=>",V.NAME);
    if (isJxv(V) && V.E) /*console.log("  linkUp=>",V.E.NAME),*/V.E[SymbolUp]=E;
  }
  var M=E.MULTI;
  for (var I=1;I<length(E.PARM)-M;I++) linkUp(E.PARM[I]);
  if (M && length(E.PARM)>1) {
    var L=jx$(E.PARM[E.NP-1]);
    if (isArray(L)) for (var V of L) linkUp(V);
  }
  for (var V in E.ATTRS) linkUp(E.ATTRS[V]);
}
origin.TXC=0;
origin.TXCL=0;
origin.jxe=function (FUNC,PARM,MULTI) { // TODO: implement the incremental version of that
  var NAME;
  if (isString(FUNC)) NAME=FUNC,FUNC=origin[FUNC];
  if (!isFunction(FUNC)) error("jxe::FUNC");
  if (isUndefined(NAME)) NAME=FUNC.name;
  var RES={ NAME:NAME, FUNC:jsfunc(NAME,FUNC), PARM:[] };
  origin.TXC++
  for (var V of PARM) RES.PARM.push(V),origin.TXCL++;
  RES.MULTI=MULTI?1:0;
  RES.NP=length(PARM);
  RES.ATTRS=jx$(RES.PARM[0]);
  RES[sType]="expr";
  RES.STATE=jxFinished;
  var ATTRS=RES.PARM[0];
  var FID;
  if (ATTRS && ATTRS.$) for (NID of [sId,"+o"]) { // TODO: factor out this: sId, then "+o" if not found, etc. (& do it well, no dups)
    var ID=jx$(ATTRS.$[NID]);
    if (ID && !FID) FID=ID;
    delete ATTRS.$[NID]; // FIXME: can't remove, in general it has to come back with the reeval of constant parms of the expr
  }
  if (ATTRS && ATTRS.$) { // TODO: remove this if(), it's not necessary anymore
    delete ATTRS.$["_s"]; // TODO: replace "_s" by the appropriate symbol
  }
  var ADF=jxadf();
  if (ADF) {
    ADF.store(RES,FID);
    if (isNil(ADF.PERSIST)) ADF.PERSIST={};
    if (FID) ADF.PERSIST[FID]=RES;
  }
  return RES;
}
jxe.SKIN=(function () {
  var SK={ "*":{ "short":{ "*":["av",""]
                         }
               }
         };
  SK["*"]["short"][SymbolId]=["-",""];
  SK["*"]["short"][SymbolCont]=["-",""];
  SK["*"]["short"][sType]=["-",""];
  SK["*"]["short"]["<="]=["av","name"];
  SK["*"]["short"]["FUNC"]=["-",""]; //["av","name"];
  SK["*"]["short"]["$"]=["av",""];
  SK["*"]["short"]["E"]=["-",""];
  SK["*"]["short"]["PARM"]=["vi",""];
  SK["*"]["short"]["NAME"]=["v",""];
  SK["*"]["short"]["TS"]=["v",""];
  return SK;
})();

origin.jxr=function (SELF,NAME) {
  if (isNil(SELF)) error("jxr");
  var V=find(SELF.PARM,function (V) { return V.NAME==NAME; });
  if (V) return V;
  return jxnr(SELF,NAME);
}
origin.jxnr=function (SELF,NAME) {
  if (isNil(SELF)) error("jxnr");
  var ATTR=SELF.PARM[0].$;
  if (ATTR) return ATTR[NAME];
       else return Undefined;
}
origin.jxne=function (SELF,NAME) {
  if (isUndefined(SELF)) return Undefined;
  var V=jxnr(SELF,NAME);
  if (isDefined(V)) V=V.E;
  return V;
}
origin.jxar=function (SELF,POS,ISPARM) {
  if (isNil(SELF)/*FIXME: sort out the difference between Nil and Undefined, here & everywhere*/) return Undefined;
  var RES;
  if (ISPARM) {
    if (!SELF.MULTI || POS<SELF.NP-1) RES=SELF.PARM[POS];
    else {
      var L=SELF.PARM[SELF.NP-1].$; // TODO: check thoroughly calculation here
      RES=L[POS-SELF.NP+1];
    }
  }
  else RES=SELF.PARM[POS];
//if (isUndefined(RES)) error("jxar::!ISPARM");
  return RES;
}
origin.jxae=function (SELF,POS) {
  if (isNil(SELF)/*FIXME: sort out the difference between Nil and Undefined, here & everywhere*/) return Undefined;
  return jxar(SELF,POS,1).E;
}
origin.jxaspe=function (SELF,POS) {
  if (isDefined(SELF) && SELF.MULTI && POS==SELF.NP-1) return jxar(SELF,POS).E;
  return Undefined;
}
origin.jxsr=function (V,VAL,TS) {
  var RES=jxv(VAL,Undefined,V);
  if (TS) RES.TS=TS;
  return RES;
}
origin.jxsv=function (SELF,NAME,VAL,RESET,NP) {
  if (isNil(SELF)) error("jxsv");
  var V=jxr(SELF,NAME);
  if (isUndefined(V)) {
    V=jxv(VAL,NAME);
    if (NP) SELF.PARM[0].$[NAME]=V;
       else SELF.PARM.push(V);
  }
  else {
    if (RESET) V.$=VAL;
          else jxv(VAL,NAME,V);
  }
  return V;
}
origin.jxi=function (SELF,NAME,NP) {
  return jxsv(SELF,NAME,Undefined,1,NP);
}
origin.jx$=function (O) {
  if (isJxv(O)) O=O.$;
  return O;
}
origin.jxsp=function (SP,POS,L) {
  SP[POS]=L;
  return jx$(L);
}
origin.jxargs=function (A,SP,POS,VAL) {
  var J;
  if (isDefined(SP)) for (var I in SP) {
    if (isDefined(J)) J=I-J-1;
                 else J=I;
    if (J==POS) return SP[I];
    J+=length(SP[I]);
  }
  for (var I in VAL) if (isJxv(VAL[I])) VAL[I]=jxv(VAL[I]);
  return VAL;
}

origin.jxegv=function (SELF,THIS,ATTRS,V,NAME) {
  var E=V.E,RES;
  if (!isNil(E)) {
    var L=E.PARM;
    for (var V2 of L) if (V2.NAME==NAME) { RES=jx$(V2);break; }
  }
  return jxv0(jx$(RES),SELF,jixTime());
}

// Primitives
origin._eq=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)==jx$(B)?1:0;
}
origin._neq=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)!=jx$(B)?1:0;
}
origin._inf=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)<jx$(B)?1:0;
}
origin._infe=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)<=jx$(B)?1:0;
}
origin._sup=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)>jx$(B)?1:0;
}
origin._supe=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)>=jx$(B)?1:0;
}
origin._not=function (SELF,THIS,ATTRS,A) {
  return !jx$(A)?1:0;
}
origin._and=function (SELF,THIS,ATTRS,A,B) { // FIXME: make it n-ary
  return jx$(A)&&jx$(B)?1:0;
}
origin._or=function (SELF,THIS,ATTRS,A,B) {
  return jx$(A)||jx$(B)?1:0;
}
origin._add=function (SELF,THIS,ATTRS,...A) {
  A=A.map(jx$);
  var ALLNUM=1;
  for (var X of A) {
    if (!isNumber(X)
     && !(isString(X) && strNumberLength(X,0)==length(X))) ALLNUM=0;
  }
  A=A.map(ALLNUM?num:str);
  var RES=ALLNUM?0:"";
  for (var X of A) RES+=X;
  return RES;
}
origin.__sy__add=function (SELF,THIS,ATTRS,...A) {
  A=A.map(jx$);
  A=A.filter((X)=>isNil(X)?"":X);
  var RES=_add(SELF,THIS,ATTRS,...A);
  return RES;
}

origin.concat=function (SELF,THIS,ATTRS,A1,A2) {
  return jx$(A1).concat(jx$(A2));
}
origin._sub=function (SELF,THIS,ATTRS,A,B) {
  return Number(jx$(A))-Number(jx$(B));
}
origin._mul=function (SELF,THIS,ATTRS,A,B) {
  return Number(jx$(A))*Number(jx$(B));
}
function dam(Y,M,NM) {
  Y=Number(Y);
  M=Number(M);
  NM=Number(NM);
  if (NM==0) return [Y,M];
  var S=NM>0?1:-1;
  NM*=S;
  while (NM>0) {
    if (S==1) if (M==12) M=1,Y++; else M++;
         else if (M==1) M=12,Y--; else M--;
    NM--;
  }
  return [Y,M];
}
origin._dam=function (SELF,THIS,ATTRS,Y,M,NM) {
  return dam(jx$(Y),jx$(M),jx$(NM));
}
origin._len=function (SELF,THIS,ATTRS,A) {
  return length(jx$(A));
}
origin._subst=function (SELF,THIS,ATTRS,S,I,J) {
  S=jx$(S);
  if (!isString(S)) return Nil;
  I=jx$(I);
  J=jx$(J);
  return substring(S,I,J);
}
origin._repl=function (SELF,THIS,ATTRS,S,S1,S2) {
  S=jx$(S);
  S1=jx$(S1);
  S2=jx$(S2);
  if (!isString(S) || !isString(S1) || !isString(S2)) return Nil;
  return replaceAll(S,S1,S2);
}
origin._join=function (SELF,THIS,ATTRS,L,S) {
  L=jx$(L);
  S=jx$(S);
  if (!isArray(L) || !isString(S)) return Nil;
  return L.join(S);
}
origin._ajoin=function (SELF,THIS,ATTRS,A,SEP) {
  var RES=[];
  A=jx$(A);
  SEP=jx$(SEP);
  if (!isArray(A)) return Nil;
  for (var I=0; I<length(A); I++) {
    if (I!=0) RES.push(SEP);
    RES.push(A[I]);
  }
  return RES;
}
var _GST={};
origin.gensym2=function (SELF,THIS,ATTRS,S) {
  S=jx$(S);
  if (isNil(_GST[S])) _GST[S]=0;
  var RES=S+_GST[S];
  _GST[S]++;
  return RES;
}

origin.jxarr=function (SELF,THIS,ATTRS,...$) { // OK
  var RES=[];
  RES[sType]="jxarr";
  Object.assign(RES,$);
  return RES;
}
origin.jsobj=function (SELF,THIS,ATTRS,...$) {
  var RES={};
  //RES[sType]="jsobj"; NOTE: not nice, it's not a pure JS obj, sType disturbs further processing
  Object.assign(RES,ATTRS);
  for (var N in RES) RES[N]=jx$(RES[N]);
  $=jx$($).map(jx$);
  for (var I=0;I<length($);I+=2) RES[$[I]]=$[I+1];
  return RES;
}
origin.keys=function (SELF,THIS,ATTRS,O) {
  O=jx$(O);
  if (isNil(O)) return jxv0(Nil,Nil);
  return O.keys();
}
origin.akeys=function (SELF,THIS,ATTRS,O) {
  O=jx$(O);
  if (isNil(O)) return jxv0(Nil,Nil);
  return O.akeys();
}
origin.kmap=function (SELF,THIS,ATTRS,O,RW) {
  O=jx$(O);
  RW=jx$(RW);
  var O2={};
  for (var V in O) if (O[V] && RW[V]) O2[RW[V]]=O[V];
  if (isNil(O2)) return jxv0(Nil,Nil);
  return O2;
}
origin.vals=function (SELF,THIS,ATTRS,O) {
  O=jx$(O);
  if (isNil(O)) return jxv0(Nil,Nil);
  return O.keys().map((K)=>O[K]);
}
origin.jsosplice=function (SELF,THIS,ATTRS,...$) {
  var RES={};
  for (var N in RES) RES[N]=jx$(RES[N]);
  $=jx$($).map(jx$);
  for (var I=0;I<length($);I++) RES[$[I][0]]=$[I][1];
  return RES;
}
origin.kindex=function (SELF,THIS,ATTRS,L,IDXN) {
  L=jx$(L);
  IDXN=jx$(IDXN);
  var L2={};
  for (var O of L) L2[O[IDXN]]=O;
  if (isNil(L2)) return jxv0(Nil,Nil);
  return jxv0(L2,SELF,jixTime());
}
origin.jsofetch=function (SELF,THIS,ATTRS,L,...$) {
  var RES;
  L=jx$(L);
  if (isArray(L)) {
    $=jx$($);
    var N=length($);
    for (var O of L) {
      var FOUND=1;
      for (var I=0; I<N; I+=2) {
        if (O[jx$($[I])]!=jx$($[I+1])) { FOUND=0;break; }
      }
      if (FOUND) { RES=O;break; }
    }
  }
  if (isNil(RES)) return jxv0(Nil,Nil);
  return RES;
}

origin.getv=function (SELF,THIS,ATTRS,A,I) {
  var V;
  if (!isNil(jx$(A))) V=jx$(A)[jx$(I)]; // TODO: hmm, not sure that allowing reading (always undefined) inside Nil objs is the best way to regularize things
  var TS;
  if (isJxv(A) && A.TS) TS=A.TS;
  return jxv0(V,Nil,TS);
}
origin.getnv=function (SELF,THIS,ATTRS,A,I) {
  var V;
  if (!isNil(jx$(A))) for (var N in jx$(A)) if (N!=jx$(I)) {
    V=N;
    break;
  }
  var TS;
  if (isJxv(A) && A.TS) TS=A.TS;
  return jxv0(V,Nil,TS);
}
origin._setv=function (SELF,THIS,ATTRS,A,I,V) {
  var A0=A;
  A=jx$(A);
  A[jx$(I)]=jx$(V);
  ; // TODO: Handle TS
  return A0;
}
origin.empty2=function (SELF,THIS,ATTRS,L) {
  return empty(jx$(L))?1:0;
}
origin.nempty2=function (SELF,THIS,ATTRS,L) {
  return empty(jx$(L))?0:1;
}
origin.parse2=function (SELF,THIS,ATTRS,S) {
  S=jx$(S);
  if (isString(S)) S=parse(S)[0];
  return jxv0(S,Nil,jixTime());
}
origin.serialize2=function (SELF,THIS,ATTRS,O) {
  O=serialize([jx$(O)]);
  O=O.replace(/"/g,"'"); // FIXME: hsss ...
  return jxv0(O,Nil);
}
origin.JXO=0;
origin.jxobj=function (SELF,THIS,ATTRS,F,A,$) { // OK
  var RES,ID=jx$(A)["id"],SELF0=SELF;
  if (isDefined(SELF)) {
    RES=jx$(jxr(SELF,"_$"));
    if (!jx$(ID)) ID=RES["id"];
    for (var N in RES) delete RES[N];
  }
  else {
    RES={};
    SELF=jxe("jxobj",[jxv({},"$_"),jxv(THIS,"THIS"),jxv(F,"F"),jxv(A,"A"),jxv($,"$")]);
    origin.JXO++;
  }
  A=jx$(A);
  $=jx$($);
  RES[sType]=F.NAME;
  for (var N in A) {
    var V=jx$(A[N]);
    if (isDefined(V)) RES[N]=V;
  }
  if (jxdom() && isUndefined(SELF0)) {
    jxdom().store(RES,jx$(ID));
    var ID2=RES.getId();
    if (ID2!=jx$(ID)) ID=ID2;
  }
  if (isDefined(jx$(ID))) RES["id"]=jx$(ID);
  RES.$=$.map(function (O) { return jx$(O); });
  var _$=jxi(SELF,"_$");
  jxsr(_$,RES);
  return jxv0(RES,SELF);
}
origin._inc=function (SELF,THIS,ATTRS,X) {
  return jx$(X)+1;
}
origin.fcond=function (SELF,THIS,ATTRS,...$) {
  $=jx$($);
  var N=length($),RES;
  for (var I=0; I<N-(N%2); I+=2) {
    if (jx$($[I])) { RES=$[I+1];break;/*FIXME: manage the case when several conditions are true*/ }
  }
  if (isUndefined(RES)) {
    if (N%2) RES=$[N-1];
  //if (isFalse(RES)) RES=nop;
  }
  return jxv0(jx$(RES),SELF,jixTime()/*Reevaluated each time*//*FIXME: should test if test result has a TS ; check whether the same kind of shit occurs somewhere else in the code*/);
}
origin._filter=function (SELF,L,ATTRS,F) {
  L=jx$(L);
  F=jx$(F);
  var RES=L.filter(function (O) { return jx$(F(Nil,Nil,{},jx$(O))); });
  return jxv0(RES,SELF,jixTime());
}
origin._sort=function (SELF,L,ATTRS,SLOTS) {
  var RES=sort(jx$(L),jx$(SLOTS));
  return jxv0(RES,SELF,jixTime());
}
origin.map=function (SELF,L,ATTRS,F) { // OK
  SELF=jxe("map",[jxv({},"$_"),jxv(L,"L"),jxv(F,"F")]);
  L=jx$(L);
  F=jx$(F);
  var RES=L.map(function (O) { return jx$(F(Nil,Nil,{},O))/*NOTE: see if we should keep jx$() or not, here*/; });
  return jxv0(RES,SELF,jixTime());
}
origin.database=function (SELF,THIS,ATTRS) { // OK (?)
  var SRC=ATTRS["src"];
      DB=server.SRV[0].container(SRC);
  if (isUndefined(DB)) error("database : "+SRC+" not found");
  return DB;
}
origin.DBGQUERY=0;
origin.query=function (SELF,THIS,ATTRS,DB,Q) {
  async function doq(DB,Q) {
    if (isMysql(DB)) {
      Q=container.query(Q);
      if (Q.QUERY[""]=="#") return await DB.sql(Q.QUERY.sql);
                       else return await DB.read(Q); // FIXME: have only one interface to all kinds of containers
    }
    else return DB.query(Q);
  }
  if (isUndefined(SELF)) {
    SELF=jxe("query",[jxv({},"$_"),jxv(THIS,"THIS"),jxv(DB,"DB"),jxv(Q,"Q")]);
  }
  var RES,
      TH=jxcurrent();
  DB=jx$(DB);
  Q=jx$(Q);
  if (Q=="{}" || length(Q)==0) RES=[];
  else
  if (SELF.STATE==jxFinished) {
    if (isString(DB)) DB=server.getById(0).container(DB);
    if (isString(Q)) Q=parse(Q)[0];
    if (TH) {
      if (origin.DBGQUERY) console.log("query.start<"+jixTime()+">",Q);
      if (!TH.NEXT) { //error("TH.NEXT");
        TH.NEXT=(async function(TH) {
          if (origin.DBGQUERY) console.log("query.next<"+jixTime()+">",Q);
          RES=await doq(DB,Q);
          SELF.PAYLOAD=RES;
        //console.log("query.RES==>",RES);
          SELF.STATE=jxLoaded;
          TH.WAITING=0;
          TH.NEXT=Nil;
          return TH.RESTART(TH);
        })(TH).then((X) => (nop(),X)/*console.log('resolved promise!')*/)
              .catch((error) => console.error("!!!===>",error));;
        SELF.STATE=jxWaiting;
      //SELF.PAYLOAD=Undefined; not needed ; must be cleared once the thread is finished
        TH.WAITING=1;
        jixTickW();
      }
      TH.LWAIT.push(SELF);
      if (origin.DBGQUERY) console.log("query.lwait<"+jixTime()+">",Q);
      RES=[];
    }
    else RES=DB.query(Q);
  }
  else
  if (SELF.STATE==jxWaiting) { RES=[];if (origin.DBGQUERY) console.log("query.waiting<"+jixTime()+">",Q); }
  else
  if (SELF.STATE==jxLoaded) { RES=SELF.PAYLOAD;if (origin.DBGQUERY) console.log("query.loaded<"+jixTime()+">",Q); }
  return jxv0(RES,SELF,jixTime()); // FIXME: there is a shit, here, one should only release with jixTime() when _all_ the results are here. Otherwise one can get half-calculated sets of variables.
}
//origin.query.QUALIF=sAsync;
origin.clog1=function (SELF,THIS,ATTRS,O) {
  console.log(jx$(O));
  return Nil;
}
origin.getId=function (SELF,THIS,ATTRS,O) { // Returns the id as exported (i.e. "contname#id" ; so that doesn't corresponds to "fullId") ; TODO: integrate all these variations of more or less full IDs inside the core management of IDs in containers
  var ID;
  O=jx$(O);
  if (O) {
    if (O[sId]) ID=O[sId]; // TODO: improve this and put all this normalization stuff in the lower layers
    if (O["+o"]) ID=O["+o"];
            else ID=O.getId();
    if (isString(ID) && count(ID,"#")>=2) ;
    else
    if (isString(ID) || isNumber(ID)) {
      var L=splitTrim(String(ID),"#");
      ID=last(L);
      var TYO=length(L)>1?L[0]:Nil;
      if (TYO) ID=TYO+"#"+ID;
      var CONT=O.containerOf();
      if (CONT && isString(CONT.NAME)) ID=CONT.NAME+"#"+ID;
    }
  }
  return ID;
}
origin.println=function (SELF,THIS,ATTRS,...L) { // OK
  L=jx$(jxargs(arguments,ATTRS._s,2,L));
  for (var I=0; I<length(L); I++) {
    out(pretty(jx$(L[I])));
    if (I+1<length(L)) out(" ");
  }
  cr();
  return Nil;
}

// HTML extensions
function htmlt(T,A,$) {
  var RES={};
  RES[sType]=T;
  A=jx$(A);
  for (var N in A) RES[N]=jx$(A[N]);
  $=jx$($);
  RES.$=$.map(function (O) { return jx$(O); });
  return RES;
}
origin.htmle0=function (SELF,THIS,ATTRS,...$) { // Dev
  return htmlt("div",ATTRS,$);
}
function csslu(L) {
  if (strIsNum(L)) return "px";
  if (length(L)<2) return Nil;
  if (endsWith(L,"%")) return "%";
  if (length(L)<3) return Nil;
  if (endsWith(L,"vw")) return "vw";
  if (endsWith(L,"vh")) return "vh";
  return Nil;
}
function cssl(L) {
  var U=csslu(L),V=L;
  if (U) {
    if (!strIsNum(L)) V=substring(V,0,length(V)-length(U));
    if (!strIsNum(V)) U=Nil;
                 else V=num(V);
  }
  return [num(V),U];
}
origin.svg=function (SELF,THIS,ATTRS,...$) {
  var W=jx$(ATTRS.width),
      H=jx$(ATTRS.height),R;
  if (isDefined(W) && isDefined(H)) {
    W=cssl(W);
    H=cssl(H);
    if (W[1] && W[1]==H[1]) R=W[0]/H[0];
  }
  var A=Object.assign(ATTRS);
  var WP=jx$(ATTRS.boxwh),HP;
  if (WP) {
    WP=num(WP);
    delete A.boxwh;
  }
  else WP=1000;
  HP=WP;
  if (R>1) HP=HP/R;
      else WP=WP*R;
  WP=WP.toFixed(0);
  HP=HP.toFixed(0);
  A.viewBox="0 0 "+WP+" "+HP;
  A.preserveAspectRatio="none";
  return htmlt("svg",A,$);
}
origin.path=function (SELF,THIS,ATTRS,...$) {
  return htmlt("path",ATTRS,$);
}
function arcP(CX,CY,R,A) {
  return [CX+R*Math.cos(2*Math.PI*A),CY+R*Math.sin(2*Math.PI*A)];
}
function arc0(CX,CY,R,A0,A1) {
  var P1=arcP(CX,CY,R,A0),
      P2=arcP(CX,CY,R,A1);
  return "M "+P1[0]+" "+P1[1]+" A "+R+" "+R+" 0 0 1 "+P2[0]+" "+P2[1];
}
function arcs0(CX,CY,R,A0,A1) { // Slice
  var P1=arcP(CX,CY,R,A0),
      P2=arcP(CX,CY,R,A1);
  return "M "+CX+" "+CY+" L "+P1[0]+" "+P1[1]
       +" A "+R+" "+R+" 0 0 1 "+P2[0]+" "+P2[1]
       +" L "+CX+" "+CY;
}
function arc1(CX,CY,R,A0,A1) {
  function slice(A0,A1) {
    var A={ stroke:"none",
            d:arcs0(CX,CY,R,A0,A1)
          };
    var PA1=htmlt("path",A,[]);
    A={ fill:"none",
        d:arc0(CX,CY,R,A0,A1)
      };
    var PA2=htmlt("path",A,[]);
    return [PA1,PA2];
  }
  var S=[],ST=0.45;
  for (var POS=A0;POS<=A1;POS+=ST) {
    var POS2=POS+ST;
    if (POS2>A1) POS2=A1;
    S=S.concat(slice(POS,POS2));
  }
  return S;
}
origin.arc=function (SELF,THIS,ATTRS,...$) {
  var CX=jx$(ATTRS.cx),
      CY=jx$(ATTRS.cy),
      R=jx$(ATTRS.r),
      A0=jx$(ATTRS.a0),
      A1=jx$(ATTRS.a1);
  if (isNil(A0)) A0=0;
  if (isNil(A1)) A1=1;
  if (isNil(CX) || isNil(CY) || isNil(R)) return htmlt("path",{},[]);
  CX=num(CX);
  CY=num(CY);
  R=num(R);
  A0=num(A0);
  A1=num(A1);
  var A=Object.assign(ATTRS);
  delete A.cx;
  delete A.cy;
  delete A.r;
  delete A.a0;
  delete A.a1;
  return htmlt("g",A,arc1(CX,CY,R,A0,A1));
}
origin.camembert=function (SELF,THIS,ATTRS,...$) {
  var CX=jx$(ATTRS.cx),
      CY=jx$(ATTRS.cy),
      R=jx$(ATTRS.r),
      FR=jx$(ATTRS.freq),
      COL=jx$(ATTRS.colors);
  if (isNil(CX) || isNil(CY) || isNil(R)
   || !isArray(FR) || !isArray(COL)
   || length(FR)!=length(COL) || length(FR)==0) return htmlt("path",{},[]);
  CX=num(CX);
  CY=num(CY);
  R=num(R);
  var A=Object.assign(ATTRS);
  delete A.cx;
  delete A.cy;
  delete A.r;
  delete A.freq;
  delete A.colors;
  var POS=0,g$=[],SUM=0;
  for (var I=0;I<length(FR);I++) SUM+=FR[I];
  for (var I=0;I<length(FR);I++) {
    g$=g$.concat(htmlt("g",{ fill:COL[I] },arc1(CX,CY,R,POS,POS+FR[I]/SUM)));
    POS+=FR[I]/SUM;
  }
  return htmlt("g",A,g$);
}
