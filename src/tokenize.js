/*
 * tokenize.js
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

// Ranges
origin.range=function (O,MIN,MAX,LI,COL) {
  return { "OBJ":O,"MIN":MIN,"MAX":MAX,"NAT":Nil,"LI":LI,"COL":COL };
}
origin.rangeBOF=function (RG) {
  return RG.MIN==0;
}
origin.rangeEOF=function (RG) {
  return RG.MIN>=length(RG.OBJ);
}
origin.rangeValue=function (RG) {
  var S=substring(RG.OBJ,RG.MIN,RG.MAX);
  if (RG.NAT==TokenNatStr && TOKENIZEDQUOTESINSTRING) {
    var Q=S[0];
    S=Q+substring(S,1,length(S)-1).replace(/""/g,'"')+Q;
  }
  return S;
}

// Strings (common patterns)
origin.strNumberLength=function (S,i) {
  var i0=i;
  while (S[i]=='+' || S[i]=='-') i++;
  if (isUndefined(S[i]) || !charIsDigit10(S[i])) return 0;
  var DOT=False,
      RADIX=10;
  if (S[i+1]=='b' || S[i+1]=='B') RADIX=2,i+=2; // FIXME: check completely that always i<length(S)
  if (S[i+1]=='x' || S[i+1]=='X') RADIX=16,i+=2;
  if (!charIsDigitInRadix(S[i],RADIX)) return 0;
  while (i<length(S) && charIsDigitInRadix(S[i],RADIX)) {
    while (i<length(S) && charIsDigitInRadix(S[i],RADIX)) i++;
    if (S[i]=='.') { if (DOT) return i-i0; else DOT=True,i++; }
  }
  if (RADIX==10 && (S[i]=='e' || S[i]=='E')) {
    i++;if (S[i]=='+' || S[i]=='-') i++;
    while (i<length(S) && charIsDigitInRadix(S[i],RADIX)) i++;
  }
  return i-i0;
}

// Lexer
var TOKENIZEDQUOTESINSTRING=False;
function lexerReadString(S,i,C) {
  while (i<length(S)) {
    if (S[i]=='\\') i++;
    else
    if (S[i]==C) {
      if (TOKENIZEDQUOTESINSTRING) {
        if (i+1<length(S) && S[i]=='"' && S[i+1]=='"') i++;
                                                  else break;
      }
      else break;
    }
    i++;
  }
  if (i>=length(S)) error("lexerReadString");
  return i;
}
function lexerReadUntil(S,i,C1,C2,STRICT) {
  if (STRICT==Undefined) STRICT=True;
  while (i<length(S)) {
    if (S[i]==C1 && (C2==-1 || i+1<length(S) && S[i+1]==C2)) break;
    i++;
  }
  if (STRICT && i>=length(S)) error("lexerReadUntil");
  return i;
}
function lexerRead(S,i,N1,N2) {
  while (i<length(S) && (charIs(S[i],N1) || charIs(S[i],N2))) {
    if (TOKENIZECOMMENTS && S[i]=="/" && i+1<length(S) && (S[i+1]=="*" || S[i+1]=="/")) break;
    i++;
  }
  return i;
}

var TokenNatNone=0,
    TokenNatIdf=1,
    TokenNatStr=2,TokenNatNum=3,
    TokenNatOpn=4,
    TokenNatSpc=5,TokenNatComment=6;
function charnatToToknat(N) {
  var RES=TokenNatNone;
  switch (N) {
    case CharNatAlf  : RES=TokenNatIdf; break;
    case CharNatOmg  : RES=TokenNatOpn; break;
    case CharNatDigit: RES=TokenNatNum; break;
    case CharNatBlank: RES=TokenNatSpc; break;
    default: return TokenNatNone; //out(display(N)),error("charnatToToknat");
  }
  return RES;
}
function lexerLiColNext(RG) {
  var LI=RG.LI,COL=RG.COL,
      S=RG.OBJ,i;
  if (RG.MIN<length(S)) for (i=RG.MIN;i<RG.MAX;i++) {
    if (S[i]=="\n") LI+=1,COL=1;
               else COL+=1;
  }
  return [LI,COL];
}
var TOKOPS,TOKOPS_0,TOKENIZECOMMENTS=True,TOKENIZEPYCOMMENTS=False; // FIXME: improve management of TOKENIZECOMMENTS
var TOKENIZEQUOTES=True; // FIXME: improve management of TOKENIZEQUOTES
var TOKENIZENUMS=True;
origin.lexerNext=function (RG) {
  var S=RG.OBJ;
  var i0,i=RG.MAX;
  var BEG,END,LI,COL;
  var LICOL=lexerLiColNext(RG);
  LI=LICOL[0];
  COL=LICOL[1];
  var NAT=TokenNatNone;
  if (i<length(S)) {
    BEG=END=-1;
    if (i>=0 && TOKENIZEQUOTES && !(i>0 && (S[i-1]=='\\' || S[i-1]=='/'/*FIXME: handle better regular expressions that start with dquote*/)) && (S[i]=='\"' || charIs("'",CharNatQuote) && S[i]=='\'')) {
      i0=i;
      i=lexerReadString(S,i+1,S[i]);
      BEG=i0,END=i+1;
      NAT=TokenNatStr;
    }
    else
    if (TOKENIZECOMMENTS && i>=0 && i+1<length(S) && S[i]=='/' && S[i+1]=='*') {
      i0=i;
      i=lexerReadUntil(S,i+2,'*','/');
      BEG=i0,END=i+2;
      NAT=TokenNatComment;
    }
    else
    if (TOKENIZECOMMENTS && i>=0 && i+1<length(S) && S[i]=='/' && S[i+1]=='/') {
      i0=i;
      i=lexerReadUntil(S,i+2,"\n",-1,False);
      BEG=i0,END=i+(i>=length(S)?0:1);
      NAT=TokenNatComment;
    }
    else
    if (TOKENIZEPYCOMMENTS && i>=0 && i<length(S) && S[i]=='#') {
      i0=i;
      i=lexerReadUntil(S,i+2,"\n",-1,False);
      BEG=i0,END=i+(i>=length(S)?0:1);
      NAT=TokenNatComment;
    }
    else
    if (TOKENIZENUMS && (S[i]=='+' || S[i]=='-' || charIsDigit10(S[i])) && strNumberLength(S,i)>0) {
      BEG=i,END=i+strNumberLength(S,i);
      NAT=TokenNatNum;
    }
    else {
      var j;
      j=lexerRead(S,i,charnat(S[i]),charIs(S[i],CharNatAlf)?CharNatDigit:-1); // FIXME: add floating point constants
      BEG=i,END=j;
    //out("<"+S[i]+"|"+display(asc(S[i]))+">"),cr();
      NAT=charnatToToknat(charnat(S[i]));
    }
    if (BEG==-1) error("lexerNext");
    RG.MIN=BEG;
    RG.MAX=END;
  }
  else {
    RG.MIN=RG.MAX=length(S);
  }
  RG.NAT=NAT;
  RG.LI=LI;
  RG.COL=COL;
  errlicolSet(LI,COL);
  S=rangeValue(RG);
  if (RG.NAT==TokenNatIdf || RG.NAT==TokenNatOpn) {
    function findop(I) {
      var N=length(S),TOK=S;
      if (isUndefined(TOKOPS_0[S[I]])) N=0;
      while (N>0) {
        TOK=substring(S,I,N);
        if (TOKOPS[TOK]!=Undefined) break;
        N--;
      }
      return N;
    }
    var N=findop(0);
    if (N>0 && N!=length(S)/*FIXME: !=length(S) should not be necessary ; find why it's there*/) RG.MAX=RG.MIN+N;
    else
    if (N==0) {
      for (var I=1;I<length(S);I++) {
        N=findop(I);
        if (N>0) { RG.MAX=RG.MIN+I;break; }
      }
    }
  }
  return NAT;
}
origin.lexerStart=function (TEXT) {
//out("lexerStart "+licol(TEXT).FNAME),cr();
  errlicolSet(1,1,licol(TEXT).FNAME);
  var RG=range(TEXT,0,0,1,1);
  lexerNext(RG);
  return RG;
}
origin.lexerEOF=function (RG) {
  return rangeEOF(RG);
}
origin.tokenize=function (SRC,KEEP) {
  var RES=[],
      RG=lexerStart(SRC);
  var keep0=function () {
              return RG.NAT!=TokenNatSpc && RG.NAT!=TokenNatComment;
            },
      keep=function () { return True; };
  if (KEEP=="nl") keep=function (VAL) {
                         return keep0() || RG.NAT==TokenNatSpc && contains(VAL,"\n")
                       };
             else if (!KEEP) keep=keep0;
  while (!lexerEOF(RG)) {
    var VAL=rangeValue(RG);
    if (keep(VAL)) {
      if (KEEP=="nl" && RG.NAT==TokenNatSpc && contains(VAL,"\n")) VAL="\n";
      RES.push(licolSet(VAL,RG.LI,RG.COL));
    }
    lexerNext(RG);
  }
  errlicolSet(-1,-1,Nil);
  return RES;
}

// Parser
origin.tokenizeSetFlags=function (COMMENTS,PYCOMMENTS,QUOTESINSTRING,NUMS) {
  TOKENIZEQUOTES=True,TOKENIZEDQUOTESINSTRING=False;
  if (isDefined(QUOTESINSTRING)) TOKENIZEDQUOTESINSTRING=isTrue(QUOTESINSTRING);
  TOKENIZECOMMENTS=True,TOKENIZEPYCOMMENTS=False;
  if (isDefined(COMMENTS)) TOKENIZECOMMENTS=isTrue(COMMENTS);
  if (isDefined(PYCOMMENTS)) TOKENIZEPYCOMMENTS=isTrue(PYCOMMENTS);
  TOKENIZENUMS=True;
  if (isDefined(NUMS)) TOKENIZENUMS=isTrue(NUMS);
}
var PRIOR,POSTFIX,MULTI;
origin.tokenizeStart=function (TOKSPEC,COMMENTS,PYCOMMENTS,QUOTESINSTRING,NUMS) {
  TOKOPS={},TOKOPS_0={};
  PRIOR={},POSTFIX={},MULTI={};
  var T=splitTrim(TOKSPEC," "),
      P=-1;
  for (var I in T) {
    if (T[I]==";;") P--;
    else {
      var OP=T[I],POST=False;
    //for (var I=0;I<length(OP);I++) if (!charIsOmg(OP[I])) error("tokenizeStart"); // Or either, force OP's chars to become Omg ?
      if (OP[length(OP)-1]=="_") POST=True,OP=substring(OP,0,length(OP)-1);
      var OP0=OP;
      if (OP[0]=="_") OP=substring(OP,1,length(OP));
      TOKOPS[OP]=1;
      PRIOR[OP0]=P;
      POSTFIX[OP0]=POST;
    }
  }
  for (var O in TOKOPS) TOKOPS_0[O[0]]=1;
  tokenizeSetFlags(COMMENTS,PYCOMMENTS,QUOTESINSTRING,NUMS);
}
