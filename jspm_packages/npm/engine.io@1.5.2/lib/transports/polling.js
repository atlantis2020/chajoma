/* */ 
(function(Buffer) {
  var Transport = require("../transport"),
      parser = require("engine.io-parser"),
      debug = require("debug")('engine:polling');
  module.exports = Polling;
  function Polling(req) {
    Transport.call(this, req);
  }
  Polling.prototype.__proto__ = Transport.prototype;
  Polling.prototype.name = 'polling';
  Polling.prototype.onRequest = function(req) {
    var res = req.res;
    if ('GET' == req.method) {
      this.onPollRequest(req, res);
    } else if ('POST' == req.method) {
      this.onDataRequest(req, res);
    } else {
      res.writeHead(500);
      res.end();
    }
  };
  Polling.prototype.onPollRequest = function(req, res) {
    if (this.req) {
      debug('request overlap');
      this.onError('overlap from client');
      res.writeHead(500);
      return;
    }
    debug('setting request');
    this.req = req;
    this.res = res;
    var self = this;
    function onClose() {
      self.onError('poll connection closed prematurely');
    }
    function cleanup() {
      req.removeListener('close', onClose);
      self.req = self.res = null;
    }
    req.cleanup = cleanup;
    req.on('close', onClose);
    this.writable = true;
    this.emit('drain');
    if (this.writable && this.shouldClose) {
      debug('triggering empty send to append close packet');
      this.send([{type: 'noop'}]);
    }
  };
  Polling.prototype.onDataRequest = function(req, res) {
    if (this.dataReq) {
      this.onError('data request overlap from client');
      res.writeHead(500);
      return;
    }
    var isBinary = 'application/octet-stream' == req.headers['content-type'];
    this.dataReq = req;
    this.dataRes = res;
    var chunks = isBinary ? new Buffer(0) : '';
    var self = this;
    function cleanup() {
      chunks = isBinary ? new Buffer(0) : '';
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('close', onClose);
      self.dataReq = self.dataRes = null;
    }
    function onClose() {
      cleanup();
      self.onError('data request connection closed prematurely');
    }
    function onData(data) {
      var contentLength;
      if (typeof data == 'string') {
        chunks += data;
        contentLength = Buffer.byteLength(chunks);
      } else {
        chunks = Buffer.concat([chunks, data]);
        contentLength = chunks.length;
      }
      if (contentLength > self.maxHttpBufferSize) {
        chunks = '';
        req.connection.destroy();
      }
    }
    function onEnd() {
      self.onData(chunks);
      var headers = {
        'Content-Type': 'text/html',
        'Content-Length': 2
      };
      var ua = req.headers['user-agent'];
      if (ua && (~ua.indexOf(';MSIE') || ~ua.indexOf('Trident/'))) {
        headers['X-XSS-Protection'] = '0';
      }
      res.writeHead(200, self.headers(req, headers));
      res.end('ok');
      cleanup();
    }
    req.on('close', onClose);
    req.on('data', onData);
    req.on('end', onEnd);
    if (!isBinary)
      req.setEncoding('utf8');
  };
  Polling.prototype.onData = function(data) {
    debug('received "%s"', data);
    var self = this;
    var callback = function(packet) {
      if ('close' == packet.type) {
        debug('got xhr close packet');
        self.onClose();
        return false;
      }
      self.onPacket(packet);
    };
    parser.decodePayload(data, callback);
  };
  Polling.prototype.onClose = function() {
    if (this.writable) {
      this.send([{type: 'noop'}]);
    }
    Transport.prototype.onClose.call(this);
  };
  Polling.prototype.send = function(packets) {
    if (this.shouldClose) {
      debug('appending close packet to payload');
      packets.push({type: 'close'});
      this.shouldClose();
      this.shouldClose = null;
    }
    var self = this;
    parser.encodePayload(packets, this.supportsBinary, function(data) {
      self.write(data);
    });
  };
  Polling.prototype.write = function(data) {
    debug('writing "%s"', data);
    this.doWrite(data);
    this.req.cleanup();
    this.writable = false;
  };
  Polling.prototype.doClose = function(fn) {
    debug('closing');
    if (this.dataReq) {
      debug('aborting ongoing data request');
      this.dataReq.destroy();
    }
    if (this.writable) {
      debug('transport writable - closing right away');
      this.send([{type: 'close'}]);
      fn();
    } else {
      debug('transport not writable - buffering orderly close');
      this.shouldClose = fn;
    }
  };
})(require("buffer").Buffer);
