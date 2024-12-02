/*
 * launch.c
 *
 * Copyright (C) 2016, 2017  Sebastian Heimpel and Henri Lesourd
 * Copyright (C) 2019, 2020  Henri Lesourd
 *
 *  Code extracted from hilite.js.
 *
 */

#include "util.c"

int main(int argc,char **argv) {
  char *prog=whereami();
  char *js=fname(prog);
  if (uendsWith(js,".exe")) js[strlen(js)-4]=0;
  js=stradd(js,".js");
  int dbg=argvFind(argc,argv,"-dbg");
  if (dbg!=-1) argvRemove(&argc,argv,dbg);
  char *cmd=nodeCmd(prog,js,argc,argv);
  if (dbg!=-1) printf("Launching << %s >>\n",cmd);
  int res=system(cmd);
  exit2(res,0);
  return 0; // Not reached
}
