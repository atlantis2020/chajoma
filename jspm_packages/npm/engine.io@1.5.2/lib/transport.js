/* */ 
var EventEmitter = require("events").EventEmitter,
    parser = require("engine.io-parser"),
    debug = require("debug")('engine:transport');
module.exports = Transport;
function noop() {}
;
function Transport(req) {
  this.readyState = 'opening';
}
;
Transport.prototype.__proto__ = EventEmitter.prototype;
Transport.prototype.onRequest = function(req) {
  debug('setting request');
  this.req = req;
};
Transport.prototype.close = function(fn) {
  this.readyState = 'closing';
  this.doClose(fn || noop);
};
Transport.prototype.onError = function(msg, desc) {
  if (this.listeners('error').length) {
    var err = new Error(msg);
    err.type = 'TransportError';
    err.description = desc;
    this.emit('error', err);
  } else {
    debug('ignored transport error %s (%s)', msg, desc);
  }
};
Transport.prototype.onPacket = function(packet) {
  this.emit('packet', packet);
};
Transport.prototype.onData = function(data) {
  this.onPacket(parser.decodePacket(data));
};
Transport.prototype.onClose = function() {
  this.readyState = 'closed';
  this.emit('close');
};
