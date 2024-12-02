/*
 * xmlparse.js
 *
 * Copyright (C) Henri Lesourd 2021.
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

str.setMethod("fromHtml",function () { // TODO: detecter automatiquement les balises non fermees, et les convertir en SELFCLOSE (il y a aussi le cas des SELFCLOSE qui contiennent ce qui les suit, comme le <li> ou le <td> du HTML, mais le cas par defaut quand la balise n'est pas fermee, c'est plutot <img>) ; comme ca on n'a pas besoin de lire les includes de templates pour savoir les types exacts ; mais en sens inverse, c'est moins precis.
  if (!isString(this)) error("obj.fromHtml");
  function tokstart() {
    charsInit();
    charnatSet("#",CharNatAlf);
    charnatSet("+",CharNatAlf);
    charnatSet("-",CharNatAlf);
    charnatSet(".",CharNatAlf);
    tokenizeStart("< / > = & ; { }");
    charnatSet("'",CharNatAlf);
  }
  function parseTag(RES,A,I) {
    if (A[I]!="<") error("fromHtml.parseTag(1)");
    var TAG=A[I+1].valueOf();
    if (TAG=="!") {
      var TAG2=A[I+2];
      if (length(TAG2)>=2 && startsWith(TAG2,0,"--")) {
        I+=2;
        while (I+1<length(A) && !(endsWith(A[I],"--") && A[I+1]==">")) I++;
        if (I+1>=length(A)) error("fromHtml.parseTag(<!...)(1)");
        return I+2;
      }
      else error("fromHtml.parseTag(<!...)(2)");
    }
    if (A[I+1]=="/") return I;
    RES.push(TAG);
    I+=2;
    if (TAG=="function") RES0=RES,RES=[];
    function rmvp(S) {
      if (length(S)>0 && S[0]=="$") S=substring(S,1,length(S));
      return S;
    }
    var FIRST=1,HASFNAME=0;
    while (A[I]!=">" && !(A[I]=="/" && A[I+1]==">")) {      
      if (A[I+1]=="=") {
        RES.push(rmvp(A[I]));
        if (!strIsAlpha(A[I]) && A[I]!=sId) error("fromHtml.parseTag(3)=>"+A[I]);
        RES.push("=");
        RES.push(rmvp(A[I+2]));
        I+=2;
      }
      else {
        if (FIRST && A[I][0]!="$") HASFNAME=1;
        RES.push(rmvp(A[I]));
      }
      FIRST=0;
      I++;
      if (I>=length(A)) error("fromHtml.parseTag(4)");
    }
    if (TAG=="function") {
      if (HASFNAME) RES0.push(RES.shift());
      RES0.push(RES),RES=RES0;
    }
    return I;
  }
  function transc(C) {
    if (C[0]=="u" || C[0]=="U") return "\\"+C;
    if (C=="nbsp") return "\\u00A0";
    return "&"+C+";";
  }
  function parse(RES,A,I) {
    if (A[I]!="<") error("fromHtml.parse(1)");
    while (length(RES)==0 && I<length(A)) {
      I=parseTag(RES,A,I);
      if (A[I+1]=="/") return I;
    }
    var NAME=RES[0].valueOf();
    if (isType(NAME)) NAME=NAME.name();
    if (A[I]!="/" && !isHtmlSelfClosingTag(NAME)) {
      I+=1;
      while (!(A[I]=="<" && A[I+1]=="/")) {
        var O=[];
        if (A[I]=="&") {
          if (A[I+2]!=";") error("fromHtml.parse(2)::"+A[I+1]+"||"+A[I+2]+"_");
          O=transc(A[I+1]),I+=3;
        }
        else
        if (A[I]!="<") {
          var VAL=A[I];
          if (VAL[0]=="$") VAL=substring(VAL,1,length(VAL));
          else
          if (VAL!="=" && VAL!="...") VAL='\"'+VAL+'\"';
          O=VAL;
          I++;
        }
        else
        if (A[I+1]==">") O="<>",I+=2;
                    else I=parse(O,A,I);
        if (length(O)>0) RES.push(O);
        if (I>=length(A)) error("fromHtml.parse(3)");
      }
      if (A[I+2]!=NAME || A[I+3]!=">") errlicolSet2(A[I+2]),X1=NAME,X2=A,X3=I,error("Missing </"+NAME+"> tag");
      I+=3;
    }
    if (A[I]=="/") I++;
    if (A[I]==">") I++;
    return I;
  }
  tokstart();
  var RES=[],A=tokenize(this);
//console.log("====>",A.map((S)=>S.toString()));
  errlicolSet(-1,-1,licol(this).FNAME);
  parse(RES,A,0);
  return RES;
});
