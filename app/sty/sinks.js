//templater for sink commands
var path = require("path")
var fs = require("fs");

//seperate

// turn "-i,--inline <stuff>" => "inline"
const optkey = (opt) => opt[0].split(",--")[1].split(" ")[0];

const wildcard = (events, label) => (events.indexOf("*") > -1 && events.indexOf("-" + label) < 0)

const explicit = (events, label) => (events.indexOf(label) > -1)

const eventEnabled = (events, label) => (wildcard(events, label) || explicit(events,label))


module.exports = (Commands, mesh) => {
  'use strict';

  const commandTemplate = (name, options, setup) => ({
    command : [`${name.toLowerCase()} <events>`, `pipe the specified events into a ${name} endpoint (type help ${name.toLowerCase()} for required options)`],
    options : options,
    validate : (args) => options.reduce((res, opt) => typeof res == "string" ? res : !args.options[optkey(opt)] ? "missing option " + optkey[opt] : true, true),
    action : (mode, delim) => function(args,cb){
      var events = args.events.split(",")
      setup(args.options, (runner) => {
        mesh.reportSource.onAny((label, evt) => {
          if (eventEnabled(events, label))
            runner(label, evt);
        })
        cb()
      })
    }
  });


  Commands = fs.readdirSync(path.join(__dirname,"sinks")).reduce((cmds, file) => {
    let name = file.split(".")[0];
    cmds[name] = require("./sinks/" + file )(commandTemplate);
    return cmds;
  }, Commands)

  return Commands;
}