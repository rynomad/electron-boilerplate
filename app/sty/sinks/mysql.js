// simple sink to send data to a mysql table

var mysql = require('mysql');

const flattenEvent = (obj) => Object.keys(obj).reduce((nobj, key) => {
  if (key == "tag")
    return nobj;
  
  if (key == "usb"){
    Object.keys(obj[key]).forEach((kk) => {
      nobj["usb_" + kk] = obj[key][kk];
    })
  } else {
    nobj[key] = obj[key]
    if (typeof nobj[key] == 'string'){
       nobj[key] = nobj[key]
    }
  }
  return nobj
}, {})

const setup = (settings, cb) => {
    var connection = mysql.createConnection(settings);
    connection.connect();


    cb((label, event) => {
      if (typeof event.data == "object")
        var flat = flattenEvent(event.data)
      else {
        var flat = {}
        flat[label] = event.data;
      }
      if (event.via && event.via.length)
        flat.via = event.via[0];

      delete flag.tag;

      connection.query(`INSERT INTO ${settings.table}  SET ? `, flat, function(err, rows, fields) {
        if (err) throw err;
       
      });
    })

    process.on('exit', () => connection.end())
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
  "MySQL",
  [
    ["-d,--database <database>","Required; the database name"],
    ["-u,--user <username>", "Required; the MySQL username"],
    ["-p,--password <password>","Required; MySQL password"],
    ["-t,--table <table>", "Required;"],
    ["-h,--host <host>", "Required", ["localhost"]]
  ],
  setup
)

