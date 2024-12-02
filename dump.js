/*
 * dump.js
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

require("./lib/jixlib.js");
dl=require("./dumplib.js");

// Config file
function config(CMD,CONT) {
  if (CMD.dump) {
    var COLUMNS=CMD.dump.COLUMNS;
    if (COLUMNS && contains(COLUMNS,"*")) CMD.dump.COLUMNS=dl.types(CONT);
    var DATA=CMD.dump.DATA,D2={},TAB,CTAB,INQUERY;
    if (DATA) {
      function stq() {
        if (INQUERY) if (!CTAB) error("dump::stq");
                           else D2[CTAB].QUERY=INQUERY,INQUERY=Nil;
      }
      for (var I in DATA) {
        var S=DATA[I];
        if (S=="") continue; // FIXME: there should be no empty strings (e.g. due to comments)
        if (S=="<<") { INQUERY=[];continue; } // TODO: make operator prefix containing "=" work (prevent these kinds of "=" to be considered as being part of the syntax in iniLoad())
        if (endsWith(S,":") || S==";;") stq();
        if (S==";;") { TAB=Undefined;continue; } // TODO: improve this syntax with ";;" as a query terminator
        if (INQUERY) INQUERY.push(S);
        else
        if (endsWith(S,":") || !TAB) {
          if (S==":") error("dump::data"); // TODO: put nice error messages
          if (endsWith(S,":")) {
            S=substring(S,0,length(S)-1);
            TAB=S;
          }
          CTAB=S;
          if (D2[S]) error("dump::data(2)");
          D2[S]=[];
        }
        else D2[TAB].push(S); // TODO: accept the syntax "*" as meaning "all columns"
      }
      stq();
      CMD.dump.DATA=D2; // TODO: preserve columns order, & check that the columns actually exist
      for (var I in D2) {
        if (empty(D2[I])) {
          var Q=D2[I].QUERY;
          if (isUndefined(CONT.types()[I])) error("Table "+I+" not found");
          D2[I]=CONT.types()[I].attrs().map(function (A) { return A.NAME; });
          D2[I].QUERY=Q;
        }
        var Q=D2[I].QUERY;
        if (Q) {
          var Q2={ "":I };
          for (var J=0;J<length(Q);J+=2) {
            Q2[Q[J]]=Q[J+1];
          }
          D2[I].QUERY=Q2;
        }
      }
    }
  }
  return CMD;
}

// Main
async function dump() {
  var FSELF=filePath(__filename),DIRDEST,
      FNAME=process.argv[2]?process.argv[2]:"DUMP",
      CMD=fnameNormalize(fnameIsAbsPath(FNAME)?FNAME:FSELF+"/"+FNAME);

  if (!fileExists(CMD)) {
    if (!process.argv[2]) {
      FNAME="DUMP.ini";
      CMD=fnameNormalize(FSELF+"/"+FNAME);
    }
    if (!fileExists(CMD)) error("File "+CMD+" not found");
  }
  var ERRDIRDEST;
  if (fileIsDir(CMD)) {
    var D=dirRead(CMD,"*",1),INI;
    for (var I in D.val) if (strMatch(D.val[I].fname,"*.ini")) {
      INI=D.val[I].dir+"/"+D.val[I].fname;
      break;
    }
    if (!INI) error("Ini file not found in "+CMD);
    CMD=INI;
    for (var I in D.val) if (D.val[I].isDir && length(D.val[I].val)==0) {
      DIRDEST=D.val[I].dir+"/"+D.val[I].fname;
      break;
    }
    if (!DIRDEST) ERRDIRDEST="Empty dir not found in "+D.dir+"/"+D.fname;
  /*console.log(CMD);
    console.log(DIRDEST);*/
  //stop();
  }
  if (!fileExists(CMD)) error("File "+CMD+" not found");

  CMD=iniLoad(CMD,["COLUMNS","DATA"]);
  CMD.auth.PASS=CMD.auth.PASS.toString();
/*console.log(CMD);
  console.log(CMD.dump.DATA);*/
  var LOG=0;
  if (CMD[""] && CMD[""]["LOG"]) LOG=CMD[""].LOG;
  var CONT=await dl.open(CMD.src.URL,CMD.src.DB,CMD.auth.USER,CMD.auth.PASS,LOG);
  config(CMD,CONT);

  var FS=sy("FS"),STDOUT=sy("STDOUT"),BACKUP=sy("BACKUP"),
      DEST={ URL:FS, DB:STDOUT };

  if ((!CMD.dest || !CMD.dest.DB) && (DIRDEST || ERRDIRDEST)) CMD.dest={ DB:BACKUP }; // FIXME: spaghetti here
  if (CMD.dest) {
    if (CMD.dest.URL) {
      DEST.URL=CMD.dest.URL;
      if (CMD.src.URL) error("!(src.URL and dest.URL)");
      if (!CMD.dest.DB) error("dest.DB expected");
      DEST.DB=CMD.dest.DB;
    }
    else
    if (CMD.dest.DB && CMD.dest.DB!="_") {
      if (CMD.dest.DB!=BACKUP) {
        DEST.DB=CMD.dest.DB;
        if (!CMD.src.URL && CMD.src.DB==DEST.DB) error("src.DB==dest.DB");
        var FDEST=FSELF+"/"+DEST.DB;
        if (!DIRDEST) DIRDEST=FDEST;
        if (!fileExists(FDEST)) error("File "+FDEST+" not found");
        if (!fileIsDir(FDEST)) error(FDEST+" is not a directory");
      }
      else DEST.DB=BACKUP;
    }
    else
    if (CMD.dest.DB) ERRDIRDEST=Undefined;
  }
  if (ERRDIRDEST) error(ERRDIRDEST);

  var WROTE,SCHEMA;
  if (CMD.dump.TABLES) {
    if (DIRDEST) startOutS();
    out("§tables"),cr();
    for (var S of dl.types(CONT)) out(S),cr();
    if (DIRDEST) SCHEMA=getOutS(),stopOutS();
    WROTE=1;
  }

  var L=CMD.dump.COLUMNS;
  if (L && (DEST.DB==STDOUT || DIRDEST)) {
    if (DIRDEST) startOutS();
    if (WROTE) out("---"),cr();
    if (contains(L,"*")) L=dl.types(CONT); // Already done in config()
    var L2=[];
    for (var TY of L) L2.push(CONT.types()[TY]);
    L=L2;
    for (var I=0;I<length(L);I++) {
      var TY=L[I];
      out("§"+TY.name(1)),cr();
      for (var A of TY.attrs()) {
        out((TY.KEYA && TY.KEYA==A.NAME?sId:"")+A.NAME+" "
                                               +(A.QUALIF.has("*")?"*":"")
                                               +A.TYPE.NAME
                                               +(A.DESCR?" "+A.DESCR:"")),cr();
      }
      if (I+1<length(L)) cr();
    }
    if (DIRDEST) SCHEMA=(SCHEMA?SCHEMA:"")+getOutS(),stopOutS();
    WROTE=1;
  }

  if (SCHEMA) {
    fileWrite(DIRDEST+"/"+CMD.src.DB+".txt",SCHEMA);
  }

  if (CMD.dump) {
    if (CMD.dump.DATA) {
      var CONT2;
      if (DEST.URL!=FS) {
        var CONT2=await dl.open(DEST.URL,DEST.DB,CMD.auth.USER,CMD.auth.PASS,LOG),
            TYPES=CONT.types();
        for (var N in TYPES) {
          if (!CONT2.types()[N]) await CONT2.typeAdd(TYPES[N]);
        }
      }
      if (WROTE && DEST.DB==STDOUT) out("---"),cr();
      var I=0;
      for (var TY in CMD.dump.DATA) {
        out("§"+TY),cr();
        var Q=CMD.dump.DATA[TY].QUERY;
        if (!Q) Q={ "":TY };
        var L=await dl.read(CONT,Q,1);
        if (DEST.URL==FS) {
          if (DEST.DB==STDOUT) {
            for (var O of L) {
              var TY=typeOf(O).name(1);
              out(dl.fmt(O,CMD.dump.DATA[TY])),cr();
            }
            if (I+1<length(CMD.dump.DATA)) cr();
          }
          else { // TODO: reunify this with container.save(), and add possibility to filter columns by type
            if (!DIRDEST) error("DEST=FS, no DIRDEST"); // Should never happen //DIRDEST=FSELF+"/"+DEST.DB;
            var FDEST=DIRDEST+"/"+TY+".csv",
                TYPES=CONT.types();
            if (!TYPES[TY]) error("Type "+TY+" doesn't exists in "+CONT.NAME);
            L.unshift(TYPES[TY]);
          /*var S=*/csvserializef(L,FDEST);
          //fileWrite(FDEST,S);
            if (global.gc) /*console.log("Garbaging ..."),*/global.gc();
                    //else console.log("No garbage !");
          }
        }
        else {
          await dl.write(CONT2,L);
        }
        I++;
      }
      if (CONT2) dl.close(CONT2);
    }
  }
  dl.close(CONT);
}
async function main(REPEAT) {
  errorCatch(1);
  consoleRepeat(async function () {
    try {
      await dump();
    }
    catch (E) {
      if (E && E!="") out("Error::"+E),cr();
    }
    if (REPEAT>0) out("-- Press Enter"+(REPEAT<=1?"":" to continue, Control-C to exit")+" --");
  },
   REPEAT);
}
main(0);
