/*
 * dumplib.js
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

async function open(URL,DB,USER,PASS,LOG) {
  if (!URL || URL==".") {
    var RES=container(DB); // TODO: process DB in case it's an absolute path ; better it to be resolved /before/
    RES.load(process.cwd()+"/"+DB);
    return RES;
  }
  else return await mysql(URL,USER,PASS,DB,LOG);
}
function types(CONT) {
  var RES=[];
  for (var NAME in CONT.types()) RES.push(NAME);
  return RES;
}

async function read(CONT,QUERY,RAW) {
  if (isMysql(CONT)) return await CONT.read(container.query(QUERY),RAW);
                else return CONT.query(QUERY);
}
function fmt(O,ATTRS) {
  var L;
  if (isNil(ATTRS) || ATTRS=="*") L=Object.getOwnPropertyNames(O);
  else
  if (isString(ATTRS)) L=splitTrim(ATTRS," ");
  else
  if (isArray(ATTRS)) L=ATTRS;
                 else error("dumplib::fmt");
  var RES={};
  for (var N of L) RES[N]=O[N];
  return pretty(RES);
}

async function write(CONT,L) { // TODO: implement fmt() as a filter for write() too (problem is: L is multitype)
  if (isMysql(CONT)) return await CONT.write(L);
                else error("!mysql.write !Yet"); // TODO: implement this one
}

function close(CONT) {
  CONT.close();
}

module.exports={
  open: open,
  types: types,
  read: read,
  fmt: fmt,
  write: write,
  close: close
};
