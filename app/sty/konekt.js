var http = require("http");

var server = http.createServer();

server.on("request", (req) => {
  console.log("got request")
  req.pipe(process.stdout)
})

server.listen(3000)