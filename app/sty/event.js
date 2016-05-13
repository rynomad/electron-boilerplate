'use strict';
var lob = require('lob-enc');
var EventEmitter = require("events").EventEmitter;

// implements https://github.com/telehash/telehash.org/blob/v3/v3/channels/stream.md
exports.name = 'event';

exports.mesh = function(mesh, cbExt)
{
  var ext = {open:{}};

  /** attach a context for console channels 
   * @memberOf Mesh
   * @param {function} onStream - handler for incoming streams
   */
  mesh.events = function(eventemitter)
  {
    ext.events= eventemitter;
  }
  // new incoming stream open request
  ext.open.event = function(args, open, cbOpen){
    var link = this;
    if(!ext.events)
      return cbOpen('no emitter');


    // pass any attached request packet as options, and a method to accept
    var channel = link.x.channel(open);
    ext.events.emit(open.json.label, {
      hashname : link.hashname,
      data : open.json.data
    });

    channel.send({json : {end: true}});
  }

  cbExt(undefined, ext);
}