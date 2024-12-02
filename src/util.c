/*
 * util.c
 *
 * Copyright (C) 2016, 2017  Sebastian Heimpel and Henri Lesourd
 * Copyright (C) 2019, 2020  Henri Lesourd
 *
 *  Code extracted from hilite.js.
 *
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include "detect_os.h"

// Error
static int exitWait=0;
void exit2(int res,int cr) {
  if (exitWait) printf("-- Press Enter --"),getchar();
           else if (cr) printf("\n");
  exit(res);
}
void error(char *msg) {
  printf("%s\n",msg),fflush(stdout);
  exit2(1,0);
}

// Strings
int ucase(int c) {
  if (c>='a' && c<='z') c-='a',c+='A';
  return c;
}
int strucmp(char *s1,char *s2) {
  while (*s1 && *s2) {
    if (ucase(*s1)!=ucase(*s2)) break;
    s1++,s2++;
  }
  if (*s1 || *s2) return 1;
             else return 0;
}
int uendsWith(char *s,char *end) {
  int ls=strlen(s),le=strlen(end);
  if (le>ls) return 0;
  s+=ls-le;
  return !strucmp(s,end);
}
char *strdup2(char *s) {
  char *res=(char*)malloc(strlen(s)+1);
  strcpy(res,s);
  return res;
}
char *stradda(char *s1,...) {
  char **ptr=&s1;
  int len=0,n=0;
  while (*ptr) len+=strlen(*ptr),n++,ptr++;
  ptr=&s1;
  char *res=(char*)malloc(len+1);
  *res=0;
  while (n--) {
    strcat(res,*ptr);
    ptr++;
  }
  return res;
}
char *stradd(char *s1,char *s2) {
  return stradda(s1,s2,NULL);
}

// Files
int fexists(char *pathname) {
  FILE *F=fopen(pathname,"r");
  if (F==NULL) return 0;
  else {
    fclose(F);
    return 1;
  }
}
int fisdir(char *pathname) {
  struct stat ST;
  int res;
  res=stat(pathname,&ST);
  if (res!=0) return 0;
  return S_ISDIR(ST.st_mode)!=0;
}
char *fname(char *path) {
  int n=strlen(path),i;
  for (i=0;i<n;i++) if (path[i]=='\\') path[i]='/';
  while (n>0) {
    if (path[n]=='/') break;
    n--;
  }
  char *s=path+n;
  if (*s=='/') s++;
  s=strdup2(s);
  if (n) path[n]=0; // FIXME: shitty semantics
  return s;
}

// whereami()
#include "whereami.c"

// Argvs
void argvRemove(int *argc,char **argv,int j) {
  for (int i=j;i+1<*argc;i++) {
    argv[i]=argv[i+1];
  }
  (*argc)--;
}
int argvFind(int argc,char **argv,char *s) {
  for (int i=0;i<argc;i++) {
    if (!strcmp(argv[i],s)) return i;
  }
  return -1;
}

// Node.js
char *ldirs[9]={ "",
                 "C:/Node", "C:/Program Files/Node",
                 "D:/Node", "D:/Program Files/Node",
                 "E:/Node", "E:/Program Files/Node",
                 "/usr/bin", NULL };
char *localNode(char *path) {
  char *s=(char*)malloc(strlen(path)+20),*cmd=NULL;
  if (s==NULL) error("localNode");
  strcpy(s,path);
  strcat(s,"/node");
  if (fexists(s)) cmd=s;
  strcat(s,".exe");
  if (fexists(s)) cmd=s;
  if (cmd!=NULL) {
#   ifdef WINDOWS
      int n=strlen(s),i;
      for (i=n+1;i>0;i--) s[i]=s[i-1];
      s[0]='\"';
      strcat(s,"\"");
#   endif
  }
  return cmd;
}
char *nodeCmd(char *dir,char *jsfile,int argc,char **argv) {
  int n=4; // "node"
  char *ln,**ptr=ldirs+0;
  ldirs[0]=dir;
  do {
    ln=localNode(*ptr);
    ptr++;
  }
  while (ln==NULL && *ptr);
  if (ln!=NULL) n=strlen(ln);
  int i;
//for (i=1;i<argc;i++) printf("argv[%d]=%s_\n",i,argv[i]);
  for (i=1;i<argc;i++) n+=strlen(argv[i]);
  n+=2*argc+strlen(dir)+strlen(jsfile)+2;
  char *cmd=(char*)malloc(n+20);
  *cmd=0;
  strcat(cmd,ln==NULL?"node":ln);
  strcat(cmd," ");
  char *s=cmd+strlen(cmd);
  strcat(cmd,dir);
  if (*dir) strcat(cmd,"/");
  strcat(cmd,jsfile);
  if (!fexists(s)) error(stradd("File ",stradd(s," not found")));
  for (i=1;i<argc;i++) {
    strcat(cmd," ");
    strcat(cmd,argv[i]);
  }
  return cmd;
}
