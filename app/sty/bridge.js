const serialport = require("serialport");
const net = require('net');
var shouldscan = true;
var lastData = [0, 0];

function checkStuck() {
  var shouldReset = (lastData[0] > 0) && ((Date.now() - lastData[0]) > 180000);
  shouldReset = shouldReset || ((lastData[1] > 0) && ((Date.now() - lastData[1]) > 180000));
  if (shouldReset) { 
    console.log("No data for over a minute, restarting.");
    return process.exit(1);
  }
  setTimeout(checkStuck, 5000);
}

function checkDud(){
  setTimeout(() => {
    if (lastData[0] == 0 && lastData[1] == 0){
      console.log("no data for over a minute at beginning, restarting")
      process.exit(1)
    }
  }, 60000)
}

checkDud();
checkStuck();

var tap = {
  "vendorId" : "0x2c93",
  "productId" : "0x7232"
}

const scan = module.exports = (args) => {
  if (shouldscan){
    console.log("scanning...")
    serialport.list((err, ports) => {
      console.log("sps: ", ports.length)
      if (err)
        return err;
      
      ports.forEach((port) => {
        if (port.vendorId == tap.vendorId && port.productId == tap.productId){
          console.log("tap detected")
          var sPort = new serialport.SerialPort(port.comName, { baudrate: 115200 }, false);
          shouldscan = false;
          sPort.open((err) => {
            if (err)
              return shouldscan = true;
    
            var target = args.bridge.split(":").reduce((target, hORp) => {
              if (!target.host)
                target.host = hORp;
              else
                target.port = parseInt(hORp);
              return target;
            }, {})

            console.log("start bridging", target)
            var sock = net.connect(target)

            sPort.end = () => {}
            sock.end = () => {}

            sPort.on('data', (data) => {
              lastData[0] = Date.now();
            });
            sock.on('data', (data) => {
              lastData[1] = Date.now();
            });
            sPort.pipe(sock)
            sock.pipe(sPort)

            sock.on("error", () => { console.log("TCP Socket error, restarting."); sPort.end()});
            sock.on("close", () => { console.log("TCP Socket closed, restarting."); sPort.end();});

          })
  
          sPort.on('error', () => { console.log("Serial port error, rescanning."); shouldscan = true;} );
          sPort.on('close', () => { console.log("Serial port closed, rescanning."); shouldscan = true;} );
        }
      })
    })
  } 

  setTimeout(() => scan(args), 5000)
} 