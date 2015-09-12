/* */ 
(function(Buffer) {
  var Polling = require("./polling");
  var qs = require("querystring");
  var rDoubleSlashes = /\\\\n/g;
  var rSlashes = /(\\)?\\n/g;
  module.exports = JSONP;
  function JSONP(req) {
    Polling.call(this, req);
    this.head = '___eio[' + (req._query.j || '').replace(/[^0-9]/g, '') + '](';
    this.foot = ');';
  }
  ;
  JSONP.prototype.__proto__ = Polling.prototype;
  JSONP.prototype.onData = function(data) {
    data = qs.parse(data).d;
    if ('string' == typeof data) {
      data = data.replace(rSlashes, function(match, slashes) {
        return slashes ? match : '\n';
      });
      Polling.prototype.onData.call(this, data.replace(rDoubleSlashes, '\\n'));
    }
  };
  JSONP.prototype.doWrite = function(data) {
    var js = JSON.stringify(data).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    data = this.head + js + this.foot;
    var headers = {
      'Content-Type': 'text/javascript; charset=UTF-8',
      'Content-Length': Buffer.byteLength(data)
    };
    var ua = this.req.headers['user-agent'];
    if (ua && (~ua.indexOf(';MSIE') || ~ua.indexOf('Trident/'))) {
      headers['X-XSS-Protection'] = '0';
    }
    this.res.writeHead(200, this.headers(this.req, headers));
    this.res.end(data);
  };
  JSONP.prototype.headers = function(req, headers) {
    headers = headers || {};
    if (/MSIE 8\.0/.test(req.headers['user-agent'])) {
      headers['X-XSS-Protection'] = '0';
    }
    this.emit('headers', headers);
    return headers;
  };
})(require("buffer").Buffer);
