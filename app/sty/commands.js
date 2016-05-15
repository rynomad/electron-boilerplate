'use strict';

var dfu = require("./dfu.js")
var path = require("path")
var playbook = require("./playbook.js")

var AsciiTable = require("ascii-table");
var fsAutocomplete = require('vorpal-autocomplete-fs');
var fs  = require("fs")

const makeProgress = (options) => (color) => {
  /*
  var bar = new ProgressBar(Object.assign({
    schema : `:action.bold :hashname, [:bar.${color}] :percent`
  }, options));*/
  return (() => {});//}.tick(options));
}

module.exports = (mesh) => {
  var currentDevice;

const getCurrentDeviceLink = () => mesh.devices.get(currentDevice);

const getAllDeviceLinks = () => mesh.devices;

const setCurrentDeviceLink = (shorthash) => currentDevice = shorthash;

const getDeviceHashes = () => {
  var ret = []
  for (var entry of mesh.devices){
    ret.push(entry[0])
  }

  return ret;
}

const getDeviceTable = (that) => {
  that.log("getDeviceTable")
  var table = new AsciiTable("Connected Devices")
  table.setHeading("hashname (short)", "Device Tag", "links", "uptime (s)", "hashname (long)")
  for (var entry of mesh.devices){
    that.log("!",entry[0])
    table.addRow(entry[0], entry[1].name, entry[1].links , entry[1].uptime, entry[1].hashname);
  }

  return table
}

const runCommand = (that, link, cmd) => new Promise((res, rej) => {
  that.log("running command : ", cmd)
  link.console(cmd, (err, json) => {
    if (json)
      that.log(link.hashname.substr(0,8),json);
    else
      that.log("command timeout")
    res()
  })
})


const scriptFromArgs = (args) => args.options.inline ? args.script : fs.readFileSync(args.script, 'utf8').replace(/\n$/, "")

const MetaModeCommands = {
  main : ["dfu", "scan", "connect", "init", "run",  "sinks", "playbook", "wait", "repl"],
  device : ["dfu", "scan", "connect", "init", "run", "main", "playbook", "wait", "repl"],
  sinks : fs.readdirSync(path.join(__dirname,"sinks")).map((file) => file.split(".")[0]).concat(["main"])
}

const addCommand = (vorpal, cmd, mode, delim) => {
  let command = Commands[cmd];
  let instance
  if (command.command){
     instance = vorpal.command.apply(vorpal, command.command);
  } else if (command.mode){
     instance = vorpal.mode.apply(vorpal, command.mode);
  }

  if (command.autocomplete){
    instance.autocomplete(command.autocomplete)
  }

  if (command.options){
    command.options.forEach((opt) => {
      instance.option.apply(instance, opt);
    })
  }

  if (command.validate){
    instance.validate(command.validate)
  }

  if (command.action){
    instance.action(command.action(mode, delim));
  }

  if (command.hidden){
    instance.hidden()
  }

}

const Modize = (mode, delim, op) => {
      var links = mode == "device" ? [mesh.devices.get(delim)] : getAllDeviceLinks() ;

      var parallel = [];
      links.forEach((link) => parallel.push(op(link)))

      return Promise.all(parallel);;
}

var VORPAL;

const MetaMode = (vorpal, mode, delim) => {

  VORPAL = VORPAL || vorpal;
  Object.keys(Commands).forEach((cmd) => {
    let c = VORPAL.find(cmd);
    if (c )
      c.remove()
  })
  MetaModeCommands[mode].forEach((cmd) => {
    addCommand(VORPAL, cmd, mode, delim);
  })
  vorpal.delimiter(delim + "~$");
}


var Commands = {
  dfu : {
    command : ['dfu <file>', "updates the device firmware"],
    autocomplete : fsAutocomplete(),
    options : [
      ["-t,--type <firmware>", "REQUIRED", Object.keys(dfu)]
    ],
    validate : (args) => (!args.options.type ? "must supply firmware type, eg: dfu -t patch patchos.bin" : true),
    action : (mode, delim) => function(args,cb){
      var channeler = dfu[args.options.type];
      if (!channeler){
         return "currently firmware types are " + Object.keys(dfu).join(", "); 
      } 

      Modize(mode, delim, (link) => {
        var progressor = makeProgress({
          action : `dfu ${args.options.type}`,
          hashname : link.hashname.substr(0,8),
          total : Math.ceil(fs.statSync(args.file).size / 1024)
        })
        return channeler(link, args.file, progressor);
      }).then(cb);
    }
  },
  wait : {
    command : ['wait <seconds>', 'just delay number of seconds, only used for playbooks'],
    action : (mode, delim) => function(args,cb){
      var link = args.link ;
      var progressor = makeProgress({
        action : `wait ${args.seconds}`,
        hashname : delim ,
        total : args.seconds
      })
      var tick = progressor("white");
      var count = 0;
      var iv = setInterval(() => {
        tick();
        if (++count == args.seconds){
          clearInterval(iv);
          cb()
        }
      }, 1000)
    },
    hidden : true
  },
  scan : {
    command : ["scan", "show available taps"],
    action : (mode, delim) => function(args,cb){
       this.log(getDeviceTable(this).toString())
       cb()
    }
  },
  connect : {
    command : ["connect <device>", "enter a device specific prompt"],
    autocomplete : getDeviceHashes,
    action : (mode, delim) => function(args,cb){
        setCurrentDeviceLink(args.device);
        MetaMode(this, "device" , args.device);
        cb()
    }
  },
  init : {
    command : ["init <script>", "set the init script on device from file, use -i for inline"],
    autocomplete : fsAutocomplete(),
    options : [
      ["-i,--inline", "inline command"]
    ],
    action : (mode, delim) => function(args,cb){
      Modize(mode, delim, (link) => runCommand(this, link,`init('${scriptFromArgs(args)}');keepalive(5);`)).then(cb)
      
    }
  },
  run : {
    command : ["run <script>", "run the script on device from file, use -i for inline"],
    autocomplete : fsAutocomplete(),
    options : [
      ["-i,--inline", "inline command"]
    ],
    action : (mode, delim) => function(args,cb){
      Modize(mode, delim, (link) => runCommand(this, link, scriptFromArgs(args))).then(cb)
    }
  },
  repl : {
    mode : ["repl", "enter a repl for this devices script runner"],
    action : (mode, delim) => function(args,cb){
      Modize(mode, delim, (link) => runCommand(this, link, args)).then(cb)
    }
  },
  sink : {
    command: ["sink <sink> [config]", "run the given sink file with the given config json file"],
    autocomplete : fsAutocomplete(),
    action : (mode, delim) => function(args,cb){
      require(path.join(process.cwd(), args.sink))(args.config ? require(args.config) : {}, mesh.reportSource);
      cb()
    }
  },
  playbook: {
    command: ["playbook <file>", "run a playbook of sty commands against a tap or taps"],
    options: [
      ["-d,--daemon", "keep playbook running in daemon mode while you plug in new devices"]
    ], 
    autocomplete: fsAutocomplete(),
    action: (mode, delim) => function(args,cb){
      console.log(args);
      var promise = playbook(VORPAL, Commands, mesh, args.file, mode == "device" ? delim : null)
      if (args.options.daemon){
        this.log("GOING INTO DAEMON MODE, CTRL + C to cancel, MUST exit application completely to stop auto execution of playbook on new devices");
        mesh.accept = (from) => {
          mesh.link(from, (err, link) => {
            if (err)
              return cb(err);
            mesh.devices.set(link.hashname.substr(0,8), link);

            playbook(VORPAL, Commands, mesh, args.file, from.hashname.substr(0,8));
          })
        }
      }
    }
  },
  sinks : {
    command : ["sinks", "view and start data sinks"],
    action : (mode, delim) => function(args, cb){
      MetaMode(this, "sinks", "sinks");
      cb();
    }
  },
  main : {
    command : ["main", "go back to main prompt"],
    action : (mode, delim) => function(args,cb){
      MetaMode(this, "main", "sty");
      cb();
    }
  }
}

Commands = require("./sinks.js")(Commands, mesh);
/*
Commands = fs.readdirSync(path.join(__dirname,"sinks")).reduce((cmds, file) => {
  let name = file.split(".")[0];
  cmds[name] = require("./sinks/" + file );
  return cmds;
}, Commands)
*/
return MetaMode;
}
