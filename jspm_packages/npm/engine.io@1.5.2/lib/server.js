/* */ 
(function(Buffer, process) {
  var qs = require("querystring"),
      parse = require("url").parse,
      readFileSync = require("fs").readFileSync,
      crypto = require("crypto"),
      base64id = require("base64id"),
      transports = require("./transports/index"),
      EventEmitter = require("events").EventEmitter,
      Socket = require("./socket"),
      WebSocketServer = require("ws").Server,
      debug = require("debug")('engine');
  module.exports = Server;
  function Server(opts) {
    if (!(this instanceof Server)) {
      return new Server(opts);
    }
    this.clients = {};
    this.clientsCount = 0;
    opts = opts || {};
    this.pingTimeout = opts.pingTimeout || 60000;
    this.pingInterval = opts.pingInterval || 25000;
    this.upgradeTimeout = opts.upgradeTimeout || 10000;
    this.maxHttpBufferSize = opts.maxHttpBufferSize || 10E7;
    this.transports = opts.transports || Object.keys(transports);
    this.allowUpgrades = false !== opts.allowUpgrades;
    this.allowRequest = opts.allowRequest;
    this.cookie = false !== opts.cookie ? (opts.cookie || 'io') : false;
    if (~this.transports.indexOf('websocket')) {
      this.ws = new WebSocketServer({
        noServer: true,
        clientTracking: false
      });
    }
  }
  Server.errors = {
    UNKNOWN_TRANSPORT: 0,
    UNKNOWN_SID: 1,
    BAD_HANDSHAKE_METHOD: 2,
    BAD_REQUEST: 3
  };
  Server.errorMessages = {
    0: 'Transport unknown',
    1: 'Session ID unknown',
    2: 'Bad handshake method',
    3: 'Bad request'
  };
  Server.prototype.__proto__ = EventEmitter.prototype;
  Server.prototype.clients;
  Server.prototype.upgrades = function(transport) {
    if (!this.allowUpgrades)
      return [];
    return transports[transport].upgradesTo || [];
  };
  Server.prototype.verify = function(req, upgrade, fn) {
    var transport = req._query.transport;
    if (!~this.transports.indexOf(transport)) {
      debug('unknown transport "%s"', transport);
      return fn(Server.errors.UNKNOWN_TRANSPORT, false);
    }
    var sid = req._query.sid;
    if (sid) {
      if (!this.clients.hasOwnProperty(sid))
        return fn(Server.errors.UNKNOWN_SID, false);
      if (!upgrade && this.clients[sid].transport.name !== transport) {
        debug('bad request: unexpected transport without upgrade');
        return fn(Server.errors.BAD_REQUEST, false);
      }
    } else {
      if ('GET' != req.method)
        return fn(Server.errors.BAD_HANDSHAKE_METHOD, false);
      if (!this.allowRequest)
        return fn(null, true);
      return this.allowRequest(req, fn);
    }
    fn(null, true);
  };
  Server.prototype.prepare = function(req) {
    if (!req._query) {
      req._query = ~req.url.indexOf('?') ? qs.parse(parse(req.url).query) : {};
    }
  };
  Server.prototype.close = function() {
    debug('closing all open clients');
    for (var i in this.clients) {
      this.clients[i].close();
    }
    return this;
  };
  Server.prototype.handleRequest = function(req, res) {
    debug('handling "%s" http request "%s"', req.method, req.url);
    this.prepare(req);
    req.res = res;
    var self = this;
    this.verify(req, false, function(err, success) {
      if (!success) {
        sendErrorMessage(req, res, err);
        return;
      }
      if (req._query.sid) {
        debug('setting new request for existing client');
        self.clients[req._query.sid].transport.onRequest(req);
      } else {
        self.handshake(req._query.transport, req);
      }
    });
  };
  function sendErrorMessage(req, res, code) {
    var headers = {'Content-Type': 'application/json'};
    if (req.headers.origin) {
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Origin'] = req.headers.origin;
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    res.writeHead(400, headers);
    res.end(JSON.stringify({
      code: code,
      message: Server.errorMessages[code]
    }));
  }
  Server.prototype.handshake = function(transport, req) {
    var id = base64id.generateId();
    debug('handshaking client "%s"', id);
    var transportName = transport;
    try {
      var transport = new transports[transport](req);
      if ('polling' == transportName) {
        transport.maxHttpBufferSize = this.maxHttpBufferSize;
      }
      if (req._query && req._query.b64) {
        transport.supportsBinary = false;
      } else {
        transport.supportsBinary = true;
      }
    } catch (e) {
      sendErrorMessage(req, req.res, Server.errors.BAD_REQUEST);
      return;
    }
    var socket = new Socket(id, this, transport, req);
    var self = this;
    if (false !== this.cookie) {
      transport.on('headers', function(headers) {
        headers['Set-Cookie'] = self.cookie + '=' + id;
      });
    }
    transport.onRequest(req);
    this.clients[id] = socket;
    this.clientsCount++;
    socket.once('close', function() {
      delete self.clients[id];
      self.clientsCount--;
    });
    this.emit('connection', socket);
  };
  Server.prototype.handleUpgrade = function(req, socket, upgradeHead) {
    this.prepare(req);
    var self = this;
    this.verify(req, true, function(err, success) {
      if (!success) {
        socket.end();
        return;
      }
      var head = new Buffer(upgradeHead.length);
      upgradeHead.copy(head);
      upgradeHead = null;
      self.ws.handleUpgrade(req, socket, head, function(conn) {
        self.onWebSocket(req, conn);
      });
    });
  };
  Server.prototype.onWebSocket = function(req, socket) {
    if (!transports[req._query.transport].prototype.handlesUpgrades) {
      debug('transport doesnt handle upgraded requests');
      socket.close();
      return;
    }
    var id = req._query.sid;
    req.websocket = socket;
    if (id) {
      if (!this.clients[id]) {
        debug('upgrade attempt for closed client');
        socket.close();
      } else if (this.clients[id].upgraded) {
        debug('transport had already been upgraded');
        socket.close();
      } else {
        debug('upgrading existing transport');
        var transport = new transports[req._query.transport](req);
        if (req._query && req._query.b64) {
          transport.supportsBinary = false;
        } else {
          transport.supportsBinary = true;
        }
        this.clients[id].maybeUpgrade(transport);
      }
    } else {
      this.handshake(req._query.transport, req);
    }
  };
  Server.prototype.attach = function(server, options) {
    var self = this;
    var options = options || {};
    var path = (options.path || '/engine.io').replace(/\/$/, '');
    var destroyUpgrade = (options.destroyUpgrade !== undefined) ? options.destroyUpgrade : true;
    var destroyUpgradeTimeout = options.destroyUpgradeTimeout || 1000;
    path += '/';
    function check(req) {
      return path == req.url.substr(0, path.length);
    }
    var listeners = server.listeners('request').slice(0);
    server.removeAllListeners('request');
    server.on('close', self.close.bind(self));
    server.on('request', function(req, res) {
      if (check(req)) {
        debug('intercepting request for path "%s"', path);
        self.handleRequest(req, res);
      } else {
        for (var i = 0,
            l = listeners.length; i < l; i++) {
          listeners[i].call(server, req, res);
        }
      }
    });
    if (~self.transports.indexOf('websocket')) {
      server.on('upgrade', function(req, socket, head) {
        if (check(req)) {
          self.handleUpgrade(req, socket, head);
        } else if (false !== options.destroyUpgrade) {
          setTimeout(function() {
            if (socket.writable && socket.bytesWritten <= 0) {
              return socket.end();
            }
          }, options.destroyUpgradeTimeout);
        }
      });
    }
  };
})(require("buffer").Buffer, require("process"));
