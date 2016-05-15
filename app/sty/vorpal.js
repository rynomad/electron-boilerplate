var vorpal = require("vorpal")();

module.exports = (mesh) => {
  var commands = require("./commands.js")(mesh);
  global.env = {
    mesh : mesh,
    main : vorpal
  }
  commands(vorpal, "main", "sty");
  vorpal.history("sty");
  vorpal.show();
  //vorpal.listen(3000);
  return env;

}
