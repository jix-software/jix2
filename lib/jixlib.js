

var SERVER=(typeof window)=="undefined",
    origin;
if (SERVER) origin=global;
       else origin=window;
origin.origin=origin;
origin.declare=function (O) {   Object.assign(origin,O);
}

origin.Nil=null;
origin.Undefined=undefined;
origin.BoxedNil=Symbol("nil"); origin.BoxedUndefined=Symbol("undefined");
origin._=Undefined;

origin.True=true;
origin.False=false;

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
origin.isFalse=function (O) { return isNil(O) || O===False || O===0 || O=="0"; }
origin.isSymbol=function (O) { return isa0(O,Symbol); }
origin.isBoolean=function (O) { return isa0(O,Boolean); }
origin.isNumber=function (O) { return isa0(O,Number); }
origin.isString=function (O) { return isa0(O,String); }
origin.isNumStr=function (O) { return isNumber(O) || strIsNum(O); }
origin.isDate=function (O) { return isa0(O,Date); }
origin.isAtom=function (O) { return isNil(O)                                  || isSymbol(O) || isBoolean(O)
                                 || isNumber(O) || isString(O) || isDate(O); }
origin.isRootAtom=function (O) { return typeOf(O).root()==typeOf(O) && isAtom(O); }
origin.isArray=function (O) { return isa0(O,Array); }
origin.isFunction=function (O) { return isa0(O,Function); } 
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
origin.strIsAlpha=function (S) {   return strIs(S,CharNatAlf);
}
origin.strIsOmg=function (S) {
  return strIs(S,CharNatOmg);
}
origin.strIsNum=function (S) {   if (!isString(S) || length(S)==0) return False;
  for (var I=0;I<length(S);I++) if (!charIsDigit10(S[I])) return False;
  return True;
}
origin.strIsBlank=function (S) {
  return strIs(S,CharNatBlank);
}

origin.charsInit=function (ALLALF) {
  var i;
  for (i=0;i<256;i++) CharNat[i]=CharNatNone;
  for (i=0;i<10;i++) CharNat[i]=CharNatAlf;   for (i=32;i<=126;i++) CharNat[i]=ALLALF?CharNatAlf:CharNatOmg;
  for (i=asc('A');i<=asc('Z');i++) CharNat[i]=CharNatAlf;
  for (i=asc('a');i<=asc('z');i++) CharNat[i]=CharNatAlf;
  for (i=192;i<=255;i++) CharNat[i]=CharNatAlf;
  CharNat[asc('"')]=CharNatDQuote;
  CharNat[asc('\'')]=CharNatQuote;   CharNat[asc('_')]=CharNatAlf;
  CharNat[asc('$')]=CharNatAlf;
  for (i=asc('0');i<=asc('9');i++) CharNat[i]=ALLALF?CharNatAlf:CharNatDigit;
  CharNat[asc("\t")]=CharNatBlank;
  CharNat[asc(" ")]=CharNatBlank;
  CharNat[asc("\n")]=CharNatBlank;
  CharNat[asc("\r")]=CharNatBlank;
}

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
  for (i=0;i<a.length;i++) if (a[i]!=null) res+=a[i];   return res;
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
  var a=s==""?[]:s.split(chars);   for (var i=0;i<a.length;i++) a[i]=trim(a[i]," \r\n",true,true);
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
origin.replaceAll=function (s,s1,s2) {   var s0;
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
origin.implode=function (A) {   if (isString(A)) return A;
  if (!isArray(A)) error("implode");
  return A.join("");
}

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
origin.last=function (st) {   if (empty(st)) return null;
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
  if (!isString(SLOTS)) error("sort");   var SIGN=+1;
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

origin.ocopy=function (O) {
  if (!isAtom(O) && !isFunction(O)) {
    var O2={};
    if (isArray(O)) O2=[];
    Object.assign(O2,O);
    O=O2;
  }
  return O;
}

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
origin.display=function (o) {   var res=null;
  if (isUndefined(o)) res="Undefined";
  else
  if (isNil(o)) res="Nil";
  else
  if (isBoolean(o)) res=o.toString();
  else
  if (isNumber(o)) res=o.toString();
  else
  if (isString(o)) {
   res=o;
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

origin.garbage=function () {
  if (origin.gc) {
      origin.gc();
  }
}
origin.whenIdle=Undefined;
if (SERVER) {
  origin.whenIdle=setImmediate;
}
else {
  origin.whenIdle=queueMicrotask;
}

charsInit();


var SymbolLicol=Symbol("licol");
function licolSet(S,LI,COL,FNAME) {
  if (isUnboxed(S)) S=new String(S);
  S[SymbolLicol]={ LI:LI, COL:COL, FNAME:FNAME }; 
  return S;
}
function licol(S) {
  var LICOL;
  if (isBoxed(S)) LICOL=S[SymbolLicol];
  if (isUndefined(LICOL)) LICOL={ LI:-1, COL:-1, FNAME:Undefined }; 
  return LICOL;
}
function errlicolSet2(LICOL) {   if (isString(LICOL)) LICOL=licol(LICOL);
  errlicolSet(LICOL.LI,LICOL.COL,LICOL.FNAME);
}

origin.fileExists=function (fname) {
  if (SERVER) return fs.existsSync(fname);
         else return httpSend("GET","http://localhost:8080/fileExists?"+fname); }
origin.fileIsDir=function (fname) {
  var fd=fs.openSync(fname,"r");
  var stats=fs.fstatSync(fd);
  return stats.isDirectory();
}
origin.fileStats=function (fname) {
  if (!fileExists(fname)) return { mtime:new Date("1/1/80") };
  var fd=fs.openSync(fname,"r");
  return fs.fstatSync(fd);
}
origin.fileRead=function (fname,encoding) {   if (SERVER) {
    if (!fileExists(fname)) error("File not found: "+fname+" in "+processCwd());
    if (isUndefined(encoding)) encoding="utf8";
    var RES=fs.readFileSync(fname,"latin1");
    if (encoding=="utf8") RES=Buffer.from(RES,"latin1").toString("utf8");
    if (encoding=="binary") return RES;
    return licolSet(RES,1,1,fname);
  }
  else return httpSend("GET","http://localhost:8080/"+fname); }
origin.filePath=function (fname) {
  var a=fnameNormalize(fname).split("/"),s="";
  for (var i=0;i<length(a)-1;i++) {
    s+=a[i];
    if (i+2<length(a)) s+="/";
  }
  return s;
}
origin.fileName0=function (fname) {
  var a=fname.split("/");
  return a[length(a)-1];
}
origin.fileName=function (fname) {
  var a=fname.split(".");   return fileName0(a[0]); }
origin.fileExt=function (fname) {
  var a=fname.split(".");
  return length(a)>1?a[length(a)-1]:Undefined;
}
origin.fileWrite=function (fname,str,encoding) {   try {
    if (isUndefined(encoding)) encoding="utf8";
    if (isa0(str,Buffer)) encoding=Undefined;
    fs.writeFileSync(fname,str,encoding);   }
  catch (err) {
    error("Can't write file: "+fname);
  }
}
origin.fileAppend=function (fname,str,encoding) {   try {
    if (isUndefined(encoding)) encoding="utf8";
    if (isa0(str,Buffer)) encoding=Undefined;
    fs.appendFileSync(fname,str,encoding);   }
  catch (err) {
    error("Can't write file: "+fname);
  }
}
origin.fileCopy=function (SRC,DEST,ENC) {
  if (SRC==DEST) return;
  var S=fileRead(SRC,ENC);
  fileWrite(DEST,S,ENC);
}
origin.fileMove=function (SRC,DEST) {
  fs.renameSync(SRC,DEST);
}
origin.fileDelete=function (fname) {
  fs.unlinkSync(fname);
}

origin.dirCreate=function (fname) {
  try {
    fs.mkdirSync(fname);
  }
  catch (err) {
    error("Can't create directory: "+fname);
  }
}
origin.vfileCreate=function (dir,fname,isDir,parent,val) {
  var D=fileStats(dir+"/"+fname).mtime;
  return {"dir":trim(replaceAll(dir,"//","/"),"/",false,true),"fname":fname,
          "isDir":isDir,
          "date":D,
          "isModified":false,"val":val,
          "parent":parent};
}
var _READ={};
origin.fileReadSet=function (ext,readFunc) {
  _READ[ext]=readFunc;
}
origin.dirRead=function (fname,mask,rec,ldf) {
  function fileRead(fname) {
    var dir=path.dirname(fname)+"/";
    fname=path.basename(fname);
    var val="";
    var readFunc=_READ[fileExt(fname)];
    if (readFunc!=undefined) {
      val=readFunc(dir+fname);
      val=replaceAll(val,"\r\n","\n");
    }
    return val;
  }
  var predir=path.dirname(fname)+"/";
  fname=path.basename(fname);
  if (isUndefined(mask)) mask="*";
  var d=vfileCreate(predir,fname,true,null,{});
  var dir=fname;
  if (predir!="") dir=predir+"/"+fname;
  var a=fs.readdirSync(dir);
  for (var i=0;i<a.length;i++) {
    var b=fileIsDir(dir+"/"+a[i]);
    if (b) {
      if (rec) {
        d.val[a[i]]=dirRead(dir+"/"+a[i],mask,rec,ldf);
        d.val[a[i]].parent=d;
      }
      else
      if (strMatch(a[i],mask)) {
        d.val[a[i]]=vfileCreate(dir,a[i],b,d,{});
      }
    }
    else {
      var matches=strMatch(a[i],mask);
      if (matches) {
        d.val[a[i]]=vfileCreate(dir,a[i],b,d,null);
        if (ldf) d.val[a[i]].val=fileRead(dir+"/"+a[i]);
      }
    }
  }
  return d;
}
origin.foreach_vfile=function (d,func) {
  for (var fname in d.val) {
    var f=d.val[fname];
    if (f.isDir) foreach_vfile(f,func);
            else func(f);
  }
  func(d);
}
origin.fnameNormalize=function (fname) {
  return replaceAll(path.resolve(path.normalize(fname)),"\\","/");
}
origin.fnameIsAbsPath=function (fname) {
  return isString(fname) && (fname[0]=="/" || fname[1]==":");
}
origin.vfilePathname=function (vf) {
  var a=[];
  do {
    a.push(vf.fname);
    vf=vf.parent;
  }
  while (vf!=null);
  return fnameNormalize(a.reverse().join("/"));
}
origin.isChildPath=function (p,parent) {
  p=path.normalize(p);
  parent=path.normalize(parent);
  if (parent[0]=="." && p[0]!='/') p="./"+p;   return startsWith(p,parent);
}

origin.urlParse=function (U) {
  var RES;
  if (SERVER) RES=url.parse(U);
         else RES=document.createElement('a'),RES.href=U;   return RES;
}
origin.urlNormalize=function (U,BASE) {
  U=trim(U);
  if (isUndefined(BASE)) BASE="";
  var I=strFind(U,"://")
  if (I!=-1) {
    var P=substring(U,0,I+3),U=substring(U,I+3,length(U));
    return P+U;   }
  else {
    if (BASE!="" && BASE[length(BASE)-1]!="/" && U!="" && U[0]!="/") BASE+="/";
    return BASE+U;
  }
}
origin.urlSelf=function () {
  if (SERVER) return Nil;
         else return urlParse(trim(document.location.href,"/",false,true));
}

var ColorNone           ="0",
    ColorBright         ="1",
    ColorNoBright       ="22",
    ColorUnderscore     ="4",
    ColorNoUnderscore   ="24",
    ColorBlink          ="5",
    ColorNoBlink        ="25",
    ColorReverse        ="7",
    ColorNoReverse      ="27";

var ColorBlack          ="30",
    ColorRed            ="31",
    ColorGreen          ="32",
    ColorBrown          ="33",
    ColorBlue           ="34",
    ColorMagenta        ="35",
    ColorCyan           ="36",
    ColorWhite          ="37",
    ColorGrey           ="b30",
    ColorBrightRed      ="b31",
    ColorBrightGreen    ="b32",
    ColorYellow         ="b33",
    ColorBrightBlue     ="b34",
    ColorBrightMagenta  ="b35",
    ColorBrightCyan     ="b36",
    ColorBrightWhite    ="b37",
    ColorBgBlack        ="40",
    ColorBgRed          ="41",
    ColorBgGreen        ="42",
    ColorBgBrown        ="43",
    ColorBgBlue         ="44",
    ColorBgMagenta      ="45",
    ColorBgCyan         ="46",
    ColorBgWhite        ="47";

var
   HTMLColor={};    HTMLColor[ColorBlack]="#000000",HTMLColor[ColorRed]="#FF0000";
   HTMLColor[ColorGreen]="#00FF00",HTMLColor[ColorBrown]="#800080";
   HTMLColor[ColorBlue]="#000080",HTMLColor[ColorMagenta]="#008080";
   HTMLColor[ColorCyan]="#0000FF",HTMLColor[ColorWhite]="#808080";

function htmlEscapeChars(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='<') c="&lt;";
    if (c=='>') c="&gt;";
    if (c=='&') c="&amp;";
    res+=c;
  }
  return res;
}
function htmlEscapeBlanks(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='\n') c="<br>";
    if (c==' ') c="<span style=\"white-space:pre-wrap;\"> </span>";     res+=c;
  }
  return res;
}

var OUTS=Nil,OUTSMODE=Nil,NOUTS=0,FOUTS,OUTSB;
if (SERVER) OUTSB=Buffer.alloc(100000);
origin.startOutS=function (MODE,FNAME) {
  if (MODE==2 && isUndefined(FNAME)) error("startOutS");
  if (MODE) OUTS=[],OUTSMODE=MODE,NOUTS=0,FOUTS=FNAME;
       else OUTS="",OUTSMODE=0;
}
function flushOutS() {
  if (OUTSMODE==2 && NOUTS>0) {
    fileAppend(FOUTS,OUTSB.subarray(0,NOUTS));
    OUTS=[];
  }
  NOUTS=0;
}
origin.stopOutS=function () {
  flushOutS();
  OUTS=OUTSMODE=Nil;
}
origin.getOutS=function () {
  flushOutS();
  return OUTS;
}
function _out01(S) {
  if (OUTSMODE) {
    if (OUTSMODE==1) OUTS.push(S),NOUTS++;
                else NOUTS+=OUTSB.write(S,NOUTS,"utf-8");
    if (NOUTS>=90000) flushOutS();
  }
  else OUTS+=S;
}
function _out0(S) {
  if (!isString(S)) { console.log("<"+display(S)+">");error("out0"); }
  S=S.toString();
  if (OUTS==Nil) if (SERVER) process.stdout.write(S); else document.write(S);
            else _out01(S); }
function out0(S) {
  return _out0(S);
}
function _out(S) {
  if (SERVER || OUTS!=Nil) out0(S); else out0(htmlEscapeBlanks(htmlEscapeChars(S)));
}
origin.out=function (O) {
  return _out(O);
}
origin.outd=function (O) {
  out(display(O));
}
origin.br=function () {
  out0("<br>");
}
origin.hr=function () {
  out0("<hr>");
}

function esc(C) {
  if (SERVER) return "\x1b["+C+"m";
  else {
    C=HTMLColor[C];
    return C==undefined?"":"</font><font color=\""+C+"\">";   }
}
origin.color=function (C) {
  if (C[0]=="b") out0(esc(ColorBright)),C=substring(C,1,length(C));
            else out0(esc(ColorNoBright));
  out0(esc(C));
}
origin.cr=function () {
  out("\n");
}
origin.spc=function (N,C) {
  var RES="";
  if (isUndefined(C)) C=" ";
  while (N--) RES+=C;
  return RES;
}
origin.indent=function (N) {
  while (N--) out(" ");
}
var OUTINDENT=0;
origin.outIndent=function () {
  indent(OUTINDENT);
}
origin.outIndentInc=function (N) {
  OUTINDENT+=N;
}
origin.crIndent=function () {
  cr();
  outIndent();
}

origin.consoleInputMode=function (RAW) {
  if (isUndefined(RAW)) RAW=False;
  process.stdin.setRawMode(RAW);
}

origin.consoleMain=function (FUNC) {   process.stdin.on('data',FUNC);
}
origin.consoleRepeat=async function (FUNC,REPEAT) {
  if (isUndefined(REPEAT)) REPEAT=2;
  await FUNC();
  if (REPEAT==0) process.exit(0);
  consoleMain(async function (KEY) {
    if (REPEAT<=1) process.exit(0);
    await FUNC();
  });
}

function consoleInit() {
  ColorBlue=env("TERM")=="cygwin"?"37":"34";   ColorWhite=env("TERM")=="cygwin"?"34":"37";
}

origin.env=function (VAR) {
  if (SERVER) return process.env[VAR]; else return "";
}

function argvRemove(argv,j) {
  splice(argv,j,1,[]);
}
origin.processCwd=function () {
  return fnameNormalize(process.cwd());
}
origin.chdir=function (PATH) {
  return process.chdir(PATH);
}
origin.spawn=function (EXE,PARM,ASYNC) {
  function from(S,KEEP) {
    if (S==Nil) return "";
    return Buffer.from(S).toString();
  }
  if (ASYNC) return child_process.spawn(EXE,PARM);
  else {
    var RES=child_process.spawnSync(EXE,PARM);
    if (RES.stderr==Nil || from(RES.stderr).length>0) {
      throw new Error(from(RES.stderr));
    }
    return from(RES.stdout);
  }
}

origin.scriptFind=function (CMD) {
  if (!fnameIsAbsPath(CMD)) {
    var PATH;
    if (isDefined(project.cwp())) PATH=project.cwp().CONF.BIN;
    if (isDefined(project.JIXPROJ)
     && (isUndefined(PATH) || !fileExists(PATH+"/"+CMD))) PATH=project.JIXPROJ.CONF.BIN;
    if (isDefined(PATH) && fileExists(PATH+"/"+CMD)) CMD=PATH+"/"+CMD;
  }
  if (!fnameIsAbsPath(CMD)) CMD=Nil;
  return CMD;
}
origin.pythonExe=function () {
  var PYTHON=env("PYTHON_HOME");
  function ex(FP) {
    return fileExists(FP+"/python") || fileExists(FP+"/python.exe");
  }
  if (!(isDefined(PYTHON) && ex(PYTHON))) {
    PYTHON=env("PYTHON_PATH");
    if (isDefined(PYTHON)) {
      var L=splitTrim(PYTHON,";").map(fnameNormalize);       PYTHON=Undefined;
      for (var DIR of L) if (ex(DIR)) { PYTHON=DIR;break; }
    }
  }
  if (isDefined(PYTHON) && ex(PYTHON)) PYTHON+="/python";
                                  else PYTHON=Undefined;
  return PYTHON;
}
origin.python=function (CMD,PARMS) {
  CMD=scriptFind(CMD);
  if (!fnameIsAbsPath(CMD)) error("python::script "+CMD+" not found");
  var PYTHON=pythonExe();
  if (isUndefined(PYTHON)) error("python not found");
  return spawn(PYTHON,[CMD].concat(PARMS));
}

var fs,path,url,child_process;
if (SERVER) {
  fs=require('fs');
  path=require('path');
  url=require('url');
  child_process=require('child_process');
}
consoleInit();


origin.setprop=function (O,NAME,VAL,E,W,C) {
  if (!isString(NAME)) error("setprop");
  if (isUndefined(E)) E=False;
  if (isUndefined(W)) W=False;
  if (isUndefined(C)) C=False;
  Object.defineProperty(O,NAME,{
    "value": VAL,
    "enumerable": E,
    "writable": W,
    "configurable": C
  });
}
origin.setpropgs=function (O,NAME,GET,SET,E,C) {
  if (!isString(NAME)) error("setpropgs");
  if (isUndefined(E)) E=False;
  if (isUndefined(C)) C=False;
  Object.defineProperty(O,NAME,{
    "get": GET,
    "set": SET,
    "enumerable": E,
    "configurable": C
  });
}

origin.getPrototypeOf=Object.getPrototypeOf || function (O) {   return O.__proto__; }
origin.setPrototypeOf=Object.setPrototypeOf || function (O,PROTO) {   O.__proto__=PROTO;
  return O;
}
origin.hasPrototype=function (O,P) {
  O=getPrototypeOf(O);
  while (O!=Nil) {
    if (O==P) return True;
    O=getPrototypeOf(O);
  }
  return False;
}

var SymbolType=Symbol("type");
function _mtypeOf() {
  var OBJ=this;
  if (!isNil(this.typeOf)) OBJ=prototype(this);  return OBJ[SymbolType];
}
function jsprotoCreate(JSPROTO,TYPE,JSPARENT) {
  var CLASS=Object;
  if (!isNil(JSPARENT)) CLASS=JSPARENT.constructor;
  var RES=JSPROTO;
  if (JSPROTO==Nil) RES=(class extends CLASS {}).prototype;
  RES[SymbolType]=TYPE;
  setprop(RES,"typeOf",_mtypeOf);
  return RES;
}
function jsprotoIsAtom(PROTO) {
  return PROTO==Symbol.prototype
      || PROTO==Boolean.prototype
      || PROTO==Number.prototype
      || PROTO==String.prototype;
}
function jsprotoInheritsAtom(PROTO) {
  if (PROTO==Nil) return False;
  if (jsprotoIsAtom(PROTO)) return True;
  return jsprotoInheritsAtom(Object.getPrototypeOf(PROTO));
}

var TYPEPROTO=jsprotoCreate(Nil,Nil);
if (typeof jix=="undefined") {
  if (isDefined(origin["type"])) error("objects(0)");
  origin.jix=jix={};
}
var type=function (CONS,O) {
  var PARENT=Nil;
  if (!isNil(O)) PARENT=O.PARENT;
  if (isString(PARENT)) {
    PARENT=type.getByName(P0=PARENT);
    if (isUndefined(PARENT)) error("type::PARENT");
  }
  if (isUndefined(PARENT)) PARENT=obj;   var JSPARENT=Nil;
  if (!isNil(PARENT)) JSPARENT=PARENT.JSPROTO;
  var JSPROTO=Nil;
  if (CONS==type) JSPROTO=TYPEPROTO;
  else
  if (!isNil(O) && !isNil(O.JSPROTO)) JSPROTO=O.JSPROTO;
  if (isNil(CONS) || CONS!=type) JSPROTO=jsprotoCreate(JSPROTO,CONS,JSPARENT);
  var CREATE=(function (VAL,CONT) {
                return _create.apply(JSPROTO[SymbolType],[VAL,CONT]);
              });
  if (isNil(CONS)) CONS=CREATE;
  JSPROTO[SymbolType]=CONS;
  Object.setPrototypeOf(CONS,TYPEPROTO);
  CONS.NAME=Nil;
  CONS.PARENT=PARENT;
  CONS.JSPROTO=JSPROTO;
  CONS.ATTRS=[];
  CONS.NOEVAL={};
  if (!isNil(O)) {
    if (!isNil(O.NAME)) {
      CONS.NAME=O.NAME;
      if (isDefined(jix["type"])) {
        jix.type.$[O.NAME]=CONS;
        origin[O.NAME]=CONS;
      }
    }
    if (!isArray(O.ATTRS)) { if (!isNil(O.ATTRS)) error("type::ATTRS"); }
                      else if (!empty(O.ATTRS)) CONS.setAttrs(O.ATTRS);
    for (var N in O) if (N!="NAME" && N!="PARENT" && N!="JSPROTO" && N!="ATTRS") CONS[N]=O[N];
  }
  delete CONS.name;   setprop(CONS,"create",CREATE,False,True);
  return CONS;
}
if (isUndefined(jix["type"])) {
  type.$={ "type":type };
  jix.type=type;
  origin.type=type;
  origin.typeOf=typeOf; }
type(function (VAL,CONT) {
       if (isUndefined(CONT) && isContainer(VAL)) CONT=VAL,VAL=Undefined;
       if (isContainer(VAL)) error("obj.cons");
       if (isDefined(VAL) && constructor(VAL)!=Object) {
         if (constructor(VAL)==Array && isDefined(tree)) return tree(VAL,CONT);
       }
       var RES=obj.create(CONT);
       if (isDefined(VAL)) Object.assign(RES,VAL);        return RES;
     },
     { "NAME":"obj", "PARENT":Nil, "JSPROTO":Object.prototype, "ATTRS":[] });

type(type,
     { "NAME":"type", "PARENT":obj, "ATTRS":[] });
setprop(type,"create",function () { error("type.create"); });

setprop(type,"getByName",function (NAME) {
  return type.$[NAME];
});

origin.isType=function (O) {
  return isa(O,type);
}
setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  setprop(this.JSPROTO,NAME,FUNC,False,True);
},
False,True);
setprop(TYPEPROTO,"setAccessor",function (NAME,GET,SET) {
  setpropgs(this.JSPROTO,NAME,GET,SET);
},
False,True);

obj.setMethod("init",function () {});

type.setMethod("name",function () {   return this.NAME;
});
type.setMethod("parent",function () {
  return this.PARENT;
});
type.setMethod("inherits",function (T) {
  var P=this.parent();
  if (!isType(T) || P==Nil) return False;
  if (P==T) return True;
       else return P.inherits(T);
});
type.setMethod("method",function (NAME) {
  var FUNC=this.JSPROTO[NAME];   return isFunction(FUNC)?FUNC:Undefined;
});
type.setMethod("super",function (NAME) {
  return this.parent().method(NAME);
});
obj.setMethod("super",function (NAME,...PARMS) {
  var M=typeOf(this).super(NAME);
  if (isNil(M)) error("super::method "+NAME+" doesn't exists in class "+typeOf(this).parent().name());
  return M.apply(this,PARMS);
});
obj.setMethod("call",function (METHOD,...PARMS) {
  return METHOD.apply(this,PARMS);
});

type(function (VAL) {
       var RES=boxit(VAL);
       if (!isNil(RES.valueOf())) error("nil");
       return RES;
     },
     { "NAME":"nil", "PARENT":obj, "ATTRS":[] });

origin.BoxedNil=nil.create();
origin.BoxedUndefined=nil.create();

nil.setMethod("valueOf",function () {
  if (this==BoxedUndefined) return Undefined;
  if (this==BoxedNil) return Nil;
  error("nil.valueOf");
});

function isUnboxed(O) {
  if (O==Nil) return True;
  return isAtom(O) && O.valueOf()===O;
}
function isBoxed(O) {   if (O==Nil) return False;
  return !isUnboxed(O);
}
origin.isBoxed=isBoxed;
origin.isUnboxed=isUnboxed;
origin.boxed=function (O) {
  if (O==Nil) return boxit(O);
  if (isUnboxed(O)) return Object(O);
  return O;
}

function boxit(O) {
  if (isUndefined(O)) return BoxedUndefined;
  if (eqNil(O)) return BoxedNil;
  return O;
}
origin.boxit=boxit;
function typeOf(O) {
  O=boxit(O);
  if (!isFunction(O.typeOf)) return obj;
  return O.typeOf();
}

type(function (S) {
       return Symbol(S);
     },
     { "NAME":"symb", "PARENT":obj, "JSPROTO":Symbol.prototype, "ATTRS":[] });
type(function (B,CONT) {
        return bool.create(B,CONT);
     },
     { "NAME":"bool", "PARENT":obj, "JSPROTO":Boolean.prototype, "ATTRS":[] });
type(function (N,CONT) {
       return num.create(N,CONT);
     },
     { "NAME":"num", "PARENT":obj, "JSPROTO":Number.prototype, "ATTRS":[] });
type(function (S,CONT) {
       return str.create(S,CONT);
     },
     { "NAME":"str", "PARENT":obj, "JSPROTO":String.prototype, "ATTRS":[] });
type(function (N,CONT) {
       return date.create(N,CONT);
     },
     { "NAME":"date", "PARENT":obj, "JSPROTO":Date.prototype, "ATTRS":[] });
type(function (VAL,CONT) {
       if (isString(VAL)) return explode(VAL);
       var RES=array.create(CONT);
       if (isDefined(VAL)) Object.assign(RES,VAL);        return RES;
     },
     { "NAME":"array", "PARENT":obj, "JSPROTO":Array.prototype, "ATTRS":[] });

type.setMethod("isAtom",function (STRICT) {
  if (STRICT) return this==nil || this==bool || this==num || this==date || this==symb || this==str;
         else return this.isAtom(True) || this.inherits(nil)
                                       || this.inherits(bool) || this.inherits(num) || this.inherits(date)
                                       || this.inherits(symb) || this.inherits(str);
});
type.setMethod("root",function () {
  if (this.isAtom(True) || this==array) return this;
                                   else if (this.parent()==Nil) return obj;
                                                           else return this.parent().root();
});

type(function (VAL) {
       if (isUndefined(VAL)) VAL=[];
       return set.create(implode(VAL));      },
     { "NAME":"set", "PARENT":str, "ATTRS":[], "ELEMS":Undefined });

origin.isSet=function (O) {
  return isa(O,set);
}
set.setMethod("contains",function (ELTS) {   if (!isString(ELTS)) error("set.contains");
  ;   for (var I=0;I<length(ELTS);I++) if (!contains(this,ELTS[I])) return False;
  return True;
});
set.setMethod("has",set.method("contains"));

set.setMethod("inter",function (S) {
  ;   var A=[];
  for (var I=0;I<length(this);I++) if (contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("union",function (S) {
  ;   var A=explode(S);
  for (var I=0;I<length(this);I++) if (!contains(A,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("minus",function (S) {
  ;   var A=[];
  for (var I=0;I<length(this);I++) if (!contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});

setprop(set,"parse",function (S) {   error("set.parse");
});
set.setMethod("serialize",function (VAL) {   error("set.serialize");
});

origin.tset=function (NAME,ELEMS) {   if (!isArray(ELEMS)) error("tset");
  return type(function (VAL) {
                if (isUndefined(VAL)) VAL=[];
                return type.getByName(NAME).create(implode(VAL));               },
              { "NAME":NAME, "PARENT":set, "ATTRS":[], "ELEMS":ELEMS });
}

function _objkeys(O) {
  return Object.getOwnPropertyNames(O).concat(Object.getOwnPropertySymbols(O));
}
obj.setMethod("keys",function () { return _objkeys(this); });
array.setMethod("akeys",function () { return _objkeys(this).filter(isNumStr); });

function _ggetv(VAR) {
  return function() {
    return _getopo(this,VAR);
  };
}
function _gsetv(VAR) {
  return function(VAL) {
    return _setopo(this,VAR,VAL);
  };
}
function _normid(O) {
  function setid(SY) {
    if (isDefined(O[SY])) {
      if (isDefined(O[SymbolId])) error("_normid");
      O[SymbolId]=O[SY];
      delete O[SY];
    }
  }
  if (isDefined(O["+o"]) && (typeof sId)!="undefined" && isDefined(O[sId])) error("_normid::duplicate ids");
  setid("+o");
  if ((typeof sId)!="undefined") setid(sId);
}
function _create(VAL,CONT) {
  var DONE={};
  function isDone(VAR) {
    return isDefined(DONE[VAR]);
  }
  function done(VAR) {
    if (isDone(VAR)) error("_create::done");
    DONE[VAR]=1;
  }
  if (isUndefined(CONT) && isDefined(VAL) && isContainer(VAL)) CONT=VAL,VAL=Undefined;
  var BVAL=isBoxed(VAL);
  function rec(TYPE,TYPE_) {
    var RES;
    if (jsprotoIsAtom(TYPE.JSPROTO)) {
      if (BVAL) {
        VAL=VAL.$;
        if (isUndefined(VAL)) error("_create::VAL.$");
      }
      if (jsprotoIsAtom(TYPE_.JSPROTO) && !BVAL) RES=TYPE_.JSPROTO.constructor(VAL);                                             else RES=new TYPE_.JSPROTO.constructor(VAL);
    }
    else
    if (TYPE.parent()==Nil) RES=new TYPE_.JSPROTO.constructor();
                       else RES=rec(TYPE.parent(),TYPE_,VAL,CONT);
    var ATTRS=TYPE.ATTRS;     for (var I=0;I<length(ATTRS);I++) {
      if (ATTRS[I].QUALIF.has("v")) {
        var VAL0
        if (BVAL && VAL.hasOwnProperty(ATTRS[I].NAME)) VAL0=VAL[ATTRS[I].NAME],done(ATTRS[I].NAME);
                                                  else VAL0=ocopy(ATTRS[I].VAL0);
        if (ATTRS[I].TYPE==num && isString(VAL0)) VAL0=Number(VAL0);         RES[ATTRS[I].NAME]=VAL0;
      }
    }
    if (isBoxed(RES)) TYPE.method("init").apply(RES,[]);     return RES;
  }
  if (!isType(this)) error("_create");
  var RES=rec(this.JSPROTO[SymbolType],this.JSPROTO[SymbolType]);
  if (BVAL && isBoxed(RES)) for (var VAR of VAL.keys()) if (!isDone(VAR)) RES[VAR]=VAL[VAR];
  if (isBoxed(RES)) {
    _normid(RES);
    if (isDefined(CONT)) CONT.store(RES);
  }
  return RES;
}

origin.qualif=tset("qualif",[
  "v",   "c",   "i",   "p",   "a",   "*",   "!",   ">",   "l",   "k"  ]);

origin.isQualif=function (O) {
  return isa(O,qualif);
}

type(function (NAME,TYPE,QUALIF,VAL0) {
       if (isUndefined(TYPE) && isUndefined(QUALIF)) return addr.obj(NAME);
       else {
         var RES=addr.create();
         RES.assign(NAME,TYPE,QUALIF,VAL0);
         return RES;
       }
     },
     { "NAME":"addr", "PARENT":obj, "ATTRS":[] });

addr.setMethod("assign",function (NAME,TYPE,QUALIF,VAL0) {
  if (isUndefined(TYPE)) TYPE=obj;
  if (isQualif(QUALIF)) ;
  else
  if (isString(QUALIF)) QUALIF=qualif(QUALIF);
                   else error("addr.assign");
  if (isUndefined(VAL0)) {     if (QUALIF.has("*>")) VAL0=arraypo();
    else
    if (QUALIF.has(">")) VAL0=Nil;
  }
  Object.assign(this,{ "NAME":NAME, "TYPE":TYPE, "QUALIF":QUALIF, "VAL0":VAL0 });
});
setprop(addr,"obj",function (S) {   S=trim(S," ",True,True);
  var A=splitOnce(S," ",["v",Undefined]);
  if ((typeof sId)!="undefined" && A[1][0]==sId) {
    if (!contains(A[0],"k")) A[0]+="k";     A[1]=substring(A[1],1,length(A[1]));
  }
  var Q=qualif(A[0]);
  if (Q.inter("vci")=="") Q=Q.union("v");
  A=splitOnce(A[1],"=",[Undefined,Undefined]);
  var VAL0=eval("(function () { return "+A[1]+"; })()");   A=splitOnce(A[0],":",[Undefined,"obj"]);
  var NAME=A[0],TYPE=type.getByName(A[1]);
  return addr(NAME,TYPE,Q,VAL0);
});

origin.isAddr=function (O) {
  return isa(O,addr);
}

type.setMethod("attr",function (NAME,INHERITED) {
  var RES=find(this.ATTRS,function (O) { return O.NAME==NAME; });
  if (isUndefined(RES) && INHERITED && !isNil(this.parent())) return this.parent().attr(NAME,1);
  return RES;
});
addr.setMethod("has",function (Q) {
  return this.QUALIF.has(Q);
});
type.setMethod("attrHas",function (NAME,Q) {
  var A=this.attr(NAME,1);
  return isDefined(A) && A.has(Q);
});
  
type.setMethod("setAttr",function (A) {
  if (isString(A)) A=addr(A);
  if (!isAddr(A)) error("setAttr");
  if (!isNil(this.attr(A.NAME))) error("type.setAttr");
  this.ATTRS.push(A);
  if (A.QUALIF.has("k")) {
    if (isDefined(this.KEYA)) error("type::setAttr");
    this.KEYA=A.NAME;
  }
  if (A.QUALIF.has("c")) {
    setprop(this.JSPROTO,A.NAME,A.VAL0,False,True);
  }
  else
  if (A.QUALIF.has("v>")) {
    setpropgs(this.JSPROTO,A.NAME,_ggetv(A.NAME),_gsetv(A.NAME));
  }
});

type.setMethod("attrs",function () {
  return this.ATTRS;
});
type.setMethod("setAttrs",function (L) {
  for (var I=0;I<length(L);I++) this.setAttr(L[I]);
});

type.setAttrs(["NAME","PARENT","JSPROTO","ATTRS"]);
addr.setAttrs(["NAME","TYPE","QUALIF","VAL0"]);

type(function () {
      return func.create();
    },
    { "NAME":"func", "PARENT":obj, "JSPROTO":Function.prototype, "ATTRS":[] });

setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  if (!isFunction(FUNC)) error("setMethod");
  this.setAttr(addr(NAME,func,"c",FUNC));
});


origin.isObject=function (O) {
  return isBoxed(O);
}

setprop(obj,"getById",function (ID) {
  error("obj.getById(!Yet)");
});

origin.create=obj; 
function isa(O,T) {
  return typeOf(O)==T || typeOf(O).inherits(T);
}
origin.isa=isa;

obj.setMethod("equalAttrs",function (O) {
  var RES=True;
  for (var N in O) if (this[N]!=O[N]) RES=False;
  return RES;
});
obj.setMethod("setAttrs",function (O,NOSLOTS) {
  if (isUndefined(NOSLOTS)) NOSLOTS={};
  var RES=False;
  if (!isUndefined(O)) for (var N in O) if (isUndefined(NOSLOTS[N])) {
    if (this[N]!=O[N]) {
      this[N]=O[N];
      RES=True;
    }
  }
  return RES;
});

obj.setMethod("refByPath",function (P) {
  var O=this,
      L=splitTrim(P,"."),PREVO=O;
  for (var VAR of L) PREVO=O,O=O[VAR];
  return [PREVO,last(L)];
});
obj.setMethod("getByPath",function (P) {
  var R=this.refByPath(P);
  return R[0][R[1]];
});
obj.setMethod("setByPath",function (P,VAL) {
  var R=this.refByPath(P);
  R[0][R[1]]=VAL;
});

var oflags=tset("oflags",[
  "d" ]);

var MEMORY;
origin.memory=function () {
  return MEMORY;
}

origin.copy=function (O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("copy");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.copy(O,MODE);
}
origin.move=function (O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("move");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.move(O,MODE);
}

origin.parse=function (S,CONT) {
  return parsef(S,CONT);
}
origin.serialize=function (O,MODE) {
  if (isUndefined(MODE)) MODE="full";
  if (!contains(["full","flat*","flat"],MODE)) error("serialize");
  var FMT=[["*",MODE=="flat*"?"flat":MODE,[]]];
  if (MODE=="flat") {
    sfinit();
    serializefBis(O,"flat",[]);
    return sfresult();
  }
  else return serializef(O,FMT);
}
obj.setMethod("serialize",function (MODE) {
  return serialize([this],MODE);
});

origin.isDeleted=function (O) {
  return O.hasFlags("d");
}
obj.setMethod("delete",function (MODE) {   if (isUndefined(MODE)) MODE="flat";
  if (isUnboxed(this)) return;
  var ISARR=isArray(this);
  for (var N of _keys(this)) {
    var VAL=this[N],PO=True;
    if (!(ISARR && isNumStr(N))) PO=typeOf(this).attrHas(N,">");
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("delete(!PO)::"+N);
    if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL.delete(MODE);
    }
  }
  this.addFlags("d");
});
setprop(obj,"delete",function (O,MODE) {
  if (isUnboxed(O)) O.delete(MODE);
});

origin.tree=function (A,CONT) {
  if (isAtom(A) || constructor(A)!=Array && !isTemplate(A) || length(A)<1 || !isType(A[0])) return A;   var O={};
  Object.assign(O,length(A)==1?{}:A[1]);
  if (constructor(O)!=Object) error("tree(1)");
  O.$=[];
  for (var I=2;I<length(A);I++) {     var VAL=A[I];
    if (isUndefined(A[0].NOEVAL["$"])) VAL=tree(VAL,CONT);
    O.$.push(VAL);
  }
  var RES=A[0](O,CONT);
  if (!isArray(RES["$"]) && length(A)>2) error("tree(2)");
  return RES;
}

function type0(CONS,NAME,JSTYPE,PARENT) {   CONS.NAME=NAME;
  CONS.PARENT=PARENT;
  CONS.JSPROTO=jsprotoCreate(JSTYPE,CONS,PARENT);
  CONS.JSPROTO[SymbolType]=CONS;
  Object.setPrototypeOf(CONS,TYPEPROTO);
  CONS.ATTRS=[];
  CONS.create=(function (VAL,CONT) {
                 return _create.apply(CONS.JSPROTO[SymbolType],[VAL,CONT]);
               });
}


type(function (VAL,LANG) {
       var RES;
       if (!isString(LANG)) LANG=mlstr.DEFAULT;        if (isString(VAL)) {
         RES=mlstr.create(VAL);
       }
       else 
       if (typeOf(VAL)==obj) {          if (isString(VAL.LANG)) LANG=VAL.LANG;
         var VAL0=VAL.$;
         if (isUndefined(VAL0) && isString(LANG)) VAL0=VAL[LANG];
         if (isUndefined(VAL0)) VAL0="";
         if (!isString(VAL0)) if (isNumber(VAL0)) VAL0=VAL0.toString();
                                             else error("mlstr(1)");
         RES=mlstr.create(VAL0);
         RES.setAttrs(VAL);
         delete RES.$;
         if (isString(LANG)) delete RES[LANG];
       }
       else error("mlstr(2)");
       RES.LANG=LANG;
       return RES;
     },
     { "NAME":"mlstr", "PARENT":str, "ATTRS":[],
       "LANGS":[], "TRANS":{}, "DEFAULT":"en", "LANG":"en", "VOFWE":True });

origin.isMLStr=function (O) {
  return isa(O,mlstr);
}

setprop(mlstr,"langs",function () {
  return mlstr.LANGS;
});
setprop(mlstr,"isLang",function (LANG) {
  return contains(mlstr.LANGS,LANG);
});
setprop(mlstr,"addLang",function (LANG) {
  mlstr.addLangs([LANG]);
});
setprop(mlstr,"addLangs",function (L) {
  for (var LANG of L) if (!mlstr.isLang(LANG)) {
    mlstr.LANGS.push(LANG);
    mlstr.TRANS[LANG]={};
  }
  mlstr.LANGS.sort(function (O1,O2) {
    return O1>O2;
  });
});
setprop(mlstr,"default",function () {
  return mlstr.DEFAULT;
});
setprop(mlstr,"setDefault",function (LANG) {
  if (!mlstr.isLang(LANG)) error("mlstr.setDefault");
  mlstr.DEFAULT=LANG;
});
setprop(mlstr,"lang",function () {
  return mlstr.LANG;
});
setprop(mlstr,"setLang",function (LANG) {
  if (!isString(LANG)) error("mlstr.setLang");
  mlstr.LANG=LANG;
});
setprop(mlstr,"vofWE",function () {   return mlstr.VOFWE;
});
setprop(mlstr,"setVofWE",function (B) {
  if (!mlstr.isLang(LANG)) error("mlstr.setVofWE");
  mlstr.VOFWE=B;
});

mlstr.setMethod("toString",function (LANG) {
  if (isUndefined(LANG)) LANG=mlstr.LANG;
  if (!isString(LANG)) error("mlstr.toString");
  if (LANG==this.LANG || empty(this[LANG]) && mlstr.VOFWE) return this.valueOf();
                                                      else return this[LANG];
});
mlstr.setMethod("hasValue",function (S,CINS) {
  var F=isDefined(CINS)?lcase:function (X) { return X; };
  for (var LANG of mlstr.LANGS) if (F(this.toString(LANG))==F(S)) return True;
  return False;
});

setprop(mlstr,"trans",function (S,LANG,LANG2) {
  if (!mlstr.isLang(LANG)) error("mlstr.trans(1)");
  if (isMLStr(S)) {
    if (isDefined(LANG2)) error("mlstr.trans(2)");
    var S2=S.toString(LANG);
    if (isDefined(S2)) return S2;
    S=S2;
  }
  if (!mlstr.isLang(LANG2)) error("mlstr.trans(3)");
  if (LANG==LANG2) return S;
  S=mlstr.TRANS[LANG][S];
  if (isUndefined(S)) return Undefined;
  return S.toString(LANG2);
});
setprop(mlstr,"setTrans",function (S,LANG,S2,LANG2) {
  if (isMLStr(S)) {
    if (isDefined(LANG) || isDefined(S2) || isDefined(LANG2)) error("mlstr.setTrans(1)");
    for (var LS of mlstr.LANGS) for (var LD of mlstr.LANGS) if (LS!=LD) {
      var SS=S.toString(LS),SD=S.toString(LD);
      if (isString(SS) && SS!="" && isString(SD) && SS!="") {
        mlstr.setTrans(SS,LS,SD,LD);
      }
    }
  }
  else {
    if (!isString(S) || !mlstr.isLang(LANG)
     || !isString(S2) || !mlstr.isLang(LANG2)) error("mlstr.setTrans(2)");
    var MS=mlstr.TRANS[LANG][S];
    if (isUndefined(MS)) MS=mlstr(S,LANG);
    if (MS.toString(LANG)!=S) error("mlstr.setTrans(3)");
    mlstr.TRANS[LANG][S]=MS;
    if (LANG2!=LANG) {
      if (isUndefined(mlstr.TRANS[LANG2][S2])) mlstr.TRANS[LANG2][S2]=MS;       MS[LANG2]=S2;
    }
    else if (S!=S2) error("mlstr.setTrans(4)");
  }
});

mlstr.addLangs(["en","sp","de","fr","cn","pt","ar","ru"]);


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

origin.strNumberLength=function (S,i) {
  var i0=i;
  while (S[i]=='+' || S[i]=='-') i++;
  if (isUndefined(S[i]) || !charIsDigit10(S[i])) return 0;
  var DOT=False,
      RADIX=10;
  if (S[i+1]=='b' || S[i+1]=='B') RADIX=2,i+=2;   if (S[i+1]=='x' || S[i+1]=='X') RADIX=16,i+=2;
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
    default: return TokenNatNone;   }
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
var TOKOPS,TOKOPS_0,TOKENIZECOMMENTS=True,TOKENIZEPYCOMMENTS=False; var TOKENIZEQUOTES=True; var TOKENIZENUMS=True;
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
    if (i>=0 && TOKENIZEQUOTES && !(i>0 && (S[i-1]=='\\' || S[i-1]=='/')) && (S[i]=='\"' || charIs("'",CharNatQuote) && S[i]=='\'')) {
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
      j=lexerRead(S,i,charnat(S[i]),charIs(S[i],CharNatAlf)?CharNatDigit:-1);       BEG=i,END=j;
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
    if (N>0 && N!=length(S)) RG.MAX=RG.MIN+N;
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


type(function (EXT,TOKINIT) {
       if (!isString(EXT)) error("format(1)");
       var RES=format.getBy("EXT",EXT);
       if (RES==Nil) {
         var RES=format.create();
         RES.EXT=EXT;
         RES.TOKINIT=isUndefined(TOKINIT)?function (){
           tokenizeStart("");
         }:TOKINIT;
         format.$.push(RES);
       }
       return RES;
     },
     { "NAME":"format", "PARENT":obj,
       "ATTRS":["EXT=''","TOKINIT=Nil"] });

format.$=[];
setprop(format,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in format.$) if (format.$[I][NAME]==VAL) RES=format.$[I];
  return RES;
});

origin.isFormat=function (O) {
  return isa(O,format);
}

origin.load=function (FPATH,KEEP) {
  var TXT=fileRead(FPATH),
      EXT=fileExt(FPATH);
  if (!isString(EXT) || EXT=="") error("load(1)");
  var FMT=format.getBy("EXT",EXT);
  if (!isFormat(FMT)) error("load::format<"+EXT+"> doesn't exists");
  charsInit();
  FMT.TOKINIT();
  return tokenize(TXT,isDefined(KEEP));
}

origin.txtsave=function (TXT,N,SEP) {   var PREVS="",RES="",I=0;
  for (var S of TXT) {
    if (isNumber(N) && I>=N) break;
    if (isDefined(SEP)) { if (N>0) RES+=SEP; }
                   else if (PREVS!="" && charIsAlpha(PREVS[0]) && S!="" && charIsAlpha(S[0])) RES+=" ";
    RES+=S;
    PREVS=S;
    I++;
  }
  return RES;
}
origin.save=function (FPATH,TXT) {
  if (isArray(TXT)) TXT=txtsave(TXT);
  fileWrite(FPATH,TXT);
}


declare({ sType:"\u03c4",              sFunc:"\u03c6",              sAord:"\u03bf",              sSymb:"\u03c3" }); 
var _SYMBNO=0;
origin.gensym=function () {
  var RES=sSymb+_SYMBNO;
  _SYMBNO++;
  return RES;
}


function parseSexprAtom(VAL) {
  if (!isString(VAL)) error("parseSexprAtom");   if (VAL=="true" || VAL=="True") return True;
  if (VAL=="false" || VAL=="False") return False;
  if (VAL=="null" || VAL=="Nil") return Nil;
  if (VAL=="undefined" || VAL=="Undefined") return Undefined;
  if (length(VAL)>0 && charIsDigit10(VAL[0])) return Number(VAL);
  return VAL.replace(/\\"/g,'"'); }
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
      if (POS=="let" && _PSESEP!="" && L[I]==_PSESEP) POS="sep";
    if (POS=="let" && L[I]!=_PSELET) POS="sep";
    if (POS=="sep" && _PSESEP=="") POS="var";
    errlicolSet2(L[I]);
    if (!FIRST && _PSESEP!="" && POS=="sep" && !containsVal([_PSEEND,"]"],L[I])) {
      if (L[I]!=_PSESEP) ;      else {
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
      I+=1;
  }
  if (length(RES)>1) error("parseSexprList::missing '"+_PSEEND+"'");
  return RES[0];
}

origin.parseSexpr=function (S,LANG,RAW) {   if (isUndefined(RAW)) {
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

function preprocSexprAtom(VAL) {
  var PP;
  function pp(Q) {
    if (isString(VAL) && length(VAL)>=2 && VAL[0]==Q) {
      if (VAL[length(VAL)-1]!=Q) error("preprocSexprAtom");
      VAL=substring(VAL,1,length(VAL)-1);       PP=1;
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
      VAL=preprocSexprAtom(VAL);       RES.push(":"+VAL);
      I++;
    }
    else RES.push(preprocSexpr(VAL,"obj"));
    I++;
  }
  return RES;
}

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


str.setMethod("fromHtml",function () {   if (!isString(this)) error("obj.fromHtml");
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
  errlicolSet(-1,-1,licol(this).FNAME);
  parse(RES,A,0);
  return RES;
});


var _SERIALIZING=[],_IDS_ON=[],
    SERIALIZEINDENT=0,
    SERIALIZING=False,PRETTYLEVEL=0;
    _PRETTYID=0,
    PRETTYSTRID=0,PRETTYINDENT2=False; 
var SymbolPrettyId=sy("pretty::+o"),
    SymbolCont=sy("^$"),
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
                ;
  if (!isNil(O[SymbolId])) RES=RES.concat([SymbolId]);
  if (!isNil(O[SymbolCont])) RES=RES.concat([SymbolCont]);
  return rmdupvals(RES);
}
function prettyBis(O,MODE,SKIN,INDENT) {
  if (INDENT==Undefined) INDENT=False;
  var OSERIALIZING=SERIALIZING;
  if (isFunction(MODE)) return MODE(O);
  if (isType(O)) if (PRETTYLEVEL>0) return O.NAME;   if (isUndefined(O)) return "Undef";
  if (isNil(O)) return "Nil";
  if (isBoolean(O)) return O?"True":"False";   if (isNumber(O)) return O.toString();
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
        if (!isNumStr(I)) RES+=I+":";         RES+=prettyBis(O[I],MODE,SKIN);
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
      if (MODE==Undefined) MODE="short";       if (isNil(PATTERN)) PATTERN={"*":["av","full"]},
                          PATTERN[SymbolId]=["-",""],PATTERN[SymbolCont]=["-",""],
                          PATTERN[sType]=["-",""];
      if (INDENT) incIndent(2);
      var PREVINDENT2=False;
      var FIRST=True,I=0,
          NAMES=prettyNames(O),LNAMES=length(NAMES),TRGI="";
      for (var NAME of NAMES) {
        var MODE2=Undefined;         if (isDefined(PATTERN[NAME])) MODE2=PATTERN[NAME];
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
        }
  }  
  SERIALIZING=OSERIALIZING,PRETTYLEVEL--;
  return RES;  
}
origin.pretty=function (O,MODE,SKIN) {   var INDENT=False;
  if (MODE=="indent") MODE=Undefined,INDENT=True;   var OPRETTYINDENT2=PRETTYINDENT2,OPRETTYLEVEL=PRETTYLEVEL;
  PRETTYLEVEL=0;
  if (INDENT) PRETTYINDENT2=1;
  if (!SERIALIZING) _SERIALIZING=[],_IDS_ON=[];
  if (isUndefined(MODE)) MODE="short";
  var RES=prettyBis(O,MODE,SKIN);
  if (!SERIALIZING) RES=prettySetIdPrefs(RES),prettyFreeBufs();
  PRETTYINDENT2=OPRETTYINDENT2,PRETTYLEVEL=OPRETTYLEVEL;
  return RES;
}


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

origin.sexprToObj=function (L0,CONT,FULL) {   function rec(L,FULL) {
    if (isAtom(L)) return L;
    if (!isArray(L)) error("sexprToObj");
    var I=1,N=length(L),
        RES=L[0]=="array"?[]:{};
    RES[sType]=L[0];
    var ISTYPE=L[0]=="type";     while (I<N) {
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
        if (1) {           if (!isNil(PARENT)) {
            PARENT=type.getByName(PARENT);
            if (isUndefined(PARENT)) error("sexprToObj::FULL(type)=>"+pretty(RES.PARENT));
            RES.PARENT=PARENT;
          }
          delete RES[sType];           if (isDefined(RES.ATTRS)) RES.ATTRS=RES.ATTRS.map(function (S) {
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
          TYPE=type(Nil,RES);         }
        RES=TYPE;
      }
      else {
      
          var TYPE=type.getByName(RES[sType]);
          if (isUndefined(TYPE)) TYPE=type(Nil,{ NAME:RES[sType], PARENT:obj });           delete RES[sType];           RES=TYPE(RES,CONT);
            }
    }
    return RES;
  }
  if (!isNil(CONT) && isAtom(CONT)) FULL=isTrue(CONT),CONT=Undefined;
  if (isDefined(CONT) && !isContainer(CONT)) error("sexprToObj");
  charsInit();   return rec(L0,FULL);
}

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
origin.parsefStart=function () {   charsInit();
  charnatSet("#",CharNatAlf);
  charnatSet("+",CharNatAlf);
  charnatSet("%",CharNatAlf);
  charnatSet(".",CharNatAlf);
  tokenizeStart("( ) [ ] { } = : ,");
}

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
               return X!=SymbolUp && X!=SymbolCont && X!="TO" 
                   && X!="length" && (!isNumStr(X) || !isAtom(O));
             });
}
var _SFLANG;
function serializefBis(O,MODE,MODES) {

  var ISFIRST,SKIPSPC,SFSDONE;
  function sfslot(N,SMODE) {
    if (isUndefined(SMODE)) SMODE={};
    if ((isAtom(O) && N=="$" || O.hasOwnProperty(N)) && !(N==sy("+o") && sfisHiddenId(O[N]))) {
      var NAME=isSymbol(N)?sy(N):N;
      if (contains(NAME,":")) return;       if (!SKIPSPC) {
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
  if (typeOf(O)==str) return sfout('"'+strEscape(O)+'"');   if (isFunction(O)) return sfout('<Func>');
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
    for (var N of sfattrs(O)) if (isUndefined(SFSDONE[N])) sfslot(N,{});     if (_SFLANG=="lisp") sfout(")");
                    else sfout("}");
    _SFINDENT-=2;
  }
}
function serializefAllOfType(O,TYPE,MODE,MODES,SETID) {   if (isUndefined(SETID)) SETID=False;
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
      if (!isRootAtom(O[N]) && !isArray(O[N]) && MODE!="full") sfstore(O[N]);
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
  if (isArray(O)) {     for (var I=0;I<length(O);I++) if (!_SFDONE[sfoid(O[I])]) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O[I],"full",[]);
    }
  }
  else serializefAllOfType(O,"*","full",[]);
  sfrelease();
  return sfresult();
}


type(function (SRV,ROOT,GID) {
       var RES=thread.create();
       RES.ID=thread.LASTID++;
       if (isNil(SRV)) error("thread.cons(1)");
       RES.SRV=SRV;        RES.STATE=thread.Ready;
       var RETP,FAILP;
       RES.PROM=new Promise((RET,FAIL)=>{
         RETP=RET;
         FAILP=FAIL;
       });
       RES.PROM.RET=RETP;
       RES.PROM.FAIL=FAILP;
       if (isString(ROOT)) {
         if (!isNil(GID)) error("thread.cons(2)");
         GID=ROOT;
         ROOT=Undefined;
       }
       if (isStep(ROOT)) {
         RES.ROOT=RES.CURRENT=ROOT;
       }
       else
       if (isFunction(ROOT)) {
         RES.step(ROOT,1);
       }
       else
       if (!isNil(ROOT)) error("thread.cons(2)");
       thread.$[RES.ID]=RES;
       if (isString(GID)) RES.GID=GID;
       else {
         if (!isNil(GID)) error("thread.cons(3)");
         RES.IDLOC=SRV.EVTNO++;
         RES.GID=gthreadId(RES,1);
       }
       SRV.enter(RES);
       return RES;
     },
     { "NAME":"thread", "PARENT":obj,
       "ATTRS":["ID=0","IDLOC=Undefined","GID=0",
                "SRV=Nil","PROM=Nil",
                "STATE=Nil","ERR=Nil",
                "ROOT=Nil","CURRENT=Nil"] });

thread.$=[];
thread.LASTID=0; 
thread.None=0;
thread.Ready=1; thread.Running=2;
thread.Finished=4;
thread.Error=5;

thread.TRACE=0;

setprop(thread,"getById",function (ID) {
  return thread.$[ID];
});

origin.isThread=function (O) {
  return isa(O,thread);
}

thread.CURRENT=Nil;
setprop(thread,"current",function (TH) {
  if (isUndefined(TH)) return thread.CURRENT;
  else {
    if (!isNil(thread.CURRENT) && !isNil(TH)) error("thread.current");
    thread.CURRENT=TH;
  }
});

type(function (TH,F) {
       var RES=step.create();
       RES.UP=TH;
       RES.F=(async function () {
         RES.state(thread.Running);
         await F();
         RES.state(thread.Finished);
         TH.next();
       });
       RES.F[SymbolId]=F.name;
       return RES;
     },
     { "NAME":"step", "PARENT":obj,
       "ATTRS":["UP=Nil","F=Nil",
                "STATE=thread.None","ERR=Nil",
                "$=[]"] });

origin.isStep=function (O) {
  return isa(O,step);
}
step.setMethod("thread",function () {
  var RES=this.UP;
  while (isStep(RES)) RES=RES.UP;
  if (!isThread(RES)) error("step.thread");
  return RES;
});
step.setMethod("state0",function (STATE) {
  var ST=this;
  while (isStep(ST)) ST.STATE=STATE,ST=ST.UP;
  if (!isThread(ST)) error("step.state0");
});
step.setMethod("state",function (STATE) {
  if (contains([thread.Running,thread.Error],STATE)) this.state0(STATE);
  else {
    if (STATE!=thread.Finished) error("step.state(1)");
    var ST=this;
    while (isStep(ST)) {
      if (empty(ST.$)) ST.STATE=thread.Finished;
      else {
        var FINISHED=True;
        for (var ST2 of ST.$) if (ST2.STATE!=thread.Finished) FINISHED=False;
        if (FINISHED) ST.STATE=thread.Finished;
      }
      if (ST.STATE!=thread.Finished) break;
      ST=ST.UP;
    }
  }
});

thread.setMethod("ffirst",function (FPOS) {
  var ATEND=True;
  function find(ST) {
    function lfind(L) {
      for (var I=0;I<length(L);I++) if (L[I].STATE!=thread.Finished) {
        if (I+1<length(L)) ATEND=False;
        return find(L[I]);
      }
      return Nil;
    }
    if (ST.STATE==thread.Finished) return Nil;
    if (empty(ST.$)) return ST;
                else return lfind(ST.$);
  }
  var RES=find(this.ROOT);
  if (isDefined(FPOS)) RES=[ATEND,RES];
  return RES;
});

thread.setMethod("step",function (F,SYNC) {
  var TH=thread.current();
  if (TH!=Nil && (TH!=this || SYNC)) error("thread.step(1)");
  TH=this;
  var ST=step(TH,F);
  if (TH.ROOT==Nil) TH.ROOT=TH.CURRENT=ST;
  else {
    var ST2=TH.CURRENT;
    if (ST2.STATE==thread.Finished || ST2.STATE==thread.Error) error("thread.step(2)");
    ST.UP=ST2;
    ST2.$.push(ST);
  }
  if (SYNC) this.next();
  return TH;
});

thread.setMethod("atEnd",function () {
  var [ATEND,ST]=this.ffirst(1);
  return ATEND && ST.STATE==thread.Running;
});
thread.setMethod("next",function () {
  var TH=this,
      ST=TH.ffirst();
  if (ST==Nil) {
    TH.STATE=thread.Finished;
    TH.CURRENT=Nil;
  }
  else {
    if (ST.STATE!=thread.None) error("thread.next(1)");
    if (thread.TRACE) console.log("Scheduling",ST.F[SymbolId]);
    whenIdle(async function () {
      if (thread.TRACE) console.log("Entering "+ST.F[SymbolId]);
      thread.current(TH);
      TH.STATE=thread.Running;
      TH.CURRENT=ST;
      await ST.F();
      TH.STATE=thread.Ready;
      thread.current(Nil);
      if (thread.TRACE) console.log("Leaving "+ST.F[SymbolId]);
    });
    if (thread.TRACE) console.log("Scheduling(x)",ST.F[SymbolId]);
  }
});


type(function (PORT,SRV) {
       function create(CATEG) {
         var RES=channel.create();
         RES.ID=channel.LASTID++;
         RES.CATEG=CATEG;
         channel.$[RES.ID]=RES;
         return RES;
       }
       var RES;
       if (isNumber(PORT)) {
         RES=channel.getBy("PORT",PORT);
         if (RES==Nil) {
           RES=create("l");            RES.ADDR="0.0.0.0";
           RES.PORT=PORT;
           if (isUndefined(SRV)) error("channel.cons(1)");
           RES.SRV=SRV;
         }
       }
       else {
         var URL=server.urlNormalize(PORT);          if (!isString(URL)) error("channel.cons(2)");
         RES=create("r");          var URL0=urlParse(URL);
         RES.HREF=URL;
         RES.ADDR=URL0.hostname;
         RES.PORT=JSON.parse(URL0.port==""?"80":URL0.port);
         if (isDefined(SRV)) error("channel.cons(3)");
       }
       return RES;
     },
     { "NAME":"channel", "PARENT":obj,
       "ATTRS":["ID=0",
                "CATEG=''","PORT=0",
                "ADDR=''","HREF=''",
                "SRV=Nil"] });

channel.$=[];
channel.LASTID=0; 
setprop(channel,"getById",function (ID) {
  return channel.$[ID];
});
setprop(channel,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in channel.$) if (isDefined(channel.$[I])
                             && channel.$[I][NAME]==VAL) RES=channel.$[I];
  return RES;
});

origin.isChannel=function (O) {
  return isa(O,channel);
}
channel.setMethod("isLocal",function () {
  return this.CATEG=="l";
});
channel.setMethod("isRemote",function () {
  return this.CATEG=="r";
});

channel.setMethod("msg",function (METHOD,PATH,TYIN,TYOUT,DATA) {
  function encin(TY) {
    var L=splitTrim(TY," ");
    if (length(L)>1) return L[1];
    if (startsWith(L[0],"image/")) return "binary";
    if (startsWith(L[0],"text/")) return "utf-8";     return "utf-8";
  }
  if (isNil(TYIN) || TYIN=="") TYIN="application/x-www-form-urlencoded";
  var REQ,RES=Nil,
      ENCIN=encin(TYIN),
      PROM;
  TYIN=splitTrim(TYIN," ")[0];
  if (isUndefined(METHOD)) METHOD="POST";
  if (isNil(TYOUT) || TYOUT=="") TYOUT="application/json";
  function rheader(CONN,ATTR) {
    if (SERVER) return CONN.headers[ATTR];
           else return CONN.getResponseHeader(ATTR);
  }
  function ret(CONN,RES) {
    var MIME=rheader(CONN,"content-type");
    if (startsWith(MIME,"text/") && !isString(RES)) RES=RES.toString();     if (isString(RES)) RES=RES.trim();
    if (RES!=Nil && MIME=="application/json") RES=JSON.parse(RES);
    ;     return RES;
  }
  if (!this.isRemote()) error("channel.send(!remote)");
  var PAGE=PATH,PARMS="";
  if (PAGE=="") PAGE=Nil;
  if (PAGE) {
    if (contains(PAGE,"?")) {
      var L=splitTrim(PARMS,"?");
      PAGE=L[0];
      PARMS=isDefined(L[1])?L[1]:Nil;
    }
    if (PAGE[0]!="/") PAGE="/"+PAGE;
  }
  if (PAGE=="") PAGE=Nil;
  if (PARMS=="") PARMS=Nil;
  var URL=this.HREF+(PAGE?PAGE:"")+(PARMS?"?"+PARMS:"");
  if (SERVER) {
    var U=urlParse(URL),
        OPT={
          hostname: U.hostname,
          port: U.port,
          path: U.pathname,
          method: METHOD,
          headers: {
            "Content-Type": TYIN,
            'Accept': TYOUT
          }
       };
    PROM=new Promise((RETURN,REJECT) => {
      REQ=http.request(OPT,function (CONN) {
                    CONN.on('data',function (ELT) {
          if (RES==Nil) RES=ELT;
                   else RES+=ELT;
                });
        CONN.on('end',function () {
                          RES=ret(CONN,RES);
                          RETURN(RES);
        });
      });
      REQ.on('error',function (E) {
        console.log(`problem with request: ${E.message}`);
        REJECT(E);
      });
      if (METHOD!="GET" && isDefined(DATA)) {
        if (METHOD!="PUT") DATA=JSON.stringify(DATA);
        REQ.write(DATA,ENCIN=="binary"?"binary":Undefined);
      }
      REQ.end();
    });
  }
  else {
    PROM=new Promise((RETURN,REJECT) => {
      if (METHOD!="GET" && isDefined(DATA)) {
        if (METHOD!="PUT") DATA=JSON.stringify(DATA);
      }
      else DATA=Nil;
      REQ=new XMLHttpRequest();
      REQ.open(METHOD,URL,True);
      REQ.setRequestHeader("Content-Type",
                           TYIN+(isDefined(ENCIN)
                              && ENCIN!="binary"
                              && ENCIN!=""?"; charset="+ENCIN:""));
      if (ENCIN=="binary" && isString(DATA)) {
        var N=length(DATA),BUF=new Uint8Array(N);
        for (var I=0; I<N; I++) {
          BUF[I]=DATA.charCodeAt(I)&0xff;
        }
        DATA=BUF;
      }
      REQ.setRequestHeader("Accept",TYOUT);
      REQ.onreadystatechange=function() {
        if (REQ.readyState==4) {
          if (REQ.status==200) {
            RES=REQ.responseText;
            RES=ret(REQ,RES);
            RETURN(RES);
          }
          else {
            REJECT(REQ.status);
          }
        }
      }
      REQ.send(DATA);
    });
  }
  ;   return PROM;
});

channel.setMethod("handler_msg",function (METHOD,PATH,TYIN,TYOUT,DATA,RET) {   if (isSymbol(METHOD)) {
    this.SRV.call(METHOD,[PATH,TYIN,TYOUT,DATA,RET]);   }
  else {
    if (typeOf(DATA)!=str) DATA=JSON.parse(DATA.toString());
    var PARMS=JSON.parse(DATA),
        REQLOG=_REQLOG,
        THIS=this,
        GID=PARMS[1].shift(),
        SRV;     if (GID) {
      REQLOG.IDCLI=splitTrim(GID,":")[0];       SRV=server.getById(REQLOG.IDCLI);
    }
    else {
      REQLOG.IDCLI=GID;
      SRV=this.SRV;
    }
    if (isNil(SRV)) error("channel.handler_msg");
    thread(SRV,async function () {
      _REQLOG=REQLOG;
      var RES=await THIS.SRV.call(PARMS[0],{ACCEPT:TYOUT},PARMS[1]);                        RET(200,TYOUT,DATA,RES);
    },GID+("["+PARMS[0]+"]"));
  }
});

channel.setMethod("start",function () {
  var REQNO=0;
  function req(REQ) {
    var PARMS=urlParse(REQ.url);
    return { "METHOD":REQ.method,
             "PATHNAME":PARMS.pathname,"QUERY":PARMS.query,
             "ADDR":REQ.socket.address(),"RADDR":REQ.socket.remoteAddress,
             "ACCEPT":REQ.headers.accept,"REFERER":REQ.headers.referer,              "IDCLI":-1
            };
  }
  function log(NO,REQ,BODY,ERR,BIN,ANSW) {
    out(REQ.METHOD+"<#"+NO+"><"+
        REQ.ADDR.address+":"+REQ.ADDR.port+"::"+
        REQ.IDCLI+" "+REQ.PATHNAME+" "+REQ.QUERY+">");
    if (REQ.METHOD=="GET") out("[]"); else out(BODY.toString());
    cr(),out("["+JSON.stringify(ERR)+"]=> ");
    if (BIN) out("...");
    else
    if (REQ.METHOD=="GET") out("..."); else out(ANSW);
    cr(),origin.garbage();
    out("<<"+origin.TXC+" "+origin.TXCL+" "+origin.JXO+" ;; "
            +(process.memoryUsage().heapUsed/(1024*1024)).toFixed(2)+"Mb"
            +">>");
    cr(),cr();
  }
  var THIS=this;
  function handler(REQ,ANSW) {
    var REQLOG=_REQLOG=req(REQ);
    _CURSRV=THIS.SRV;
    function ret(ERR,CTYPE,MSG,RES,BIN) {
      if (CTYPE=="application/json") RES=isUndefined(RES)?"null":JSON.stringify(RES);
      var SRES=RES;
      if (!BIN && !conf().LOG_FULLANSW) SRES=substring(SRES,0,80)+(length(SRES)>80?" ...":"_");
      log(REQNO++,REQLOG,MSG,ERR,BIN,SRES);
      ANSW.writeHead(ERR, {'Content-Type': CTYPE,
                           'Access-Control-Allow-Origin': '*'                           });
      if (isDefined(BIN)) ANSW.end(RES);
      else {
        ANSW.write(RES);
        ANSW.end("\n");
      }
      _REQLOG=_CURSRV=Nil;
    }
    var ISRPC=(REQLOG.PATHNAME=="/" && REQ.method=="POST");
    if (REQLOG.PATHNAME=="/" && REQ.method=="GET") REQLOG.PATHNAME="/index.html";
    var METHOD=lcase(REQLOG.METHOD),
        PATH=REQLOG.PATHNAME+(isString(REQLOG.QUERY) && REQLOG.QUERY!=""?"?"+REQLOG.QUERY:""),
        TYIN=REQ.headers["content-type"],         TYOUT=REQLOG.ACCEPT;
    if (!ISRPC) METHOD=sy(METHOD);
    function fdataxc(FUNC) {
      var MSG="",ISOBJ=false;
      REQ.on('data',function (DATA) {
        if (ISOBJ) error("channel::handler(multipart obj)");         else {
          if (typeOf(DATA)==str) MSG+=DATA;
          else
          if (isa0(DATA,Buffer)) {
            MSG=Buffer.concat(MSG==""?[DATA]:[MSG,DATA]);
          }
          else error("fdataxc");
        }
      });
      REQ.on('end',function () {
        FUNC(MSG);       });
    }
    fdataxc(function (MSG) {
      THIS.handler_msg(METHOD,PATH,TYIN,TYOUT,MSG,ret);
    });
  }
  if (!this.isLocal()) error("channel.start(!local)");
  if (!isNil(this._RUNNING)) error('channel.start(already running)');
  var SRV=http.createServer(handler);
  this._RUNNING=SRV;   SRV.on('connection', function (SOCK) { SOCK.unref(); });
  SRV.listen(this.PORT,"0.0.0.0");
});


var APIDefault={};
type(Nil,
     { "NAME":"api", "PARENT":obj, "ATTRS":[] });

origin.isApi=function (O) {
  return isa(O,api);
}

type(function (PORT,API) {
       function create(CATEG,ISPHYS) {
         var RES=server.create(),
             ROOT=server.root();
         if (isUndefined(ROOT) && !ISPHYS && CATEG=="l") ISPHYS="root";          if (ISPHYS) {
           RES.IDPHYS=server.LASTIDPHYSSRV++;
           RES.IDSRV=0;
           if (ISPHYS=="root") server.LASTIDSRV++;
         }
         else {
           if (isUndefined(ROOT) && CATEG=="c") error("server.create");
           if (isDefined(ROOT)) RES.IDPHYS=ROOT.IDPHYS;
           RES.IDSRV=server.LASTIDSRV++;
         }
         RES.CATEG=CATEG;
         server.SRV[ISPHYS && ISPHYS!="root"?gserverId(RES,1):RES.IDSRV]=RES;
         return RES;
       }
       var RES;
       if (isNumber(PORT)) {
         RES=server.getBy("PORT",PORT);
         if (RES==Nil) {
           RES=create("l");            if (isUndefined(API) || typeOf(API)==obj) API=api(API);
           if (!isApi(API)) error("server.cons(1)");
           RES.ADDR="0.0.0.0";
           RES.PORT=PORT;
           RES.API=API;
           setPrototypeOf(API,APIDefault);                                                       RES.CH=channel(PORT,RES);          }
       }
       else
       if (PORT=="c") {
         if (!isNumber(API)) error("server.cons(2)");
         RES=create("c");          RES.IDSRVPARENT=API;
       }
       else {
         var URL=server.urlNormalize(PORT),IDCLI;
         if (!isString(URL)) error("server.cons(3)");
         if (isDefined(API)) IDCLI=API;
         RES=server.getBy("HREF",URL);
         if (RES==Nil) RES=(async function () {
           var RES=create("r");            var URL0=urlParse(URL);
           RES.HREF=URL;
           RES.ADDR=URL0.hostname;
           RES.PORT=JSON.parse(URL0.port==""?"80":URL0.port);
           RES.CH=channel(URL);
           if (IDCLI!=-1) await RES.connect(IDCLI);
           return RES;
         })();
       }
       return RES;
     },
     { "NAME":"server", "PARENT":obj,
       "ATTRS":["IDPHYS=0","IDSRV=0",
                "IDCLI","IDSRVPARENT",
                "CATEG=''","PORT=0",
                "ADDR=''","HREF=''",
                "API={}","_RUNNING=Nil","CH=Nil","EVTNO=0",
                "CONT=[]",
                "THREAD=[]","PROC=Nil"] });

server.SRV=[];
server.LASTIDSRV=0; server.LASTIDPHYSSRV=0;

setprop(server,"root",function () {
  return server.SRV[0];
});
setprop(server,"getById",function (ID) {
  return server.SRV[ID];
});
setprop(server,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in server.SRV) if (isDefined(server.SRV[I])
                             && server.SRV[I][NAME]==VAL) RES=server.SRV[I];
  return RES;
});

origin.isServer=function (O) {
  return isa(O,server);
}
origin.isLocal=function (O) {   return isServer(O) && O.CATEG=="l";
}
origin.isRemote=function (O) {
  return isServer(O) && O.CATEG=="r";
}
origin.isClient=function (O) {
  return isServer(O) && O.CATEG=="c";
}

setprop(server,"find",function (ADDR,PORT,IDCLI) {
  var RES=Nil;
  for (var I in server.SRV) {
    var SRV2=server.SRV[I];
    if (isDefined(SRV2) && SRV2.ADDR==ADDR && SRV2.PORT==PORT && SRV2.IDSRV==IDCLI) {
      if (RES!=Nil) error("server.find");       RES=SRV2;
    }
  }
  return RES;
});

setprop(server,"urlApp",function () {
  return server.APP_URL;
});
setprop(server,"urlWeb",function () {
  return server.WEB_URL;
});
setprop(server,"urlNormalize",function (U) {
  return urlNormalize(U,server.urlApp());
});

server.setMethod("evtNo",function (NO) {
  if (isUndefined(NO)) NO=this.EVTNO,this.EVTNO++;
                       if (this.EVTNO<=NO) this.EVTNO=NO+1;
                                           else error("evtNo");
});

function _connect(IDSRV) {
  var RES;
  if (isDefined(IDSRV)) {
    RES=server.getById(IDSRV);
    if (isUndefined(RES)) error("_connect(1)");
  }
  else {
    if (isNil(server.currentServer())) error("_connect(2)");
    RES=server("c",server.currentServer().IDSRV);
    RES.ADDR=_REQLOG.ADDR.address;
    RES.PORT=_REQLOG.ADDR.port;
  }
  return { "IDSRV":RES.IDSRV, "IDPHYSCLI":RES.IDPHYSCLI, "CONF":conf(1) };
}
function _allocPhys() {
  var RES=_connect();
  server.getById(RES.IDSRV).IDPHYSCLI=server.LASTIDPHYSSRV++;   return RES;
}
server.setMethod("connect",async function (IDCLI) {
  var CLI=await this.call("_connect",isDefined(IDCLI)?[IDCLI]:[]);
  this.IDCLI=CLI.IDSRV;
  if (CLI.IDPHYSCLI) {
    if (this.IDSRV!=0) error("connect.PHYS");
    this.IDPHYS=CLI.IDPHYSCLI;
  }
  if (isUndefined(this.IDPHYS)) error("connect::IDPHYS");
  confExec(CLI.CONF); });

server.setMethod("close",function () {
  var THIS=this;   function rm() {
    var IRM=index(server.SRV,THIS);
    if (IRM!=THIS.IDSRV) error("close::rm");
    server.SRV[THIS.IDSRV]=Undefined;
  }
  if (this.CATEG=="r") this.call("_close",[]),rm();
  else
  if (this.CATEG=="c") rm();
  ;
});
function _close() {
  var SRV=server.currentClient();
  SRV.close();
  return True;
}

server.setMethod("enter",function (TH) {
  ;   this.THREAD.push(TH);
});

server.setMethod("call",function (FNAME,OPT,PARMS,CALLBACK) {   var RES=Nil,
      METHOD="POST";
  if (isArray(OPT)) CALLBACK=PARMS,PARMS=OPT;
               else METHOD=[OPT.METHOD,OPT.ACCEPT];
  if (isLocal(this)) {
      var F=this.API[FNAME];
    if (isFunction(F)) {
      RES=F.apply(Nil,PARMS);
    }
  }
  else
  if (isRemote(this)) {
    var TH=thread.current(),IDCLI;
    if (TH) IDCLI=TH.GID;
       else IDCLI=gserverId(this,1)+":"+(this.EVTNO++);
    PARMS.unshift(IDCLI);
    RES=this.send(METHOD,"",JSON.stringify([FNAME,PARMS]),CALLBACK);
  }
  else error("server.call");
  return RES;
});

server.setMethod("send",function (METHOD,PARMS,DATA) {   var REQ,RES=Nil,ACCEPT;
  if (isArray(METHOD)) ACCEPT=METHOD[1],METHOD=METHOD[0];
  if (isUndefined(METHOD)) METHOD="POST";
  if (endsWith(METHOD,":bin")) METHOD=substring(METHOD,0,length(METHOD)-4);
  if (isUndefined(ACCEPT)) ACCEPT="application/json";
  if (!isRemote(this)) error("server.send(!remote)");
  return this.CH.msg(METHOD,PARMS,"",ACCEPT,DATA);
});

var _REQLOG=Nil,_CURSRV=Nil;
setprop(server,"currentClient",function () {   if (isNil(_REQLOG)) return Nil;
  var SRV=server.find(_REQLOG.ADDR.address,_REQLOG.ADDR.port,_REQLOG.IDCLI);
  if (!isClient(SRV)) error("server.currentClient");
  return SRV;
});
setprop(server,"currentServer",function () {   return _CURSRV;
});

var http=Undefined;
server.setMethod("start",function () {
  this.CH.start();
});

server.setMethod("stop",function () {
  if (isNil(this._RUNNING)) error("server.stop");   this._RUNNING.unref();
  this._RUNNING.close();
  this._RUNNING=Nil;
});

server.setMethod("attach",function (CONT) {
  if (!isContainer(CONT) || isDefined(CONT.SRV)) error("server.attach");
  this.CONT[CONT.IDCONT]=CONT;
  CONT.SRV=this;
});

server.setMethod("container",function (NAME,FOP) {
  if (FOP) {
    var CONT=this.container(NAME);
    if (isNil(CONT)) {
      CONT=container(NAME,this);
    }
    return CONT;
  }
  else return find(this.CONT,function (X) { return isDefined(X) && X.NAME==NAME });
});
function _fetchconts() {
  return RES=server.currentClient().containers(True).map(function (C) {
    return {"NAME":C.NAME};
  });
}
server.setMethod("containers",function (FETCH) {
  if (FETCH) {
    if (isLocal(this)) ;
    else
    if (isRemote(this)) {
      var THIS=this;
      return (async function () {
        var L=await THIS.call("_fetchconts",[]);
        for (var C of L) {
          THIS.container(C.NAME,True);
        }
        return THIS.containers();
      })();
    }
    else
    if (isClient(this)) {
      var SRV=server.getById(this.IDSRVPARENT);
      for (var C of SRV.containers()) {
        if (isString(C.NAME) && C.NAME!="") {
          this.container(C.NAME,True);
        }
      }
    }
    return this.containers();
  }
  else return this.CONT.filter(function (X) { return isDefined(X); });
});

function _grep(NAME,Q) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_grep");
  return serialize(CONT.query(Q),"flat*");
}

function _syncobjs(NAME,S) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_syncobjs");
  parse(S,CONT);
  return True;
}
function _reboot(NAME,S) {
  server.currentServer().stop();
  timers.setTimeout(function () {
    console.log("Bye bye !");
    var 
        PROC=child_process.fork(process.argv[1],{ detached:True, stdio:"ignore" });
    PROC.unref();
    process.exit(1);
  },1000);
  console.log("Rebooting ...");
  return True;
}

function _srvls() {
  var T={ "l":"LOC", "r":"REM", "c":"CLI" };
  function cls(CONT) {
    outd(CONT.IDCONT),out(" ");
    outd(CONT.SRV.IDSRV),out(" [");
    outd(CONT.NAME),out(";");
    outd(CONT.FNAME),out("]");
  }
  function ls(SRV) {
    out(T[SRV.CATEG]),
    out(" "),outd(SRV.IDSRV);
    out(" "),outd(SRV.IDCLI);
    out(" "),outd(SRV.HREF);
    out(" "),outd(SRV.ADDR);
    out(" "),outd(SRV.PORT);
    for (var C of SRV.containers()) cr(),out("  "),cls(C);
    for (var TH of SRV.THREAD) cr(),out("  "),out(TH.ID+" "+TH.GID);
  }
  for (var I in server.SRV) if (isDefined(server.SRV[I])) ls(server.SRV[I]),cr();
  return Nil;
}

async function _submit(ID,ATTRS) {
  if (origin.DBGQUERY) console.log("=> ",ID,ATTRS);
  ATTRS=container.patch(ATTRS);
  var CLI=server.currentClient();
  jxstart(CLI.PROC);
  var RES=toHtml(jx$(await jixReeval(ID,ATTRS)));
  jxstart(Nil);
  function gc(CONT,MYSQL) {
    if (CONT) {
          CONT.$={};
      if (CONT.PERSIST) for (var I in CONT.PERSIST) CONT.$[I]=CONT.PERSIST[I];
      if (0 && MYSQL) {
        CONT.CON.end(function () { console.log("Pool ended"); });
        CONT.CON=_mysql.createPool({
                        host:CONT.ADDR, user:CONT.USER, password:CONT.PASS, database:CONT.DB,
                        multipleStatements: True
                      });
      }
    }
  }
  var TH=thread.current();
  if (TH) {
    var SRV=TH.SRV,C;
    gc(SRV.container("ADF"));
    gc(SRV.container("DOM"));
      SRV.PROC.MOD=Nil;
    origin.garbage();
  }
  return RES;
}

function _HTTPPut(PATH,TYIN,TYOUT,DATA,RET) {
  var ISOBJ=typeOf(MSG)!=str;
  console.log("Putting ",PATH,"<<",DATA,">>["+ISOBJ+"]");
  fs.writeFileSync(conf().WEB+'/'+PATH,DATA);
  RET(200,"text/html","","OK",False);
}
function _HTTPPost(PATH,TYIN,TYOUT,DATA,RET) {
  RET(404,"text/html","","<h1>Doesn't handle POSTs</h1>");
}
function _HTTPGet(PATH,TYIN,TYOUT,DATA,RET) {
  function rd(PATH,BIN,FUNC) {
    if (BIN) fs.readFile(PATH,FUNC);         else fs.readFile(PATH,'utf-8',FUNC);
  }
  function jixh(PROC,CLI) {
    var HTML='<meta charset="utf8">\n'+
             '<script src="/lib/jixlib.js"></script>\n',         _$=jxr(PROC.MOD,"_$"),
        BODY=jx$(_$)[sType]!="body";
    if (CLI) {
      HTML+='<script language=javascript>\n'+
            '  (async function () {\n'+
            '    server.CLI_SRV=await server("http://'+REQLOG.ADDR.address+':'+
                                                       REQLOG.ADDR.port+'",'+
                                                       CLI.IDSRV+');\n'+
            '  })();\n'+
            '</script>\n';
    }
    HTML+=(BODY?"<body>\n":"")+toHtml(jx$(_$))+(BODY?"\n</body>":"")+"\n";
    RET(200,"text/html","",HTML,False);
  }
  var BIN=False,
      REQLOG=_REQLOG,
      EXT=fileExt(REQLOG.PATHNAME);
  if (contains(["jpg","png","gif"],EXT)) BIN=True;
  var IDCLI;   if ((EXT=="jix" || EXT=="jxml") && isDefined(IDCLI)) {
    var CLI=server.getById(IDCLI);
    jixh(CLI.PROC,CLI);
  }
  else
  rd(conf().WEB+'/'+REQLOG.PATHNAME,BIN,function(ERR,DATA) {
    ;     if (ERR) {
      RET(404,"text/html","",'<h1>Page Not Found</h1>');
    }
    else { 
      var MIME="text/html", EXT=fileExt(REQLOG.PATHNAME);
      if (endsWith(REQLOG.PATHNAME,".css")) MIME="text/css";
      if (contains(["jpg","png","gif"],EXT)) MIME="image/"+(EXT=="jpg"?"jpeg":EXT);
      if (EXT=="jix" || EXT=="jxml") {         var FPATH=conf().WEB+'/'+REQLOG.PATHNAME,
            JSPATH=filePath(FPATH)+"/"+fileName(FPATH)+".js"
            JS=0;
        if (fileExists(JSPATH)) JS=1,DATA=fileRead(JSPATH); if (origin.DBGQUERY) console.log("===>(JS)",JS);
        var CLI=server.getById(_allocPhys().IDSRV);
        if (isUndefined(CLI)) error("server.start::createSession");
        CLI.container("ADF",1);
        CLI.container("DOM",1);
        REQLOG.IDCLI=CLI.IDSRV;
        (async function () {
          var PERSIST=False,
              PROC=await jixEvalMod(DATA,fileName(FPATH),JS,EXT);           for (var VAR of PROC.MOD.PARM) if (isContainer(jx$(VAR))) PERSIST=True;
          if (PERSIST) {
if (origin.DBGQUERY) console.log("Persisting ...");
            CLI.containers(True);
            CLI.PROC=PROC;
          }
          else CLI.close(),CLI=Nil;           jixh(PROC,CLI);
        })();
      }
      else RET(200,MIME,"",DATA,BIN);
    }
  });
}

if (SERVER) {
  http=require('http');
  timers=require('timers');
  APIDefault={ "_connect": _connect,
               "_close": _close,
               "_srvls": _srvls,
               "_fetchconts": _fetchconts,
               "_grep": _grep,
               "_syncobjs": _syncobjs,
               "_reboot": _reboot,
               "_submit": _submit
             };
  APIDefault[sy("put")]=_HTTPPut;
  APIDefault[sy("post")]=_HTTPPost;
  APIDefault[sy("get")]=_HTTPGet;
}
else {   var U=urlSelf();
  if (U.protocol=="file:") U=urlParse("http://localhost");
  var PATH=U.pathname,A=splitTrim(PATH,"/"),I=length(A)-1,HASWEB=False;
  if (endsWith(A[I],".html")) {
    I--;
    if (I>=0 && A[I]=="web") HASWEB=True,I--;
    var S="";
    for (var J=1;J<=I;J++) S+="/"+A[J];
    PATH=S;
  }
  U=urlParse(U.origin+PATH);
  server.APP_URL=U.href;
  server.WEB_URL=U.href+(HASWEB?"web":"");
}


origin.gserverId=function (SRV,RAW) {
  if (!isServer(SRV)) error("gserverId");
  return (RAW?"":"s:")+SRV.IDPHYS+":"+SRV.IDSRV;
}
origin.gserver=function (ID) {
  var A=splitTrim(ID,":"),
      [TAG,IDPHYS,IDSRV]=A;
  if (length(A)!=3 || TAG!="s" || IDPHYS!=server.root().IDPHYS) error("gserver");
  return server.getById(IDSRV);
}

origin.gcontainerId=function (CONT,RAW) {
  if (!isContainer(CONT)) error("gcontainerId");
  return (RAW?"":"c:")+gserverId(TH.SRV,1)+":"+CONT.IDCONT;
}
origin.gcontainer=function (ID) {
  var A=splitTrim(ID,":"),
      [TAG,IDPHYS,IDSRV,IDCONT]=A;
  if (length(A)!=4 || TAG!="c" || IDPHYS!=server.root().IDPHYS) error("gcontainer");
  return server.getById(IDSRV).CONT[IDCONT];
}

origin.gthreadId=function (TH,RAW) {
  if (!isThread(TH)) error("gthreadId");
  return (RAW?"":"th:")+gserverId(TH.SRV,1)+":"+TH.IDLOC;
}
origin.gthread=function (ID) {
  var A=splitTrim(ID,":"),
      [TAG,IDPHYS,IDSRV,IDLOC]=A;
  if (length(A)!=4 || TAG!="th" || IDPHYS!=server.root().IDPHYS) error("gthread");
  return server.getById(IDSRV).THREAD[IDLOC];
}

origin.gmethod=function (FNAME) {
  var F;
  if (isServer(this)) F=this.API[FNAME];
                 else F=typeOf(this).method(FNAME);
  return F;
}

origin.gobjId=function (O) {
  if (isUndefined(O.getId())) error("gobjId");
  return "o:"+gcontainerId(O.containerOf(),1)+":"+O.getId();
}
origin.gobj=function (ID) {
  var A=splitTrim(ID,":"),
      [TAG,IDPHYS,IDSRV,IDCONT,ID]=A;
  if (length(A)!=5 || TAG!="o" || IDPHYS!=server.root().IDPHYS) error("gobj");
  return server.getById(IDSRV).CONT[IDCONT].getById(ID);
}


function csvRawCheck(L) {
  if (!isArray(L)) return False;
  if (length(L)>0) {
    if (!isArray(L[0]) || length(L)==0) return False;
    var N=length(L[0]);
    for (var E of L) {
      if (!isArray(E) || length(E)!=N) return False;
      for (var S of E) if (!isString(S)) return False;
    }
  }
  return True;
}
function csvRawTrim(L) {
  function nempty(A) {
    var N=0;
    for (var I=length(A)-1;I>=0;I--) {
      if (trim(A[I])=="") N++;
                     else break;;
    }
    return N;
  }
  var N0=length(L[0]),
      N=nempty(L[0]);
  for (var I in L) {
    splice(L[I],N0-N,N,[]);
  }
  return L;
}
function csvParseRaw(S,TRIMQ) {
  function trimq(S) {
    if (TRIMQ) {
      S=S.toString();
      if (S[0]=='"') S=substring(S,1,length(S)-1);
    }
    return S;
  }
  csvparsefStart();
  var L=tokenize(S,1);
  var RES=[],LI=[],
      FIRST=True,VALPOS=True,
      N=length(L);
  for (var I=0;I<N;I++) {
    S=L[I];
    if (strIsBlank(S) && contains(S,"\n")) {
      if (!FIRST) {
        if (VALPOS) LI.push("");
        RES.push(LI),LI=[],FIRST=VALPOS=True;
      }
      continue;
    }
    FIRST=False;
    if (S==",") {
      if (VALPOS) LI.push(""); else VALPOS=True;
    }
    else {
      if (VALPOS) LI.push(trimq(S)),VALPOS=False;
             else if (empty(LI)) error("csvParseRaw(1)");
                            else LI[length(LI)-1]+=S;
    }
  }
  if (!empty(LI)) RES.push(LI);
  csvRawTrim(RES);
  if (!csvRawCheck(RES)) error("csvParseRaw(2)");
  return RES;
}
origin.csvLoadRaw=function (FNAME,TRIMQ) {
  var S=fileRead(FNAME);
  return csvParseRaw(S,TRIMQ);
}

origin.csvparsefStart=function () {
  charsInit(1);
  charnatSet("'",CharNatAlf);
  charnatSet(",",CharNatOmg);
  tokenizeStart(",");
  tokenizeSetFlags(0,Undefined,1,0);
}

var csvh=type(function (L,DESCR) {                 function proto(L) {
                  var P=["",[]];
                  if (!isArray(L) || isNil(L[0])) error("csvh.proto");
                  var A=splitTrim(L[0],"||");
                  if (length(A)!=2) error("csvh.proto(2)");
                  P[0]=A[0];
                  L[0]=A[1];
                  for (var I=0;I<length(L);I++) {
                    A=splitTrim(L[I],":");
                    var SLOT;
                    if (length(A)==1) SLOT=[A[0],"str"];
                    else
                    if (length(A)==2) SLOT=[A[0],A[1]];
                                 else error("csvh.proto(3)");
                    P[1].push(SLOT);
                  }
                  return P;
                }
                function atrim(A) {
                  return A.map(function (S) {
                    if (isString(S)) S=trim(S);
                    return S;
                  });
                }
                if (!csvRawCheck(L) || length(L)<=0) error("csvh(1)");
                var CSVH=csvh.create();
                var P=["",[]],ISFULL=contains(L[0][0],"||");
                if (ISFULL) P=proto(L[0]);
                CSVH.NAME=P[0];
                CSVH.TYPE=P[1];
                if (ISFULL) {
                  if (length(L)>1) {
                    for (var I=1;I<length(L);I++) {
                      var LANG;
                      if (contains(L[I][0],"||")) {
                        var A=splitTrim(L[I][0],"||");
                        LANG=A[0];
                        if (!mlstr.isLang(LANG) || length(A)!=2) error("csvh(2)");
                        L[I][0]=A[1];
                      }
                      else LANG="*";
                      if (isDefined(CSVH.TITLES[LANG])) error("csvh(3)");
                      CSVH.TITLES[LANG]=atrim(L[I]);                     }
                  }
                }
                else {
                  CSVH.TITLES["*"]=atrim(L[0]);
                  if (length(L)!=1) error("csvh(4)");
                }
                var RES;
                if (DESCR) RES=CSVH;
                      else RES=csvh.find(CSVH);
                if (RES==Nil) {
                  if (!ISFULL) error("csvh: "+pretty(CSVH.TITLES["*"])+" not found");
                  RES=CSVH;
                  csvh.$.push(RES);
                }
                return RES;
              },
              { "NAME":"csvh", "PARENT":obj,
                "ATTRS":["NAME=''",
                         "TYPE=Nil",
                         "TITLES={}"]
              });

csvh.$=[];
setprop(csvh,"find",function (L) {   if (!isCsvh(L)) L=csvh(L,1);
  var RES=Nil;
  for (var CSVH of csvh.$) if (CSVH.match(L)) RES=CSVH;
  return RES;
});
csvh.setMethod("match",function (L) {
  if (!isCsvh(L)) L=csvh(L,1);
  if (L.NAME!="" && this.NAME!=L.NAME) return False;
  function matcht(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I][0]!=L2[I][0] || L1[I][1]!=L2[I][1]) return False;
    return True;
  }
  function matchtit(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I]!=L2[I]) return False;
    return True;
  }
  if (length(L.TYPE)!=0) {
      if (matcht(this.TYPE,L.TYPE)) return True;
  }
  else {
    var LT=L.TITLES["*"];
    if (length(L.TITLES)!=1 || isUndefined(LT)) error("csvh.match(2)");
    for (var LANG in this.TITLES) {
      if (matchtit(this.TITLES[LANG],LT)) return True;
    }
  }
  return False;
});

function isCsvh(O) {
  return isa(O,csvh);
}

setprop(csvh,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME,1);
  return csvh(L);
});

var csv=type(function (L) {
               RES=csv.create();
               if (!isArray(L) || isNil(L[0])) error("csv");
               RES.CSVH=L.shift();
               RES.$=L;
               return RES;
             },
             { "NAME":"csv", "PARENT":obj,
               "ATTRS":["CSVH=Nil",
                        "RAW=True",
                        "$=[]"]
             });

function isCsv(O) {
  return isa(O,csv);
}

setprop(csv,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME,1);
  L[0]=csvh([L[0]]);
  return csv(L);
});
csv.setMethod("toSexpr",function () {
  if (!this.RAW) error("csv.toSexpr");
  var CSVH=this.CSVH,L=this.$,
      ATTRS,
      RES=[["type",":NAME",CSVH.NAME,":PARENT","obj",":ATTRS",ATTRS=["array"]]];
  for (var I=0;I<length(CSVH.TYPE);I++) {
    var NAME=CSVH.TYPE[I][0];
    if (!contains(NAME,".")) {
      var TY=CSVH.TYPE[I][1],
          DECL=NAME;
      if (TY!="obj") DECL+=":"+TY;
      ATTRS.push(DECL);
    }
  }
  for (var I=0;I<length(L);I++) {
    var O=[CSVH.NAME];
    for (var J=0;J<length(CSVH.TYPE);J++) {
      var VAR=CSVH.TYPE[J][0];
      if (VAR[0]==sId) VAR=substring(VAR,1,length(VAR));
      O.push(":"+VAR),O.push(L[I][J]);
    }
    O.push(":+o"),O.push(I+1);
    RES.push(O);
  }
  return RES;
});
csv.setMethod("toDb",function () {   return lsexprSerialize(this.toSexpr());
});

origin.csvparsef=function (S,CONT,TYPE) {   var L=csvParseRaw(S,1);
  L[0]=csvh([L[0]]);
  return parsef(csv(L).toSexpr(),CONT);
}

csv.serializeVal=function (O,TY) {
  if (isUndefined(O)) return "\u25cb";
  if (isNil(O)) return "\u00d8";
  if (isNumber(O)) return O.toString();
  if (isDate(O)) return "\u25f7"+(O.getTime()<1000000000000?"-0":O.getTime());
  if (isa0(O,Buffer)) return O.toString("hex");
  if (isString(O)) if (contains(O,",")) return '"'+O+'"';
                                   else return O;
  ;   return "\u00bf\u03be?";
};
origin.csvserializef=function (L,FNAME) {   startOutS(FNAME?2:0,FNAME);
  var TYPE=L[0],ATTRS=TYPE.attrs();
  for (var I=0;I<length(ATTRS);I++) {
    if (I>0) out(",");
        else out(TYPE.name(1)+"||");
    if (ATTRS[I].NAME==TYPE.KEYA) out(sId);
    out(ATTRS[I].NAME);
    var TY=ATTRS[I].TYPE,
        TYNAME=TY.name(1),
        Q=ATTRS[I].QUALIF;
    if (TY!=str || Q.has("*")) if (!TYNAME) error("serializef::type with no name");
                                       else out(":"+(Q.has("*")?"*":"")+TYNAME);   }
  cr();
  for (var I=1;I<length(L);I++) {
    for (var J=0;J<length(ATTRS);J++) {
      if (J>0) out(",");
      var VAL=L[I][ATTRS[J].NAME];
      out(csv.serializeVal(VAL,ATTRS[J].TYPE));
    }
    cr();
    if (FNAME) L[I]=Undefined;   }
  var RES=getOutS();
  stopOutS();
  return RES.join("");
}


declare({ sPO  :"\u03c9",              sIdx :"\u03b9",              sUpi :"\u03af",              sProx:"\u03e6",              sSelf:"\u00a7",              sId  :"\u2640" }); origin   .sUp  =sPO;         
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
    if (isDefined(_getUp(VAL))) error("_attachpo(4)");     VAL[sPO]=PROP;
  }
}
function _getUp(O,FULLREF,CLOSEST) {
  var REF=O[sPO];
  if (REF==Undefined) return REF;
   return FULLREF?REF:REF.OBJ;
  }

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

function _detach(O) {
  var PROP=_getUp(O,1);
  if (PROP) {
    if (isProppo(PROP)) _detachpo(PROP);
    if (isPropi(PROP)) _detachi(PROP);
  }
}

function proxy(O,HANDLER) {
  var RES=new Proxy(O,HANDLER);
  O[sProx]=RES;
  O[sSelf]=O;   return RES;
}

var arraypo=type(function (O,CONT) {
                   if (isContainer(O)) {
                     if (isDefined(CONT)) error("arraypo");
                     CONT=O,O=[];
                   }
                   if (isUndefined(O)) O=[];
                   var A=arraypo.create([],CONT);
                       PR=proxy(A,{ get:_getapo,
                                    set:_setapo });
                   for (var I of _keys(O)) PR[I]=O[I];                    return PR;
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
              ;
  return rmdupvals(RES);
}

function _copy(CONT,O,MODE) {
  if (isUndefined(MODE)) MODE="flat";
  var T=typeOf(O);
  if (isUnboxed(O) || isFunction(O) || isType(O)) return O;
  var ISARR=isArray(O);
  var O2=ISARR?[]:{};
  for (var N of _keys(O)) {
    var VAL=O[N],PO=False;
    if (!(ISARR && isNumStr(N))) PO=T.attrHas(N,">");
    var VAL2=VAL;
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("copy(!PO)::"+N);     if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL2=_copy(CONT,VAL,MODE);
    }
    O2[N]=VAL2;
  }
  return T(O2,CONT);
}

setprop(obj,"getUp",_getUp);
setprop(obj,"getpo",_getopo);
setprop(obj,"setpo",_setopo);
setprop(obj,"_keys",_keys);
setprop(obj,"_copy",_copy);
setprop(obj,"oflags",oflags);
setprop(obj,"proxy",proxy);


type(function (NAME,FNAME,CATEG,SRV) {
       var RES=container.create();
       RES.IDCONT=container.LASTIDCONT++;
       if (isString(NAME) && isString(FNAME)) {          if (!isString(CATEG)) SRV=CATEG,CATEG=FNAME,FNAME=NAME,NAME=Undefined;          RES.load(FNAME,CATEG);
       }
       else
       if (isContainer(NAME) || isContainer(FNAME)) {          var CONT=FNAME;
         if (isContainer(NAME)) CONT=NAME,NAME=Undefined,SRV=FNAME;
         else {
           if (!isString(NAME)) error("container.cons(1)");
           SRV=CATEG;
         }
         RES.setParent(CONT);
         error("container.derived(!Yet)");
       }
       else
       if (isUndefined(NAME) || isString(NAME) || isServer(NAME)) {          if (isServer(NAME)) SRV=NAME;
                        else SRV=FNAME;
       }
       else error("container.cons(2)");
       RES.NAME=NAME;
       if (isDefined(SRV)) {
         if (!isServer(SRV)) error("container.cons(3)");
         SRV.attach(RES);
       }
       return RES;
     },
     { "NAME":"container", "PARENT":obj,
       "ATTRS":["SRV",
                "IDCONT","PARENT",
                "NAME","FNAME=''",
                "LASTID=0","FULLIDS=0","LASTSTORED=Nil",
                "QMETHODS={}",
                "TYPES={}",
                "$={}"] });

container.LASTIDCONT=0; 
function isContainer(O) {
  return (typeof container!="undefined") && isa(O,container);
}
origin.isContainer=isContainer; 
container.setMethod("getById",function (ID) {
  return this.$[ID];
});
container.setMethod("parent",function () {
  return this.PARENT;
});
container.setMethod("setParent",function (CONT) {
  if (!isContainer(CONT)) error("setParent");
  this.PARENT=CONT;
});
container.setMethod("qmethod",function (NAME) {
  return this.QMETHODS[NAME];
});
container.setMethod("setQMethod",function (NAME,FUNC) {
  this.QMETHODS[NAME]=FUNC;
});
container.setMethod("types",function () {   return this.TYPES;
});
container.setMethod("typeAdd",async function (TYPE) {
  if (isDefined(this.TYPES[TYPE.NAME])) return;
  this.TYPES[TYPE.NAME]=TYPE;
});

declare({ SymbolCont:sy("^$"),
          SymbolId:sy("+o"),
          SymbolFlags:sy("%"),
          SymbolUp:sy("^"),
          SymbolTs:sy("t") });

obj.setMethod("containerOf",function () {
  return this[SymbolCont];
});
obj.setMethod("setContainerOf",function (CONT) {
  if (!isContainer(CONT)) error("setContainerOf");
  var OCONT=this.containerOf();
  if (OCONT && OCONT!=CONT) error("setContainerOf(2)");
  this[SymbolCont]=CONT;
});
obj.setMethod("getId",function () {
  return this[SymbolId];
});
obj.setMethod("setId",function (ID) {   var CONT=this.containerOf(),ID0=this.getId();
  if (ID0 && !isNil(CONT)) {
    delete CONT.$[ID0];
  }
  this[SymbolId]=ID;
  if (!isNil(CONT)) {
    if (!isUndefined(CONT.$[ID])) error("obj.setId");
    CONT.$[ID]=this;
  }
});
obj.setMethod("flags",function () {
  var F=this[SymbolFlags];
  if (isNil(F)) return set(""); else return F;
});
obj.setMethod("hasFlags",function (F) {
  return this.flags().has(F);
});
obj.setMethod("setFlags",function (FLAGS) {
  if (typeOf(FLAGS)==str) FLAGS=oflags(FLAGS);
  this[SymbolFlags]=FLAGS;
  if (this[SymbolFlags]=="") delete this[SymbolFlags];
});
obj.setMethod("addFlags",function (FLAGS) {
  this.setFlags(this.flags().union(FLAGS));
});
obj.setMethod("delFlags",function (FLAGS) {
  if (isDefined(this.flags())) this.setFlags(this.flags().minus(FLAGS));
});
obj.setMethod("up",function (FULLREF,CLOSEST) {
  return _getUp(this,FULLREF,CLOSEST);
});
obj.setMethod("detach",function () {
  _detach(this);
});

container.setMethod("newId",function () {
  while (this.getById(this.LASTID)) this.LASTID++;
  return this.LASTID++;  });
origin.sFullIdSep="#";
type.setMethod("name",function (SHORT) {
  var TYNAME=this.NAME;
  return SHORT && contains(TYNAME,".")?last(splitTrim(TYNAME,".")):TYNAME;
});
obj.setMethod("fullId",function (ID) {
  if (!ID && ID!=0 || contains(ID.toString(),sFullIdSep)) error("fullId::"+ID);
  var TY=typeOf(this).name(1);
  return TY+sFullIdSep+ID;
});
container.setMethod("fullIds",function (B) {
  this.FULLIDS=B;
});
container.setMethod("store",function (O,ID,FOP) {
  if (isUndefined(ID)) {
    if (isDefined(O[SymbolId])) ID=O[SymbolId];
                           else ID=this.newId();
  }
  var IDO=this.getById(ID);
  if (!FOP && isDefined(IDO) && IDO!=O) error("store<"+this.NAME+"::"+ID+">");
  O.setContainerOf(this);
  if (this.FULLIDS) ID=O.fullId(ID);
  O.setId(ID);
  this.LASTSTORED=O;
});

obj.setMethod("remove",function (NAME,N) {
  function rm(A,I) {
    var VAL=A[I];
    if (isBoxed(VAL) && VAL.up()==A) VAL.detach();
  }
  if (isArray(this) && isNumStr(NAME)) {
    if (isUndefined(N)) N=1;
    if (NAME<0 || NAME+N>length(this)) error("obj.remove");
    var M=N;
    while (M--) {
      rm(this,NAME);
      this.splice0(NAME,1);
    }
    for (var I=NAME;I<length(this);I++) {
      var VAL=this[I],UP;
      if (isBoxed(VAL)) UP=VAL.up(1);
      if (isDefined(UP)) UP.POS-=N;
    }
  }
  else {
    rm(this,NAME);
    delete this[NAME];
  }
});
obj.setMethod("cut",function (NAME,N) {   var NDEF=True,RES=[];
  if (isUndefined(N)) N=1,NDEF=False;
  if (isArray(this) && isNumStr(NAME)) {
    if (NAME<0 || NAME+N>length(this)) error("obj.cut");
    for (var I=NAME;I<NAME+N;I++) RES.push(this[NAME]);
  }
  else RES.push(this[NAME]);
  this.remove(NAME,N);
  return NDEF?RES:RES[0];
});

array.setMethod("splice0",array.method("splice"));
array.setMethod("insert",function (I,...VAL) {   if (!isNumStr(I)) error("array.insert");
  for (var J=0;J<length(VAL);J++) this.splice0(I,0,Undefined);
  var N=length(VAL);
  for (var J=I+N;J<length(this);J++) {
    var UP=this[J].up(1);
    if (isDefined(UP)) UP.POS+=N;
  }
  for (var J=0;J<length(VAL);J++) this[I+J]=VAL[J];
});
array.setMethod("push0",array.method("push"));
array.setMethod("push",function (VAL) {
  if (typeOf(A)==array) return this.push0(VAL);
  this.insert(length(this),VAL);
  return VAL;
});

array.setMethod("splice",function (I,N,...VAL) {
  if (typeOf(A)==array) return this.splice0(I,N,...VAL);
  if (isUndefined(N)) N=0;
  var RES=this.cut(I,N);
  this.insert(I,...VAL);
  return RES;
});

obj.setMethod("first",function () {
  if (isArray(this)) return this[0];
  else {
    if (!this.$) error("obj.first");
    return this.$[0];
  }
});
obj.setMethod("last",function () {
  if (isArray(this)) return this[length(this)-1];
  else {
    if (!this.$) error("obj.last");
    return this.$[length(this.$)-1];
  }
});

obj.setMethod("prev",function () {
  error("obj.prev (!Yet)");
});
obj.setMethod("next",function () {
  var UP=this.up(1);
  if (!UP || !isArray(UP.OBJ)) return Undefined;
  return UP.OBJ[UP.POS+1]; });

container.setMethod("copy",function (O,MODE) {   return _copy(this,O,MODE);
});
container.setMethod("move",function (O,MODE) {
  var RES=this.copy(O,MODE);
  O.delete(MODE);
  return RES;
});

container.setMethod("load",function (FNAME,CATEG) {
  FNAME=fnameNormalize(FNAME);
  if (!CATEG && contains(FNAME,".")) CATEG=fileExt(FNAME),FNAME=FNAME.split(".")[0];   FNAME=FNAME+(CATEG?"."+CATEG:"");
  if (isNil(this.FNAME) || this.FNAME!="") this.FNAME=FNAME;
                                      else ;  if (CATEG) {
    var S=fileRead(FNAME);
    if (CATEG=="db") {
      parsef(S,this,"lisp");
    }
    else
    if (CATEG=="csv") {
      csvparsef(S,this);
    }
    else error("container.load(2)");
    this.typeAdd(typeOf(this.LASTSTORED));
  }
  else {
    if (!fileIsDir(FNAME)) error("container.load(3)");
    var L=dirRead(FNAME),THIS=this;
    this.fullIds(1);     foreach_vfile(L,function (F) {
      if (!F.isDir) THIS.load(F.dir+"/"+F.fname);
    });
  }
});
container.setMethod("save",function () {   if (isNil(this.FNAME)) error("container.save");
  var L=[];
  for (N in this.$) L.push(this.$[N]);
  var S;
  if (fileExt(this.FNAME)=="db") {
    var S=serializef(L,[],"lisp");
  }
  else error("container.save(2)");
  fileWrite(this.FNAME,S+"\n");
});

container.query=type(function (VARS,OBJ) {
                  var RES=container.query.create();
                  if (isUndefined(OBJ)) OBJ=VARS,VARS=Undefined;
                  if (isUndefined(VARS)) VARS=["*"];
                  if (!isObject(OBJ)) error("container.query");
                  RES.VARS=VARS;
                  RES.QUERY=OBJ;
                  return RES;
                },
                { "NAME":"container.query", "PARENT":obj, "ATTRS":["VARS=[]","QUERY={}"] });

origin.isQuery=function (O) {
  return isa(O,container.query);
}

container.query.setMethod("match",function (O,Q) {
  if (isDefined(Q) || isAtom(O)) {
    if (isDefined(Q) && O==Q) return True;
    if (!isAtom(O)) return False;
    if (!isString(O)) O=str(O);
    if (!isString(Q)) error("query.match::str");
    return strMatch(O,Q[0]=="'"?substring(Q,1,length(Q)-1):Q);
  }
  if (!isObject(O)) return False;
  var RES=True;
  if (typeOf(this.QUERY)==array) {
    var CONT=O.containerOf();
    if (isDefined(CONT)) {
      var M=CONT.qmethod(this.QUERY[0]);
      if (isUndefined(M)) error("query.match::qmethod(1)");
      RES=M(O,...acopy(this.QUERY,1,length(this.QUERY)));
    }
    else error("query.match::qmethod(2)");
  }
  else {
    var KEYS=O.keys().concat([SymbolType]);
    for (VAR in this.QUERY) {
      if (VAR=="") VAR=SymbolType;
      if (!contains(KEYS,VAR)) { RES=False;break; }
      else {
        var QVAL=this.QUERY[VAR==SymbolType?"":VAR];
        if (VAR==SymbolType) QVAL=type.getByName(QVAL);
        if (!QVAL || !this.match(O[VAR],QVAL)) { RES=False;break; }
      }
    }
  }
  return RES;
});
container.setMethod("query",function (VARS,QUERY,FETCH) {
  if (typeOf(VARS)==obj || isQuery(VARS)) {
    FETCH=QUERY;
    QUERY=VARS;
    VARS=Undefined;
  }
  if (!isQuery(QUERY)) {
    QUERY=container.query(VARS,QUERY);
  }
  if (FETCH && isRemote(this.SRV)) {
    var THIS=this;
    return (async function () {
      var S=await THIS.SRV.call("_grep",[THIS.NAME,QUERY.QUERY]);
      return parse(S,THIS);
    })();
  }
  else
  if (typeOf(QUERY.QUERY)==array && QUERY.QUERY[0]=="!") {
    var TYPE=QUERY.QUERY[1],O=QUERY.QUERY[2];
    TYPE=type.getByName(TYPE);
    if (!isType(TYPE)) return [];
    return [TYPE(O,this)];
  }
  else {
    var L=[];
    for (var ID in this.$) {
      var O=this.$[ID];
      if (QUERY.match(O)) L.push(O);
    }

    return L;
  }
});

container.setMethod("open",function () {
});
container.setMethod("close",function () {
});

origin.isModified=function (O) {
  return O.hasFlags("m");
}
obj.setMethod("setModified",function (B) {
  if (isUndefined(B) || B) this.addFlags("m");
                      else this.delFlags("m");
});
obj.setMethod("getTs",function () {
  return this[SymbolTs];
});
obj.setMethod("setTs",function (TS) {
  return this[SymbolTs]=TS;
});
container.setMethod("sync",function (L,FORCE) {
  if (isUndefined(L)) L=this.$;
  else
  if (typeOf(L)!=array) {
    if (isAtom(L)) FORCE=L,L=this.$;
              else L=[L];
  }
  if (isUndefined(FORCE)) FORCE=False;
  if (isRemote(this.SRV)) {
    if (!FORCE) L=L.filter(isModified);
    for (var O of L) O.setModified(False);
    var PARMS=[this.NAME,serialize(L,"flat*")];
    return this.SRV.call("_syncobjs",PARMS);   }
  else
  if (isClient(this.SRV)) error("container.sync(Client !Yet)");
  else
  if (isLocal(this.SRV)) error("container.sync(Local !Yet)");
                    else error("container.sync");
});

container.getByObj=function (O2) {
  var CONT=O2.containerOf(),ID=O2.getId(),O;
  if (CONT || isUndefined(ID)) O=O2;
  if (isUndefined(O)) {
    var L=splitTrim(ID,"#");
    if (length(L)==3) L=[L[0],ID=L[1]+"#"+L[2]];     if (length(L)==2) {
      var CLI=server.currentClient();       if (CLI) CONT=server.getById(CLI.IDSRVPARENT).container(L[0]);
      ID=L[1];
      if (ID=="") ID=Undefined;
    }
    if (isDefined(CONT) && ID) O=CONT.getById(ID);
    else {
      CONT=jxdom();
      if (CONT) O=CONT.getById(ID);
      if (isUndefined(O)) {
        CONT=jxadf();
        if (isDefined(CONT)) O=CONT.getById(ID);
      }
      if (isUndefined(O)) error("container.getById");
    }
  }
  return [CONT,ID,O];
};
container.patcho=function (O2) {
  _normid(O2);
  var CONT,O,ID,
      L=container.getByObj(O2);
  CONT=L[0],ID=L[1],O=L[2];
  if (O==O2 && isDefined(ID)) return O;
  var TYPE=O2[""];
  if (isDefined(TYPE)) {
    TYPE=type.getByName(TYPE);
    if (TYPE) delete O2[""];
  }
  if (isUndefined(O)) {
    if (isUndefined(TYPE)) TYPE=obj;
    if (ID) error("container.patcho::ID");
    O=TYPE(O2,CONT);
  }
  else {
    Object.assign(O,O2);
    O.setModified();     if (CONT) container.write(O);
  }
  for (var VAR of Object.getOwnPropertyNames(O)) if (contains(VAR,".")) {     var VAL=O[VAR];
    delete O[VAR];
    O.setByPath(VAR,VAL);
  }
  return O;
};
var _CONTCOMMIT=[];
container.write=function (O) {
if (origin.DBGQUERY) console.log("container.write=> "+pretty(O));
  if (isUndefined(O)) _CONTCOMMIT=[];
                 else _CONTCOMMIT.push(O);
};
container.commit=function () {
  var LC=[];
  for (var O of _CONTCOMMIT) {
    var CONT=O.containerOf();
    if (!CONT) error("container.commit => "+pretty(O));
    if (!find(LC,CONT,1)) LC.push(CONT);
    if (!CONT._commits) CONT._commits=[];
    CONT._commits.push(O);
  }
  for (var CONT of LC) {
    var L=CONT._commits;
    delete CONT._commits;
    if (isMysql(CONT)) CONT.write(L);   }
  container.write();
};
container.patch=function (P) {
  var OBJ={};
  function rec(O) {
    _normid(O);
    for (var N in O) if (isBoxed(O[N])) {
      var ID=O[N].getId();
          OV=OBJ[ID];
      if (OV) O[N]=OV;
         else O[N]=rec(O[N]);
    }
    var ID=O.getId();
    O=container.patcho(O);
    if (ID) OBJ[ID]=O;
    return O;
  }
  var RES=rec(P);
  container.commit();
  return RES;
};

MEMORY=container("memory");
setprop(MEMORY,"store",function () {});


var _mysql;
if (SERVER) _mysql=require('mysql');

type(async function(URL,USER,PASS,DB,LOG) {
       if (isUndefined(URL) || isUndefined(USER) || isUndefined(PASS) || isUndefined(DB)) error("mysql");
       var RES=mysql.create({ ADDR:URL, USER:USER, PASS:PASS, DB:DB });
       RES.IDCONT=container.LASTIDCONT++;        RES.NAME=DB;
       RES.CON=_mysql.createPool({
                        host:URL, user:USER, password:PASS, database:DB,
                        multipleStatements: True
                      });
       RES.LOG=isNumber(LOG) || isString(LOG)?Number(LOG):isTrue(LOG)?1:0;
       await RES.types();
       return RES;
     },
     { NAME:"mysql", PARENT:container,
       ATTRS:["ADDR=''","CON=Nil",
              "USER=''","PASS=''",
              "DB","TYPES={}","LOG=False"] });

origin.isMysql=function (O) {
  return isa(O,mysql);
}

mysql.setMethod("close",function () {
  this.CON.end();
});

mysql.setMethod("escape",function (S) {
  S=this.CON.escape(S);
  if (S[0]=="'") S=substring(S,1,length(S)-1);
  return S;
});
mysql.setMethod("sql",async function (SQL) {
  var THIS=this;
  return new Promise((RETURN,REJECT) => {
    this.CON.getConnection(function (ERR,CON) {
      if (ERR) REJECT(ERR);
      else {
        if (THIS.LOG) console.log("mysql::sql ==> ",SQL);
        CON.query(SQL,function (ERR,RES) {
          if (ERR) REJECT(ERR);
          else {
            CON.release();
            RETURN(RES);
          }
        });
      }
    });
  });
});

mysql.setMethod("databases",async function () {   var L=await this.sql("SHOW DATABASES;"),RES=[];
  for (var DB of L) {
    var N=Object.getOwnPropertyNames(DB)[0];
    RES.push(DB[N]);
  }
  return RES;
});

mysql.setMethod("prettyType",async function (T) {
  if (isType(T)) {
    var SK={ "type":{ "short":{  "NAME":["av",""],
                                "ATTRS":["avi",""],
                                 "KEYA":["av",""]
                              }
                    },
             "addr":{ "short":{   "NAME":["av",""],
                                  "TYPE":["av",""],
                                "QUALIF":["av",""]
                              }
                    },
                "*":{ "short":{   "+o":["av",""],
                                "NAME":["av",""] }
                    }
           };
    out(pretty(T,"short",SK));   }
  else {
    out(T[0]),outIndentInc(+2);
    for (var I=1;I<length(T[1]);I++) {
      crIndent();
      out((T[1][I][2]?"1":"0")+" "+T[1][I][0]+" "+T[1][I][1]);
    }
    outIndentInc(-2);
  }
});
mysql.UNKNOWNT={};
mysql.setMethod("fetchType",async function (NAME) {
  function jixt(T) {
    if (startsWith(T,"bit")) return "num";
    if (startsWith(T,"int")) return "num";
    if (startsWith(T,"tinyint")) return "num";
    if (startsWith(T,"smallint")) return "num";
    if (startsWith(T,"bigint")) return "num";
    if (startsWith(T,"decimal")) return "num";
    if (startsWith(T,"text")) return "str";
    if (startsWith(T,"mediumtext")) return "str";
    if (startsWith(T,"char")) return "str";
    if (startsWith(T,"varchar")) return "str";
    if (startsWith(T,"enum")) return "str";
    if (startsWith(T,"set")) return "str";
    if (startsWith(T,"time")) return "date";
    if (startsWith(T,"date")) return "date";     if (startsWith(T,"datetime")) return "date";
    if (startsWith(T,"timestamp")) return "date";
    mysql.UNKNOWNT[T]=T;
    return "unknown";
  }
  var TYPE=await this.sql("SHOW COLUMNS FROM "+NAME+";"),RES=[];
  for (var D of TYPE) {
    var T=jixt(D.Type);
    RES.push([D.Field,T,D.Key=="PRI" && D.Extra=="auto_increment",D.Type]);
  }
  return RES;
});
mysql.setMethod("types",function () {
  var THIS=this;   function compt(NAME,SLOT) {
    var ATTRS=[],NK=0,KEYA;
    for (var A of SLOT) {
      if (A[2]) NK++,KEYA=A[0];
      ATTRS.push((A[2]?"k ":"")+A[0]+":"+(A[1]=="unknown"?"obj":A[1]));
    }
    var TY=type(Nil,{ NAME:"mysql."+THIS.DB+"."+NAME, ATTRS:ATTRS, KEYA:NK==1?KEYA:Nil });
    for (var S of SLOT) {
      var A=TY.attr(S[0]);
      if (!A) error("compt");
      A.DESCR=(S[1]=="unknown"?"?":"")+S[3];
    }
    return TY;
  }
  if (length(this.TYPES)==0) return (async function () {
    var TABLES=await THIS.sql("SHOW TABLES;");
    for (var T of TABLES) {
      var N=Object.getOwnPropertyNames(T)[0],
          TY=compt(T[N],await THIS.fetchType(T[N]));
      THIS.TYPES[T[N]]=TY;
    }
    return THIS.TYPES;
  })();
  else return this.TYPES;
});

mysql.setMethod("type",function (TYPE) {
  var RES;
  if (isType(TYPE)) {
    var TY=this.TYPES[TYPE.name(1)];
    if (isDefined(TY)) {
      RES=TY;     }
    else TYPE=TYPE.name(1);
  }
  if (!RES) {
    if (!isString(TYPE)) error("mysql::type(1)");
    RES=this.TYPES[TYPE];
    if (isUndefined(RES)) error("mysql::type(2) => ",TYPE);   }
  return RES;
});
mysql.setMethod("typeAdd",async function (TYPE) {
  if (isDefined(this.TYPES[TYPE.NAME])) return;
  function sqlt(T) {
    if (T==num) return "int";
    if (T==str || T==obj) return "varchar(256)";
    if (T==date) return "datetime";
    error("sqlt "+T.NAME);
  }
  function dflt(T) {
    if (T==num) return "0";
    if (T==str || T==obj) return "''";
    if (T==date) return Nil;
    error("dflt");
  }
  if (isNil(TYPE.KEYA)) error("mysql::typeAdd");
  var SQL="CREATE TABLE "+TYPE.name(1)+" (",
      ATTRS=TYPE.attrs(),FIRST=True;
  for (A of ATTRS) {
    SQL+=(FIRST?"":",")+"\n  "+
         A.NAME+" "+
         sqlt(A.TYPE);
    FIRST=False;
    if (A.NAME==TYPE.KEYA) {
      SQL+=" NOT NULL"+(A.TYPE==num?" AUTO_INCREMENT":"")+" PRIMARY KEY";
    }
    else {
      var VAL0=dflt(A.TYPE);
      SQL+=(VAL0?" DEFAULT "+VAL0:"")
    }
  }
  SQL+="\n);";
  await this.sql(SQL);
  this.TYPES[TYPE.NAME]=TYPE;
});

mysql.setMethod("sqlv",function (TY,A,V) {   function n2(I) {
    return (I<=9?"0":"")+I;
  }
  function sqlvd(UTS,TYA0) {
    if (TYA0!="date" && TYA0!="datetime") error("sqlvd");
    var D=new Date(UTS),
        RES=D.getFullYear()+"-"+n2(D.getMonth()+1)+"-"+n2(D.getDate());
    if (TYA0=="datetime") RES+=" "+n2(D.getHours())+":"
                                  +n2(D.getMinutes())+":"+n2(D.getSeconds());
    return (TYA0=="date"?"DATE":"TIMESTAMP")+"'"+RES+"'";
  }
  var TYA0=TY.attr(A),TYA=TYA0.TYPE;
  if (isNil(V)) V="";   if (TYA==str) return "'"+this.escape(V)+"'";
  if (TYA==num) {
    if (isBoolean(V)) V=V?"1":"0";
    if (TYA0.DESCR=="bit(1)") return "B'"+V.toString("hex")+"'";     if (isa0(V,Buffer)) return "'"+V.toString("hex")+"'";     V=V.toString();
    if (V=="") V="0";     if (contains(V,"%")) V="'"+V+"'";     else
    if (strNumberLength(V,0)!=length(V)) error("mysql::sqlv::not a num => "+V);
    return V;
  }
  if (TYA==date) {
    if (isDate(V)) V=V.getTime();
    else
    if (isNumber(V)) ;
    else
    if (V=="" || isString(V) && V=="\u00d8") return "null";
    else
    if (isString(V)) {
      if (strNumberLength(V,0)==length(V)) V=num(V);
      else
     V=new Date(V);     
    }
    return sqlvd(V,TYA0.DESCR);   }
  error("mysql::sqlv");
});
mysql.setMethod("read",async function (Q,RAW) {
  var TY,THIS=this;
  if (isString(Q)) TY=this.type(Q)
  else
  if (typeOf(Q)==container.query) TY=this.type(Q.QUERY[""]);
                             else error("mysql::read(1)");
  if (!RAW) RAW=isDefined(Q.QUERY["#raw"]);
  var TYNAME=TY.name(1),
      COLS=Q.QUERY[":"],
      SQL="SELECT "+(isString(COLS)?COLS:"*")+" FROM "+TYNAME;
  function cond(VAR,VAL) {
    var EQ="=";
    if (isString(VAL)) {
      var HASOP=(VAL[0]=="<" || VAL[0]==">" || VAL[0]=="=");       if (HASOP) {
        var EQ=VAL[0];
        if (VAL[1]=="=") EQ+=VAL[1];
        var V=substring(VAL,length(EQ),length(VAL));
        if (strNumberLength(V,0)!=length(V)) HASOP=0,EQ="=";
        else {
          VAL=V;
          if (EQ=="==") EQ="=";
        }
      }
      if (!HASOP && contains(VAL,"*")) {
        VAL=replaceAll(VAL,"*","%");
        EQ=" LIKE ";
      }
    }
    var RES=VAR+EQ+THIS.sqlv(TY,VAR,VAL);
    return RES;
  }
  var COND="",FIRST=1;
  for (var VAR in Q.QUERY) if (VAR!="" && !contains([":","#"],VAR[0])) {
    var VAL=Q.QUERY[VAR],ICOND="";
    if (isString(VAL) && VAL[0]=="$") ;                                  else ICOND=cond(VAR,VAL);
    COND+=(ICOND==""?"":" "+(FIRST?"":"AND "))+ICOND;
    if (ICOND!="") FIRST=0;
  }
  SQL+=(COND==""?"":" WHERE"+COND)+";";
  var RES=await this.sql(SQL);
  if (!RAW) RES=RES.map(function (REC) {
    if (THIS.LOG==2) console.log("mysql::read ==> ",REC);
    var O=TY(REC);
    if (isNil(TY.KEYA)) error("mysql::read[no key] ==> ",TYNAME);
    var ID=(TYNAME+"#")+O[TY.KEYA],
        O0=THIS.getById(ID);
    if (O0) O=O0;        else THIS.store(O,ID);
    return O;
  });
  return RES;
});

mysql.setMethod("write",async function (L) {
  var THIS=this;
  function ty(O) {     var TYPE=O[""];
    if (isUndefined(TYPE)) TYPE=typeOf(O);
    return THIS.type(TYPE);
  }
  var TODO={},TYPE={};
  for (var O of L) {
    var TY=ty(O),TY0,TYNAME=TY.name(1);
    if (isUndefined(TODO[TYNAME])) TODO[TYNAME]=[];
    TY0=TYPE[TYNAME];
    if (isUndefined(TY0)) TYPE[TYNAME]=TY;
                     else if (TY0!=TY) error("write(1)");
    TODO[TYNAME].push(O);
  }
  function fields(O,TYPE) {
    var L=TYPE.attrs().map(function (A) { return A.NAME; }),RES=[];
    for (var N of O.keys()) if (contains(L,N)) RES.push(N);
    return RES;
  }
  var SQLA={ ADD:"", MAJ:"" },
      SQLAO={ ADD:[], MAJ:[] };
  for (var TAB in TODO) for (var O of TODO[TAB]) {
    var F=fields(O,TYPE[TAB]).filter(function (A) {                                        var NTYA=TYPE[TAB].attr(A).DESCR;
                                       return 1;                                    }),
        V=F.map(function (A) { return THIS.sqlv(TYPE[TAB],A,O[A]); }),
        OD=F.map(function (A) { return A+"=VALUES("+A+")"; });
    var IDCOL=TYPE[TAB].KEYA;
    if (isNil(IDCOL)) error("write(2)");
    var SQL="INSERT INTO "+TAB+" ("+unsplit(F,",")+") VALUES ("+unsplit(V,",")+")";
    if (isDefined(O[IDCOL])) {
      SQL+=" ON DUPLICATE KEY UPDATE "+unsplit(OD,",");
    }
    SQL+=";\n";
    if (isDefined(O[IDCOL])) {
      SQLA.MAJ+=SQL;
      SQLAO.MAJ.push([IDCOL,O]);
    }
    else {
      SQLA.ADD+=SQL;
      SQLAO.ADD.push([IDCOL,O]);
    }
  }
  SQLA="SET autocommit=0;\nSTART TRANSACTION;\n"+SQLA.MAJ+SQLA.ADD+"COMMIT;\nSET autocommit=1;\n";
  console.log("===>(SQLA)",SQLA);
  return;
  var RES=await this.sql(SQLA),IDS=[];
  for (var R of RES) if (R.affectedRows>0) IDS.push(R.insertId);   var NMAJ=length(SQLAO.MAJ),
      NADD=length(SQLAO.ADD);
  if (length(IDS)!=NMAJ+NADD) error("write(3)");
  for (var I=NMAJ;I<NMAJ+NADD;I++) {
    var REC=SQLAO.ADD[I-NMAJ];
    REC[1][REC[0]]=IDS[I];
  }
});


origin.iniLoad=function (FNAME,MULTI) {   function rmc(L) {
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

origin.confInit=function (PROJ,EXEC) {
  _CONF={ "[cli]":{}, "CONT":[], "APP":[] };
  if (SERVER) {
    if (EXEC) _CONF.CWD=processCwd();
    _CONF.PROJ=isString(PROJ)?PROJ:filePath(fnameNormalize(process.argv[1]));
    if (fileName0(_CONF.PROJ)=="bin") _CONF.PROJ=filePath(_CONF.PROJ);     _CONF.LIB=_CONF.PROJ;
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
          if (strIsNum(A[1])) A[1]=eval(A[1]);           if (isUndefined(O[A[0]])) O[A[0]]=A[1];
          else {
            if (!isArray(O[A[0]])) O[A[0]]=[O[A[0]]];
            O[A[0]].push(A[1]);
          }
        }
      }
      rd(_CONF,L2);
      rd(_CONF["[cli]"],L3);
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

confInit(Nil,True);


var project=type(function (PATH,APPS,NOLINK) {
                   var RES=project.getBy("PATH",PATH);
                   if (RES==Nil) {
                     var RES=project.create();
                     RES.NAME=fileName(PATH);
                     RES.PATH=PATH;
                     if (!fileExists(PATH)) error("project()::Directory "+PATH+" does not exists");
                     if (!fileIsDir(PATH)) error("project()::File "+PATH+" is not a directory");
                     RES.CONF=confFetch(PATH);
                     project.$.push(RES);
                   }
                   return RES;
                 },
                 { "NAME":"project", "PARENT":obj,
                   "ATTRS":["NAME=''","PATH=''","CONF={}"] });

project.$=[];
setprop(project,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in project.$) if (project.$[I][NAME]==VAL) RES=project.$[I];
  return RES;
});

function isProject(O) {
  return isa(O,project);
}

setprop(project,"cwp",function () {
  return project.CWP;
});
setprop(project,"setCwp",function (PROJ) {
  if (isDefined(PROJ) && !isProject(PROJ)) error("project.setCwp");
  project.CWP=PROJ;
});

project.setMethod("toDb",function (FNAME) {
  var CSV=csv.load(FNAME),
      TXT=CSV.toDb();
  fileWrite(filePath(FNAME)+"/"+fileName(FNAME)+".db",TXT);
});
project.setMethod("toHtml",function (FNAME) {
  var S=fileRead(FNAME),
      TYRES=[],
      TXT=jxml.toHtml(S,TYRES);
  if (TYRES[0]!="html") error("project.toHtml::jxml=>js !Yet");
  fileWrite(filePath(FNAME)+"/"+fileName(FNAME)+".html",TXT);
});

function ffname(S,CONF,LOC) {
  if (CONF[LOC]!=CONF.PROJ) S=substring(CONF[LOC],length(CONF.PROJ)+1,
                                                  length(CONF[LOC]))+"/"+fileName0(S);
  return S;
}
project.setMethod("build",function (LWEIGHT) {
  if (LWEIGHT) {     var DATA=fs.readdirSync(this.CONF.DATA),
        WEB=fs.readdirSync(this.CONF.WEB);
    for (var FNAME of DATA) if (fileExt(FNAME)=="csvh") {
      out("Loading "+ffname(FNAME,this.CONF,"DATA")),cr();
      csvh.load(this.CONF.DATA+"/"+FNAME);
    }
    for (var FNAME of DATA) if (fileExt(FNAME)=="csv") {
      out("Generating "+fileName(ffname(FNAME,this.CONF,"DATA"))+".db ..."),cr();
      this.toDb(this.CONF.DATA+"/"+FNAME);
    }
    for (var FNAME of WEB) if (fileExt(FNAME)=="jxml") {
      out("Generating "+fileName(ffname(FNAME,this.CONF,"WEB"))+".html ..."),cr();
      this.toHtml(this.CONF.WEB+"/"+FNAME);
    }
  }
  else {} });

project.setMethod("release",function () {   var CONF=this.CONF,
      PROJ=fs.readdirSync(CONF.PROJ);
  function copy(FNAME) {
    out("Releasing "+FNAME+" ..."),cr();
    fileCopy(CONF.PROJ+"/"+FNAME,CONF.PROJ+"/release/"+FNAME,"binary");
  }
  if (fileExists(CONF.PROJ+"/release")) {
    if (!fileIsDir(CONF.PROJ+"/release")) error("File "+CONF.PROJ+"/release is not a directory");
  }
  else dirCreate(CONF.PROJ+"/release");
  if (contains(PROJ,"BOOT.ini")) copy("BOOT.ini");
  for (var FNAME of PROJ) if (fileExt(FNAME)=="js"
                            && !contains(["build","release"],fileName(FNAME))) copy(FNAME);
  for (var FNAME of PROJ) if (fileExt(FNAME)=="db") copy(FNAME);
  for (var FNAME of PROJ) if (contains(["html","css"],fileExt(FNAME))) copy(FNAME);
  for (var FNAME of PROJ) if (contains(["gif","png","jpg"],fileExt(FNAME))) copy(FNAME);
});

if (SERVER) {
  project.JIXPATH=env("JIX_HOME");   if (isDefined(project.JIXPATH)) project.JIXPROJ=project(project.JIXPATH);
}



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
origin.sAsync="\u00a1"; function isAsyncFunc(F) {
  if (isString(F)) F=findFunction(F,1);
  return (isFunction(F) || isPcodeFunc(F)) && F.QUALIF && contains(F.QUALIF,sAsync);
}
function isPcodeFunc(F) {
  return isObject(F) && F[sType]=="function";
}
var FUNCS={}; function createFunction(ENV,NAME,QUALIF,ATTRS,BODY) {
  var RES={ ENV:ENV, NAME:NAME, QUALIF:QUALIF, ATTRS:ATTRS, BODY:BODY, ENMAX:Undefined };
  RES[sType]="function";
  if (isString(NAME)) FUNCS[NAME]=RES;   return RES;
}
function findFunction(NAME,ALLFUNCS) {
  var RES=FUNCS[NAME];
  if (RES || !ALLFUNCS) return RES;
  RES=origin[NAME];   return isFunction(RES)?RES:Nil;
}
function inheritFuncs(F0,INHF) {   function ff(NAME) {
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
  LO.unshift(THIS$);   LO.unshift(SELF$);
  LO.push("_$");
  if (isUndefined(F0.BODY._$)) {
    F0.BODY._$=F$.BODY["_$"];
  }
  F0.BODY[sAord]=LO;
}
var ASYNCEXPR=False;
function compileFunction(E,NAME) {   if (!isArray(E) || E[0]!="function") error("compileFunction");
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
  if (ASYNCEXPR) RES.QUALIF+=sAsync;   ASYNCEXPR=OASYNCEXPR;
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
    var E=L[I],VAR=Undefined;
    if (isString(E) && I+1<N && L[I+1]=="=") {
      VAR=E;
      I+=2;
      E=L[I];
    }
    if (isObject(E) && E[0]=="import") {
      if (isDefined(VAR)) outd(VAR),cr(),error("compileBody::X=(import ...)");
      var FNAME=trim(E[1],'"');
      splice(L,I,1,parseSexpr(fileRead(FNAME),"lisp",1));       N=length(L),I--;
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
    if (startsWith(V,"$_.")) V="$_.$."+splitTrim(V,".")[1];     return V;
  }
  if (V[0]!="'" && V[0]!='"') {     var L=V.split(".");
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
  return V;   }
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
    if (N>1) (isDefined(L[1])?jscompScode:jscompScodeSelf)(BODY,L[1],LEV+1,MLEV,VAR,FLT,SPR);     if (N>2) out(","),jscompScode(BODY,L[2],LEV+1,MLEV,1);
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
  out("if (!"+VAR[0]+" || "+VAR[0]+".FUNC.FUNC.name!="+NAME+".name) {");   outIndentInc(+2);
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
      out((VAR[I]!="_$"?"var ":"")+VAR[I]+"=jxi("+VAR[0]+',"'+VAR[I]+'");');     }
  }
  if (CR) crIndent();   for (var I=0; I<N; I++) {
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
  out("})"),cr();
  var S=getOutS();
  stopOutS();
  if (isDefined(JS)) fileWrite(NAME+".js",S);
  return S;
}
jscomp.MODNO=0;

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
    if (isString(I)) I=Number(I);     I=String(I);
    if (I<10) I="0"+I;
    return I;
  }
  function val(V) {
    if (isNil(V)) V="";     if (isBoolean(V)) V=V?"1":"0";
    if (isa0(V,Buffer)) V=V.toString("hex");
    if (isDate(V)) V=V.getFullYear()+"-"+zpad(V.getMonth()+1)+"-"+zpad(V.getDate());
    return V.toString();
  }
  function rec(O) {     if (isAtom(O)) {
      out(val(O)+" ");
    }
    else {
      if (isHtmlTag(O[sType])) {
        out("<"+O[sType]),outIndentInc(+2);
        for (var ATTR in O) if (!contains([sType,sId,"+o","$"],ATTR)) {
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
origin.jixBodyMod=function (L,NAME) {   var BODY=compileBody([],0);
  compileLet(BODY,"_$S",Undefined,False,True);
  var RES=createFunction(Nil,NAME,"",[],BODY);
  envEnter(RES);
  compileBody(L,0,BODY);
  envLeave();
  return RES;
}
function jixProp(LW) {
  for (var E of LW) {
    while (E) {
      var V=jxr(E,"_$");
          if (V && isJxv(V)) V.TS=jixTime()-2;           E=E[SymbolUp];
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
      if (L[0]=="jxml") L.shift();     }
    else L=parseSexpr(S,"lisp",1);
    FUNC=jixBodyMod(L,NAME);
    S=jscomp(FUNC,NAME);
  }
  var MOD=eval(S.toString());
  return jixEvalMod0(MOD);
}

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
  if (E.MULTI) PARMS.splice(length(PARMS),0,...jx$(E.PARM[E.NP-1]));   return PARMS;
}
origin.jixRestart=function (E,PARMS,CURTS,ESTART) {
  function restart(TH,FIRST) {
      if (!FIRST && ESTART) jixEvalStart(1,TH);
    var NOW=jixTime();
    jixTick(CURTS);
    if (!PARMS) PARMS=jixEParms(E);
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
  if (isString(E)) {     var ADF=jxadf();
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

function jsfunc(NAME,FUNC) {
  var RES={ NAME:NAME, FUNC:FUNC };
  RES[sType]="jsfunc";
  return RES;
}

origin.nop=function () { }
origin.jxf=function (FUNC) { }
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
  function linkUp(V) {
      if (isJxv(V) && V.E) V.E[SymbolUp]=E;
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
origin.jxe=function (FUNC,PARM,MULTI) {   var NAME;
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
  if (ATTRS && ATTRS.$) for (NID of [sId,"+o"]) {     var ID=jx$(ATTRS.$[NID]);
    if (ID && !FID) FID=ID;
    delete ATTRS.$[NID];   }
  if (ATTRS && ATTRS.$) {     delete ATTRS.$["_s"];   }
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
  SK["*"]["short"]["FUNC"]=["-",""];   SK["*"]["short"]["$"]=["av",""];
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
  if (isNil(SELF)) return Undefined;
  var RES;
  if (ISPARM) {
    if (!SELF.MULTI || POS<SELF.NP-1) RES=SELF.PARM[POS];
    else {
      var L=SELF.PARM[SELF.NP-1].$;       RES=L[POS-SELF.NP+1];
    }
  }
  else RES=SELF.PARM[POS];
  return RES;
}
origin.jxae=function (SELF,POS) {
  if (isNil(SELF)) return Undefined;
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
origin._and=function (SELF,THIS,ATTRS,A,B) {   return jx$(A)&&jx$(B)?1:0;
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

origin.jxarr=function (SELF,THIS,ATTRS,...$) {   var RES=[];
  RES[sType]="jxarr";
  Object.assign(RES,$);
  return RES;
}
origin.jsobj=function (SELF,THIS,ATTRS,...$) {
  var RES={};
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
  if (!isNil(jx$(A))) V=jx$(A)[jx$(I)];   var TS;
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
  ;   return A0;
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
  O=O.replace(/"/g,"'");   return jxv0(O,Nil);
}
origin.JXO=0;
origin.jxobj=function (SELF,THIS,ATTRS,F,A,$) {   var RES,ID=jx$(A)["id"],SELF0=SELF;
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
    if (jx$($[I])) { RES=$[I+1];break; }
  }
  if (isUndefined(RES)) {
    if (N%2) RES=$[N-1];
    }
  return jxv0(jx$(RES),SELF,jixTime());
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
origin.map=function (SELF,L,ATTRS,F) {   SELF=jxe("map",[jxv({},"$_"),jxv(L,"L"),jxv(F,"F")]);
  L=jx$(L);
  F=jx$(F);
  var RES=L.map(function (O) { return jx$(F(Nil,Nil,{},O)); });
  return jxv0(RES,SELF,jixTime());
}
origin.database=function (SELF,THIS,ATTRS) {   var SRC=ATTRS["src"];
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
                       else return await DB.read(Q);     }
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
      if (!TH.NEXT) {         TH.NEXT=(async function(TH) {
          if (origin.DBGQUERY) console.log("query.next<"+jixTime()+">",Q);
          RES=await doq(DB,Q);
          SELF.PAYLOAD=RES;
                  SELF.STATE=jxLoaded;
          TH.WAITING=0;
          TH.NEXT=Nil;
          return TH.RESTART(TH);
        })(TH).then((X) => (nop(),X))
              .catch((error) => console.error("!!!===>",error));;
        SELF.STATE=jxWaiting;
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
  return jxv0(RES,SELF,jixTime()); }
origin.clog1=function (SELF,THIS,ATTRS,O) {
  console.log(jx$(O));
  return Nil;
}
origin.getId=function (SELF,THIS,ATTRS,O) {   var ID;
  O=jx$(O);
  if (O) {
    if (O[sId]) ID=O[sId];     if (O["+o"]) ID=O["+o"];
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
origin.println=function (SELF,THIS,ATTRS,...L) {   L=jx$(jxargs(arguments,ATTRS._s,2,L));
  for (var I=0; I<length(L); I++) {
    out(pretty(jx$(L[I])));
    if (I+1<length(L)) out(" ");
  }
  cr();
  return Nil;
}

function htmlt(T,A,$) {
  var RES={};
  RES[sType]=T;
  A=jx$(A);
  for (var N in A) RES[N]=jx$(A[N]);
  $=jx$($);
  RES.$=$.map(function (O) { return jx$(O); });
  return RES;
}
origin.htmle0=function (SELF,THIS,ATTRS,...$) {   return htmlt("div",ATTRS,$);
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
function arcs0(CX,CY,R,A0,A1) {   var P1=arcP(CX,CY,R,A0),
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


function event(TAG,TARGET,PAYLOAD) {
  this.TAG=TAG;
  this.TARGET=TARGET;
  this.PAYLOAD=PAYLOAD;
  this.X=this.Y=0;
}
var _LASTEVENT=null;

var KeyReturn=0x1000+13,
    KeyEscape=0x1000+27,
    KeyLeft  =0x1000+37,     KeyRight =0x1000+39,
    KeyDown  =0x1000+40,
    KeyUp    =0x1000+38,
    KeyClick =0x1000+200,
    KeyMove =0x1000+201;

var ASCII=[[],[]];
for (var I=0;I<=255;I++) ASCII[0][I]=ASCII[1][I]=null;
for (var I=65;I<=91;I++) ASCII[0][I]=I+32; for (var I=65;I<=91;I++) ASCII[1][I]=I;    ASCII[0][KeyReturn%0x1000]=ASCII[1][KeyReturn%0x1000]=KeyReturn;
ASCII[0][KeyEscape%0x1000]=ASCII[1][KeyEscape%0x1000]=KeyEscape;
ASCII[0][KeyLeft%0x1000]=ASCII[1][KeyLeft%0x1000]=KeyLeft;
ASCII[0][KeyRight%0x1000]=ASCII[1][KeyRight%0x1000]=KeyRight;
ASCII[0][KeyDown%0x1000]=ASCII[1][KeyDown%0x1000]=KeyDown;
ASCII[0][KeyUp%0x1000]=ASCII[1][KeyUp%0x1000]=KeyUp;
ASCII[0][KeyClick%0x1000]=ASCII[1][KeyClick%0x1000]=KeyClick;
ASCII[0][KeyMove%0x1000]=ASCII[1][KeyMove%0x1000]=KeyMove;

function keyboardGetAscii(SHIFT,CHAR,KEY) {
  if (CHAR!=0 && CHAR>=32) return CHAR;
                      else return ASCII[SHIFT?1:0][KEY];
}
function keyboardIsChar(KEY) {
  return KEY<0x1000;
}

function shift() { return _LASTEVENT.SHIFT; }
function ctrl() { return _LASTEVENT.CTRL; }
function alt() { return _LASTEVENT.ALT; }
function mouseX() { return _LASTEVENT.X; }
function mouseY() { return _LASTEVENT.Y; }

function keyToStr(KEY) {
  if (isString(KEY)) return KEY;
  if (keyboardIsChar(KEY)) return chr(KEY);
  switch (KEY) {
    case KeyReturn: return "return";
    case KeyEscape: return "escape";
    case KeyLeft: return "left";
    case KeyRight: return "right";
    case KeyDown: return "down";
    case KeyUp: return "up";
    case KeyClick: return "click";
    case KeyMove: return "move";
  }
  return Nil;
}
function strToKey(S) {
  if (!isString(S)) error("strToKey");
  if (length(S)==1) {
    var KEY=asc(S[0]);
    if (KEY==10) return KeyReturn;
    return KEY;
  }
  if (S=="return") return KeyReturn;
  if (S=="escape") return KeyEscape;
  if (S=="left") return KeyLeft;
  if (S=="right") return KeyRight;
  if (S=="down") return KeyDown;
  if (S=="up") return KeyUp;
  if (S=="click") return KeyClick;
  if (S=="move") return KeyMove;
  return Nil;
}


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
    var RES=dom.create();     if (TAG=="#text") {
      if (!isString(VAL)) error("dom.cons(1)");
      RES.nodeType=TEXT_NODE;
    }
    else {
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
          return document.createElement(TAG);
    }
  }
  (function () {
     var DIV=dom("div");
     DomElement=constructor(prototype(prototype(prototype(DIV))));      DomList=constructor(DIV.childNodes);
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
  if (SERVER) return Undefined;          else return document.getElementById(ID);
});
setprop(dom,"getByName",function (NAME) {
  if (SERVER) return [];          else return document.getElementsByTagName(NAME);
});
setprop(dom,"getElementsByClassName",function (CLASS) {
  if (SERVER) return [];          else return document.getElementsByClassName(CLASS);
});
setprop(dom,"root",function () {
  if (SERVER) return Undefined;          else return document.documentElement;
});
setprop(dom,"body",function () {
  if (SERVER) return Undefined;          else return document.body;
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
dom.setMethod("getv",function (NAME) {   if (isDomElement(this)) {
    var VAL=this.getAttribute(NAME);
    if (NAME in _BOOLATTRS) {
      return isNil(VAL)?"0":"1";
    }
    else return VAL;
  }
  return this[NAME];
});
dom.setMethod("setv",function (NAME,VAL) {   if (isDomElement(this)) {
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
  this.childNodes[SymbolUp]=this;   return this.childNodes;
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

setprop(dom,"log",function (LEVEL) {
  if (isUndefined(LEVEL)) return dom.LOGLEVEL;
  dom.LOGLEVEL=LEVEL;
});
setprop(dom,"bkt",function () {
  return dom.BACKTRACE;
});
dom.LOGLEVEL=0;
dom.BACKTRACE=[];

var _DOMFOCUS=Nil;
setprop(dom,"focussed",function () {
  return _DOMFOCUS;
});
setprop(dom,"focus",function (E) {
  E.focus();
  _DOMFOCUS=E;
});

var _SHIFT=False,_CTRL=False,_ALT=False;
setprop(dom,"event",function (EVT) {
  var TARGET=EVT.target;
  if (TARGET.tag()=="html") TARGET=dom.body();   var EVT2=new event(EVT.type,TARGET,EVT),EVT3=Nil;
  if (EVT.type=="keydown" || EVT.type=="keyup" || EVT.type=="keypress") {
    if (EVT.shiftKey!=Nil) _SHIFT=EVT.shiftKey;
    if (EVT.ctrlKey!=Nil) _CTRL=EVT.ctrlKey;
    if (EVT.altKey!=Nil) _ALT=EVT.altKey;
    EVT2.KEY=keyboardGetAscii(EVT.shiftKey,EVT.charCode,EVT.keyCode);
    EVT2.SCANCODE=EVT.keyCode;
    if (EVT.type=="keydown" && EVT2.KEY!=Nil
     && EVT.keyIdentifier!=Nil && EVT.keyIdentifier.substring(0,2)!="U+") {       EVT3=new event("keypress",TARGET,EVT);
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
    EVT2.X=0;     EVT2.Y=0;   }
  EVT2.SHIFT=_SHIFT;
  EVT2.CTRL=_CTRL;
  EVT2.ALT=_ALT;
  if (EVT3!=Nil) return EVT3;
  if (EVT2.TAG=="keyup"
   || EVT2.TAG=="keydown" && (keyboardIsChar(EVT2.KEY) || EVT2.KEY==KeyReturn)) return Nil;
  if (EVT2.TAG=="keydown") EVT2.TAG="keypress";
  return EVT2;
});

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
    case "load": return "^";     case "add": return "^";
    case "mode": return "^";
    case "alert": return "^";
    case "save": return "";
    case "focus": return "_^";     default: return "_^";   }
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
  var A=ACTION.split("!");   ACTION=A[0];
  if (length(A)>1) PARM=A[1];
  if (PARM=="") PARM=dom.defaultParm(ACTION);
  switch (PARM) {
    case "$": return THIS;
    case "*": return THIS.collect();
    case "^": return evalObj(TARGET,THIS);
    case "_^": return TARGET;
    case "$t": return DOMT++;
    case "": return Nil;
    default: return PARM;   }
});
setprop(dom,"propagate",function (EVT) {   EVT=dom.event(EVT);
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
  _LASTEVENT=EVT;   ACTION=ACTION[1];
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
         for (var I in ACTION) {
        var FN=dom.evalFn(ACTION[I]);
        if (isFunction(TARGETA[FN])) {
          TARGETA[FN](dom.evalParm(ACTION[I],PARM,TARGET,EVT.TARGET));
        }
        else
        if (FIRST) error("dom.propagate(2)");
              else doit(TGTS[dom.evalFn(ACTION[I],1)],[dom.evalFn(ACTION[I],1)]);
        FIRST=0;
      }
    }
  }
  doit(TARGETA,ACTION);
});

dom.setMethod("collect",function () {
  var RES={},N=0,W0=this;
  function traverse(W) {
    if (isDomTextNode(W) || W.tag()=="form" && W!=W0) return;
    var TY;
    if (isDomElement(W) && W.tag()=="input" && contains(["hidden","text","date","radio","checkbox"],TY=W.getv("type"))) {
      var NAME=W.getv("name"),VALUE=W["value"];
      if (isNil(NAME)) NAME="in"+N,N++;       if (!startsWith(NAME,"-")) {
        if (isNil(VALUE)) VALUE="";
        if (TY=="checkbox") RES[NAME]=W.checked;
        else
        if (TY!="radio" || W["checked"]) RES[NAME]=VALUE;
      }
    }
    for (var I=0;I<length(W.$);I++) traverse(W.$[I]);
  }
  traverse(this);
  if ("msg" in this.attributes) {     var VAR=this.getv("msg");
    if (VAR[0]!="$") error("dom.load::msg");
    VAR=substring(VAR,1,length(VAR));
    RES=RES[VAR];
  }
  return RES;
});
setprop(dom,"patch",function (HTML) {
  var DIV=dom(startsWith(HTML,"<tr") || startsWith(HTML,"<td")?"tbody":"div");   DIV.innerHTML=HTML;
  var ELT=DIV.$[0];
  if (isUndefined(ELT)) return;   var ID=ELT.getv("id");
  if (isUndefined(ID)) return;
  ELT=dom.getById(ID);
  if (isUndefined(ELT)) return;
  ELT.up().replaceChild(DIV.$[0],dom.getById(ID));
});

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
dom.setMethod("load",function (VAL) {   if (!isString(VAL) && !isNumStr(VAL)) return;   if (isString(VAL)) {
    if (length(VAL)==0) return;
    if (VAL[0]=="{") { ldo(this,parse(VAL)[0]);return; }
  }
  if ("value" in this.attributes) this.setv("value",VAL.toString());
                             else this.innerHTML=VAL;
});
dom.setMethod("focus_",function () {
  if (this.hasClass("tab")) this.tabFocus(); });

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

type(Nil,
     { NAME:"domext", PARENT:obj, ATTRS:[] });

setprop(domext,"getById",function (ID) {
  var RES;
  if (isNil(ID)) ;
  else
  if (SERVER) ;   else {
    RES=dom.getById(ID);
    if (!RES) RES=domext({}),RES["id"]=ID;   }
  return RES;
});

setprop(domext,"submit",function (ID,ATTRS) {
  ;   thread(server.CLI_SRV,async function () {     var HTML=await server.CLI_SRV.call("_submit",{ METHOD:"POST", ACCEPT:"text/html" },[ID,ATTRS]);
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

if (!SERVER) {
  document.addEventListener("keyup",dom.propagate,false);
  document.addEventListener("keydown",dom.propagate,false);
  document.addEventListener("keypress",dom.propagate,false);
  document.addEventListener("click",dom.propagate,false);
}


origin.start=function (NOTNOW) {
  var PORT=conf().PORT || 80,
      SRV=server(PORT);

  for (var C of conf().CONT) {
    out("Loading "+C[0]),cr();
    container(C[0],conf().DATA+"/"+C[0],"db",SRV);
  }
  for (var MOD of conf().APP) {
    var JS=conf().PROJ+"/"+MOD,
        SRC=fileRead(JS).toString();
    out("Loading "+JS),cr();
    eval(SRC);
  }
  for (var C of conf().CONT) {
    var CONT=SRV.container(C[0]);
    for (FNAME of C[1]) {
      out("Setting method "+FNAME+"() of "+C[0]),cr();
      CONT.setQMethod(FNAME,origin[FNAME]);
    }
  }

  if (NOTNOW) return SRV;   out("Server started on port "+PORT+"...\n");
  SRV.start();
}

origin.stop=function () {
  error("stop !Yet");
}


 

 
 
 
 
 
   
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

function installOnload(f) {
  var oldf=window.onload;
  if (typeof oldf!='function') window.onload=f;
  else {
    window.onload=function() {
      oldf();
      f();
    }
  }
}
