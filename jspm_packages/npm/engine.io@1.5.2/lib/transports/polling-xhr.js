/* */ 
(function(Buffer) {
  var Polling = require("./polling");
  var Transport = require("../transport");
  var debug = require("debug")('engine:polling-xhr');
  module.exports = XHR;
  function XHR(req) {
    Polling.call(this, req);
  }
  XHR.prototype.__proto__ = Polling.prototype;
  XHR.prototype.onRequest = function(req) {
    if ('OPTIONS' == req.method) {
      var res = req.res;
      var headers = this.headers(req);
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      res.writeHead(200, headers);
      res.end();
    } else {
      Polling.prototype.onRequest.call(this, req);
    }
  };
  XHR.prototype.doWrite = function(data) {
    var isString = typeof data == 'string';
    var contentType = isString ? 'text/plain; charset=UTF-8' : 'application/octet-stream';
    var contentLength = '' + (isString ? Buffer.byteLength(data) : data.length);
    var headers = {
      'Content-Type': contentType,
      'Content-Length': contentLength
    };
    var ua = this.req.headers['user-agent'];
    if (ua && (~ua.indexOf(';MSIE') || ~ua.indexOf('Trident/'))) {
      headers['X-XSS-Protection'] = '0';
    }
    this.res.writeHead(200, this.headers(this.req, headers));
    this.res.end(data);
  };
  XHR.prototype.headers = function(req, headers) {
    headers = headers || {};
    if (req.headers.origin) {
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Origin'] = req.headers.origin;
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    this.emit('headers', headers);
    return headers;
  };
})(require("buffer").Buffer);
