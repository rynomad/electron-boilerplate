var fs = require("fs");
var path = require("path");
var WebSocketServer = require('ws').Server

const setup = (settings, cb) => {
  var server = new WebSocketServer(settings);
  var socks = []
  server.on('connection', (sock) => {
    socks.push(sock);
  })

  cb((label, event) => {
    socks = socks.filter(sock => sock.readyState == 1)
    socks.forEach((sock) => {
      sock.send(JSON.stringify(Object.assign({
        label : label
      }, event)));
    })
  })
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
    "WebsocketServer",
    [
      ["-p,--port <port>","port for the server to listen on"]
    ],
    setup
  )
