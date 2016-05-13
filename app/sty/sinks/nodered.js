var http = require('http');
var express = require("express");
var RED = require("node-red");
var path = require("path");
var EE = require("eventemitter2")


var isrunning = false;

const setup = (settings, cb) => {
  if (isrunning)
    return console.warn("IGNORING MULTIPLE INVOCATIONS OF NODE_RED")
  
  // Create an Express app
  var app = express();

  // Create a server
  var server = http.createServer(app);

  var source = new EE();

  // Create the settings object - see default settings.js file for other options
  var set = {
      httpAdminRoot:"/red",
      httpNodeRoot: "/api",
      userDir: path.join(require("os").homedir(), ".nodered"),
      functionGlobalContext: {
        filament : source
      },    // enables global context
      verbose : true
  };

  // Initialise the runtime with a server and settings
  RED.init(server,set);

  // Serve the editor UI from /red
  app.use(set.httpAdminRoot,RED.httpAdmin);

  // Serve the http nodes UI from /api
  app.use(set.httpNodeRoot,RED.httpNode);

  server.listen(settings.port);
  // Start the runtime
  RED.start();
  isrunning = true;

  cb((label, event) => {
    source.emit(label, event);
  })
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
    "NodeRed",
    [
      ["-p,--port <port>","port for the server to listen on"]
    ],
    setup
  )
