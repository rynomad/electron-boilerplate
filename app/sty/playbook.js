var parseyaml = require("utils-yaml-parse")
var fs = require("fs")
var argv = require('minimist')(process.argv)
var commands = require('./commands.js');

const stringReplaceVars = (vars, string) => {
   Object.keys(vars).forEach((key) => {
     var reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
     string = string.replace(reg, vars[key])
   })
    return string;
}

const replaceVars = (playbook) => {
   var vars = playbook.vars || {};
   playbook.tasks.forEach((task, index) => {
     task.name = stringReplaceVars(vars, task.name);
       task.command = stringReplaceVars(vars, task.command);   
   })
   return playbook;
}

const makePlaybookChain = (vorpal, commands, playbook, chain, shortHash) => {
  playbook.tasks.forEach((task) => {
    chain = chain.then(() => {
      return new Promise((res,rej) => {
        var match = vorpal.util.parseCommand(task.command, vorpal.commands)
        if (!match.match)
          return rej(new Error("invalid playbook command: " + task.command))
        
        var parsed = vorpal.util.buildCommandArgs(match.matchArgs, match.match, {});

        commands[match.match._name].action("device", shortHash)(parsed, () => {
          res()
        })
      })
    }).catch((er)=> console.log(er, er.stack))
  })
  return chain;
}



module.exports = (vorpal, commands, mesh, playbook, shortHash) => {
  'use strict';
  playbook = parseyaml(fs.readFileSync(playbook, 'utf8'))[0]
  playbook = replaceVars(playbook);

  var shortHashes = [];
  if (shortHash){
    shortHashes.push(shortHash);
  } else {
    for (var entry of mesh.devices){
      shortHashes.push(entry[0]);
    } 
  }
  var all = shortHashes.map((shortHash) => {
    return makePlaybookChain(vorpal, commands,  playbook, Promise.resolve(), shortHash);
  })
  return Promise.all(all);
}

