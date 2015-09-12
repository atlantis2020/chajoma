/* */ 
(function(process) {
  var keys = require("object-keys");
  var Emitter = require("events").EventEmitter;
  var parser = require("socket.io-parser");
  module.exports = Adapter;
  function Adapter(nsp) {
    this.nsp = nsp;
    this.rooms = {};
    this.sids = {};
    this.encoder = new parser.Encoder();
  }
  Adapter.prototype.__proto__ = Emitter.prototype;
  Adapter.prototype.add = function(id, room, fn) {
    this.sids[id] = this.sids[id] || {};
    this.sids[id][room] = true;
    this.rooms[room] = this.rooms[room] || {};
    this.rooms[room][id] = true;
    if (fn)
      process.nextTick(fn.bind(null, null));
  };
  Adapter.prototype.del = function(id, room, fn) {
    this.sids[id] = this.sids[id] || {};
    this.rooms[room] = this.rooms[room] || {};
    delete this.sids[id][room];
    delete this.rooms[room][id];
    if (this.rooms.hasOwnProperty(room) && !keys(this.rooms[room]).length) {
      delete this.rooms[room];
    }
    if (fn)
      process.nextTick(fn.bind(null, null));
  };
  Adapter.prototype.delAll = function(id, fn) {
    var rooms = this.sids[id];
    if (rooms) {
      for (var room in rooms) {
        if (rooms.hasOwnProperty(room)) {
          delete this.rooms[room][id];
        }
        if (this.rooms.hasOwnProperty(room) && !keys(this.rooms[room]).length) {
          delete this.rooms[room];
        }
      }
    }
    delete this.sids[id];
  };
  Adapter.prototype.broadcast = function(packet, opts) {
    var rooms = opts.rooms || [];
    var except = opts.except || [];
    var flags = opts.flags || {};
    var ids = {};
    var self = this;
    var socket;
    packet.nsp = this.nsp.name;
    this.encoder.encode(packet, function(encodedPackets) {
      if (rooms.length) {
        for (var i = 0; i < rooms.length; i++) {
          var room = self.rooms[rooms[i]];
          if (!room)
            continue;
          for (var id in room) {
            if (room.hasOwnProperty(id)) {
              if (ids[id] || ~except.indexOf(id))
                continue;
              socket = self.nsp.connected[id];
              if (socket) {
                socket.packet(encodedPackets, true, flags.volatile);
                ids[id] = true;
              }
            }
          }
        }
      } else {
        for (var id in self.sids) {
          if (self.sids.hasOwnProperty(id)) {
            if (~except.indexOf(id))
              continue;
            socket = self.nsp.connected[id];
            if (socket)
              socket.packet(encodedPackets, true, flags.volatile);
          }
        }
      }
    });
  };
})(require("process"));
