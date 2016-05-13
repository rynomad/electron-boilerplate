

function init(){
  console.log("INIT CALLED????")
  require("./sty/mesh.js")().then(require("./sty/vorpal.js")).then((env) => {
    var colors = ["red", "blue", "green"]
    var i = 0;
    setInterval(() => {
      i = ++i % 3;
      var cmd = `tap("led.${colors[i]}()")`
      console.log("interval", i, colors, cmd)
      env.mesh.links.forEach((l) => l.console(cmd,() => {}))
    }, 1000)
  }).catch(er => console.log(er, er.stack))
}

init();