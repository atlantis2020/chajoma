/* */ 
var XHR = require("./polling-xhr");
var JSONP = require("./polling-jsonp");
module.exports = exports = {
  polling: polling,
  websocket: require("./websocket")
};
exports.polling.upgradesTo = ['websocket'];
function polling(req) {
  if ('string' == typeof req._query.j) {
    return new JSONP(req);
  } else {
    return new XHR(req);
  }
}
