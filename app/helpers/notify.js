import ws from 'ws'

export function Notify(env, cb){
  var WebSocketServer = ws.Server
    , wss = new WebSocketServer({ port: env.NOTIFICATIONS });

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      let msg = JSON.parse(message);
      cb(msg.label, msg.event);
       
    });
  });
}
