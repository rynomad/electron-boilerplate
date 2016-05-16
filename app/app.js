// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
//import sty from './sty.js'; // code authored by you in this project

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var fs = require('fs');
  var spawn = require('child_process').spawn;
  var remote = require('electron').remote;
  var pty = require('pty.js');


  var el = document.getElementById('term');
  var shellOpts = {
    cols: Math.floor(el.clientWidth / 7.1),
    rows: Math.floor(el.clientHeight / 13),
    screenKeys: true,
    cursorBlink: false,
    focusKeys: false,
    noEvents: false,
    useStyle: true,
    env : {
      ELECTRON_RUN_AS_NODE : 1
    },
    name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'screen-256color',
  };
  var shell = pty.fork(remote.process.execPath, [__dirname +"/sty/index.js"], shellOpts);
  var term = new Terminal(shellOpts);
  term.open(el);
  window.shell = shell;

  shell.stdout.on('data', function(data) {
    term.write(data.toString());
  });

  shell.on('error', function(er) {
    console.log(er)
  })
  term.on('data', function(data) {
    shell.stdin.write(data);
  });
  window.addEventListener('resize', function(){
    term.resize(
      Math.floor(el.clientWidth / 7.1),
      Math.floor(el.clientHeight / 13)
    );

  });

});
