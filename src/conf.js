/*
 * conf.js
 *
 * Copyright (C) Henri Lesourd 2019.
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

// Ini files
origin.iniLoad=function (FNAME,MULTI) { // TODO: use this in the code
  function rmc(L) {
    var L2=[];
    for (var S of L) {
      if (S[0]=="#") break;
      L2.push(S);
    }
    return L2;
  }
  if (!fileExists(FNAME)) error("loadIni");
  if (isUndefined(MULTI)) MULTI=[];
  var RES={};
  var L=splitTrim(fileRead(FNAME),"\n"),SECTION="",CUROBJ="";
  for (var S of L) {
    if (S[0]=="[") {
      SECTION=lcase(trim(trim(S,"[]"))),CUROBJ="";
      if (!RES[SECTION]) RES[SECTION]={};
    }
    else
    if (S!="" && S[0]!="#") {
      if (contains(S,"=")) {
        var L=rmc(splitTrim(S,"="));
        CUROBJ=L[0];
        L.shift();
        S=unsplit(L," ");
      }
      if (S!="") {
        if (!RES[SECTION]) RES[SECTION]={};
        if (!RES[SECTION][CUROBJ]) RES[SECTION][CUROBJ]=[];
        S=rmc(splitTrim(S," "));
        for (S2 of S) RES[SECTION][CUROBJ].push(S2);
      }
    }
  }
  for (var S in RES) for (var O in RES[S]) if (contains(MULTI,O)) {
    if (endsWith(O,"*")) error("iniLoad: multi column "+O+" should not end with '*'"); 
    if (RES[S][O+"*"]) error("iniLoad."+S+": duplicate identifier "+O);
    RES[S][O+"*"]=RES[S][O];
    delete RES[S][O];
  }
  for (var S in RES) for (var O in RES[S]) {
    if (!endsWith(O,"*")) {
      if (RES[S][O+"*"]) error("iniLoad."+S+": duplicate identifier "+O);
      RES[S][O]=unsplit(RES[S][O]," ");
      if (strIsNum(RES[S][O])) RES[S][O]=Number(RES[S][O]);
    }
  }
  for (var S in RES) for (var O in RES[S]) {
    if (endsWith(O,"*")) {
      var L=RES[S][O];
      delete RES[S][O];
      RES[S][substring(O,0,length(O)-1)]=L;
    }
  }
  return RES;
};

// Conf
var _CONF;
origin.conf=function (CLI) {
  if (isUndefined(CLI)) return _CONF;
                   else return _CONF["[cli]"];
}
function confCompile(CONF) {
  if (!isObject(CONF)) return;
  for (var N in CONF) {
    if (N=="CONT") {
      if (!isArray(CONF[N])) CONF[N]=[CONF[N]];
      var CONT=CONF[N],I;
      for (I in CONT) {
        CONT[I]=splitTrim(CONT[I],";");
        if (length(CONT[I])>1) CONT[I][1]=splitTrim(CONT[I][1]," ");
                          else CONT[I][1]=[];
      }
    }
    if (N=="APP" && length(CONF[N])>0) {
      CONF[N]=splitTrim(CONF[N][0]," ");
      if (CONF[N][0]=="") CONF[N]=[];
    }
  }
}
function confExec(CONF) {
  if (!isObject(CONF)) return;
  for (var N in CONF) {
    if (N=="DEFAULT_LANG") mlstr.setDefault(CONF[N]);
    if (N=="LANG") mlstr.setLang(CONF[N]);
  }
}

// Init
origin.confInit=function (PROJ,EXEC) {
  _CONF={ "[cli]":{}, "CONT":[], "APP":[] };
  if (SERVER) {
    if (EXEC) _CONF.CWD=processCwd();
    _CONF.PROJ=isString(PROJ)?PROJ:filePath(fnameNormalize(process.argv[1]));
    if (fileName0(_CONF.PROJ)=="bin") _CONF.PROJ=filePath(_CONF.PROJ); // FIXME: removing "bin" should be done outside
    _CONF.LIB=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/lib")) _CONF.LIB=_CONF.PROJ+"/lib";
    _CONF.SRC=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/src")) _CONF.SRC=_CONF.PROJ+"/src";
    _CONF.DATA=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/data")) _CONF.DATA=_CONF.PROJ+"/data";
    _CONF.BIN=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/bin")) _CONF.BIN=_CONF.PROJ+"/bin";
    _CONF.BUILD=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/build")) _CONF.BUILD=_CONF.PROJ+"/build";
    _CONF.CONF=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/conf")) _CONF.CONF=_CONF.PROJ+"/conf";
    _CONF.DOC=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/doc")) _CONF.DOC=_CONF.PROJ+"/doc";
    _CONF.WEB=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/web")) _CONF.WEB=_CONF.PROJ+"/web";
    if (fileExists(_CONF.CONF+"/BOOT.ini")) {
      var L=splitTrim(fileRead(_CONF.CONF+"/BOOT.ini"),"\n"),L2=[],L3=[],SECTION="srv";
      for (var S of L) {
        S=trim(S);
        if (S[0]=="[") SECTION=lcase(trim(replaceAll(S," ",""),"[]"));
        else
        if (S!="" && S[0]!="#") {
          if (contains(SECTION,"srv")) L2.push(S);
          if (contains(SECTION,"cli")) L3.push(S);
        }
      }
      function rd(O,L) {
        for (var S of L) {
          var A=splitTrim(S,"=");
          if (length(A)!=2) error("confInit(1)");
          for (var S2 of ["CWD","PROG","PROJ","SRC","DATA","BIN","BUILD","LIB","CONF","DOC","WEB"]) {
            if (A[0]==S2) error("confInit::predef-->",S);
          }
          if (strIsNum(A[1])) A[1]=eval(A[1]); // FIXME: improve this, and have a way to have constructors for num, str, etc., that create unboxed values
          if (isUndefined(O[A[0]])) O[A[0]]=A[1];
          else {
            if (!isArray(O[A[0]])) O[A[0]]=[O[A[0]]];
            O[A[0]].push(A[1]);
          }
        }
      }
      rd(_CONF,L2);
      rd(_CONF["[cli]"],L3);
    //out(pretty(_CONF)),cr();
    }
  }
  confCompile(_CONF);
  confCompile(_CONF["[cli]"]);
  if (EXEC) confExec(_CONF);
}
function confFetch(PROG) {
  var _CONF0=_CONF;
  confInit(PROG)
  var RES=_CONF;
  _CONF=_CONF0;
  return RES;
}

// Init
confInit(Nil,True);
