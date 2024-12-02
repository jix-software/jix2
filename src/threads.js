/*
 * threads.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019, 2020, 2021.
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

// Threads
type(function (SRV,ROOT,GID) {
       var RES=thread.create();
       RES.ID=thread.LASTID++;
       if (isNil(SRV)) error("thread.cons(1)");
       RES.SRV=SRV; // TODO: insert RES into SRV
       RES.STATE=thread.Ready;
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
thread.LASTID=0; // FIXME: implement classes that remember their instances, and let thread be one such class

thread.None=0;
thread.Ready=1; // Scheduled (pour les steps)
thread.Running=2;
//thread.Waiting=3; probably unnecessary
thread.Finished=4;
thread.Error=5;

thread.TRACE=0;

setprop(thread,"getById",function (ID) {
  return thread.$[ID];
});

origin.isThread=function (O) {
  return isa(O,thread);
}

// Current
thread.CURRENT=Nil;
setprop(thread,"current",function (TH) {
  if (isUndefined(TH)) return thread.CURRENT;
  else {
    if (!isNil(thread.CURRENT) && !isNil(TH)) error("thread.current");
    thread.CURRENT=TH;
  }
});

// Steps
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

// step
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

// step
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

// next
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
