/* */ 
var http = require("http");
exports = module.exports = function() {
  if (arguments.length && arguments[0] instanceof http.Server) {
    return attach.apply(this, arguments);
  }
  return exports.Server.apply(null, arguments);
};
exports.protocol = 1;
exports.Server = require("./server");
exports.Socket = require("./socket");
exports.Transport = require("./transport");
exports.transports = require("./transports/index");
exports.parser = require("engine.io-parser");
exports.listen = listen;
function listen(port, options, fn) {
  if ('function' == typeof options) {
    fn = options;
    options = {};
  }
  var server = http.createServer(function(req, res) {
    res.writeHead(501);
    res.end('Not Implemented');
  });
  server.listen(port, fn);
  var engine = exports.attach(server, options);
  engine.httpServer = server;
  return engine;
}
;
exports.attach = attach;
function attach(server, options) {
  var engine = new exports.Server(options);
  engine.attach(server, options);
  return engine;
}
;
