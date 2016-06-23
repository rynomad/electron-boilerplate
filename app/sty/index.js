'use strict';
var m = require("./mesh.js");
var v = require("./vorpal.js");

function init(){
  process.chdir(require("os").homedir())
  m().then(v).then((env) => {
    /*
    var colors = ["red", "blue", "green"]
    var i = 0;
    setInterval(() => {
      i = ++i % 3;
      var cmd = `tap("led.${colors[i]}()")`
      console.log("interval", i, colors, cmd)
      env.mesh.links.forEach((l) => l.console(cmd,() => {}))
    }, 1000)
    */
  }).catch(er => console.log(er, er.stack))
}

init();