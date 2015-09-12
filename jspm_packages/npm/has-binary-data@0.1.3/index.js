/* */ 
(function(Buffer) {
  var isArray = require("isarray");
  module.exports = hasBinary;
  function hasBinary(data) {
    function _hasBinary(obj) {
      if (!obj)
        return false;
      if ((global.Buffer && Buffer.isBuffer(obj)) || (global.ArrayBuffer && obj instanceof ArrayBuffer) || (global.Blob && obj instanceof Blob) || (global.File && obj instanceof File)) {
        return true;
      }
      if (isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
            return true;
          }
        }
      } else if (obj && 'object' == typeof obj) {
        if (obj.toJSON) {
          obj = obj.toJSON();
        }
        for (var key in obj) {
          if (obj.hasOwnProperty(key) && _hasBinary(obj[key])) {
            return true;
          }
        }
      }
      return false;
    }
    return _hasBinary(data);
  }
})(require("buffer").Buffer);
