// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import sty from './sty.js'; // code authored by you in this project

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {
  /*
  var socket = io.connect("http://localhost:4242");
  socket.on('connect', function() {
    var term = new Terminal({
      cols: 80,
      rows: 24,
      useStyle: true,
      screenKeys: true,
      cursorBlink: false
    });
    term.on('data', function(data) {
      socket.emit('data', data);
    });
    term.on('title', function(title) {
      document.title = title;
    });
    term.open(document.body);
    term.write('\x1b[31mWelcome to term.js!\x1b[m\r\n');
    socket.on('data', function(data) {
      term.write(data);
    });
    socket.on('disconnect', function() {
      term.destroy();
    });
  });
  */
});
