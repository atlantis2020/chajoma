/* */ 
(function(process) {
  var Socket = require("./socket");
  var Emitter = require("events").EventEmitter;
  var parser = require("socket.io-parser");
  var debug = require("debug")('socket.io:namespace');
  var hasBin = require("has-binary-data");
  module.exports = exports = Namespace;
  exports.events = ['connect', 'connection', 'newListener'];
  exports.flags = ['json'];
  var emit = Emitter.prototype.emit;
  function Namespace(server, name) {
    this.name = name;
    this.server = server;
    this.sockets = [];
    this.connected = {};
    this.fns = [];
    this.ids = 0;
    this.acks = {};
    this.initAdapter();
  }
  Namespace.prototype.__proto__ = Emitter.prototype;
  exports.flags.forEach(function(flag) {
    Namespace.prototype.__defineGetter__(flag, function() {
      this.flags = this.flags || {};
      this.flags[flag] = true;
      return this;
    });
  });
  Namespace.prototype.initAdapter = function() {
    this.adapter = new (this.server.adapter())(this);
  };
  Namespace.prototype.use = function(fn) {
    this.fns.push(fn);
    return this;
  };
  Namespace.prototype.run = function(socket, fn) {
    var fns = this.fns.slice(0);
    if (!fns.length)
      return fn(null);
    function run(i) {
      fns[i](socket, function(err) {
        if (err)
          return fn(err);
        if (!fns[i + 1])
          return fn(null);
        run(i + 1);
      });
    }
    run(0);
  };
  Namespace.prototype.to = Namespace.prototype['in'] = function(name) {
    this.rooms = this.rooms || [];
    if (!~this.rooms.indexOf(name))
      this.rooms.push(name);
    return this;
  };
  Namespace.prototype.add = function(client, fn) {
    debug('adding socket to nsp %s', this.name);
    var socket = new Socket(this, client);
    var self = this;
    this.run(socket, function(err) {
      process.nextTick(function() {
        if ('open' == client.conn.readyState) {
          if (err)
            return socket.error(err.data || err.message);
          self.sockets.push(socket);
          socket.onconnect();
          if (fn)
            fn();
          self.emit('connect', socket);
          self.emit('connection', socket);
        } else {
          debug('next called after client was closed - ignoring socket');
        }
      });
    });
    return socket;
  };
  Namespace.prototype.remove = function(socket) {
    var i = this.sockets.indexOf(socket);
    if (~i) {
      this.sockets.splice(i, 1);
    } else {
      debug('ignoring remove for %s', socket.id);
    }
  };
  Namespace.prototype.emit = function(ev) {
    if (~exports.events.indexOf(ev)) {
      emit.apply(this, arguments);
    } else {
      var args = Array.prototype.slice.call(arguments);
      var parserType = parser.EVENT;
      if (hasBin(args)) {
        parserType = parser.BINARY_EVENT;
      }
      var packet = {
        type: parserType,
        data: args
      };
      if ('function' == typeof args[args.length - 1]) {
        throw new Error('Callbacks are not supported when broadcasting');
      }
      this.adapter.broadcast(packet, {
        rooms: this.rooms,
        flags: this.flags
      });
      delete this.rooms;
      delete this.flags;
    }
    return this;
  };
  Namespace.prototype.send = Namespace.prototype.write = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('message');
    this.emit.apply(this, args);
    return this;
  };
})(require("process"));
