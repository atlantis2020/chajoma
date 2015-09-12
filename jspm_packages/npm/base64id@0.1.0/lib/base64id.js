/* */ 
(function(Buffer) {
  var crypto = require("crypto");
  var Base64Id = function() {};
  Base64Id.prototype.getRandomBytes = function(bytes) {
    var BUFFER_SIZE = 4096;
    var self = this;
    bytes = bytes || 12;
    if (bytes > BUFFER_SIZE) {
      return crypto.randomBytes(bytes);
    }
    var bytesInBuffer = parseInt(BUFFER_SIZE / bytes);
    var threshold = parseInt(bytesInBuffer * 0.85);
    if (!threshold) {
      return crypto.randomBytes(bytes);
    }
    if (this.bytesBufferIndex == null) {
      this.bytesBufferIndex = -1;
    }
    if (this.bytesBufferIndex == bytesInBuffer) {
      this.bytesBuffer = null;
      this.bytesBufferIndex = -1;
    }
    if (this.bytesBufferIndex == -1 || this.bytesBufferIndex > threshold) {
      if (!this.isGeneratingBytes) {
        this.isGeneratingBytes = true;
        crypto.randomBytes(BUFFER_SIZE, function(err, bytes) {
          self.bytesBuffer = bytes;
          self.bytesBufferIndex = 0;
          self.isGeneratingBytes = false;
        });
      }
      if (this.bytesBufferIndex == -1) {
        return crypto.randomBytes(bytes);
      }
    }
    var result = this.bytesBuffer.slice(bytes * this.bytesBufferIndex, bytes * (this.bytesBufferIndex + 1));
    this.bytesBufferIndex++;
    return result;
  };
  Base64Id.prototype.generateId = function() {
    var rand = new Buffer(15);
    if (!rand.writeInt32BE) {
      return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString() + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
    }
    this.sequenceNumber = (this.sequenceNumber + 1) | 0;
    rand.writeInt32BE(this.sequenceNumber, 11);
    if (crypto.randomBytes) {
      this.getRandomBytes(12).copy(rand);
    } else {
      [0, 4, 8].forEach(function(i) {
        rand.writeInt32BE(Math.random() * Math.pow(2, 32) | 0, i);
      });
    }
    return rand.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
  };
  exports = module.exports = new Base64Id();
})(require("buffer").Buffer);
