/*
 * sessions.js
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

// Servers
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

// Containers
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

// Threads
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

// Methods
origin.gmethod=function (FNAME) {
  var F;
  if (isServer(this)) F=this.API[FNAME];
                 else F=typeOf(this).method(FNAME);
  return F;
}

// Objects
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
