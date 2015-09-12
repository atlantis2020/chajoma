/* */ 
(function(process) {
  module.exports = process.env.EIO_COV ? require("./lib-cov/engine.io") : require("./lib/engine.io");
})(require("process"));
