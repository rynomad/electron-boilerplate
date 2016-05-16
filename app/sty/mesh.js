    //process.env.DEBUG="*"
var th = require("telehash")
th.add(require("telehash-nix-usb"))
th.add(require("telehash-console"))
th.add(require("./event.js"));
var os = require("os");
var EE = require("eventemitter2").EventEmitter2;
delete th.extensions["udp4"]
delete th.extensions["tcp4"]
module.exports = () => new Promise((res, rej) => {
  th.load({id :  os.homedir() + "/.sty.hashname"}, (err, mesh) => {

    if (err)
      return rej(err)

    mesh.devices = new Map();

    mesh.console({
      log : (msg) => process.stdout.write("!!!" + msg)
    })

    var ee = new EE();

    ee.onAny((label, data) => {

      console.log("GOT DATA ", label, data);
    })
    mesh.events(ee);
    mesh.reportSource = ee;
    global.mesh = mesh;
    mesh.accept = (from, cb) => {
      mesh.link(from, (err, link) => {

        if (err)
          return;

        mesh.devices.set(from.hashname.substr(0,8), link);
      })
    }

    mesh.discover(true);

    res(mesh)

  })
})
