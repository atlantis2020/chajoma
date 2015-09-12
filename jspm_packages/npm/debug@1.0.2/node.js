/* */ 
(function(process) {
  var tty = require("tty");
  var util = require("util");
  exports = module.exports = require("./debug");
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.colors = [6, 2, 3, 4, 5, 1];
  function useColors() {
    var debugColors = (process.env.DEBUG_COLORS || '').trim().toLowerCase();
    if (0 === debugColors.length) {
      return tty.isatty(1);
    } else {
      return '0' !== debugColors && 'no' !== debugColors && 'false' !== debugColors && 'disabled' !== debugColors;
    }
  }
  var inspect = (4 === util.inspect.length ? function(v, colors) {
    return util.inspect(v, void 0, void 0, colors);
  } : function(v, colors) {
    return util.inspect(v, {colors: colors});
  });
  exports.formatters.o = function(v) {
    return inspect(v, this.useColors).replace(/\s*\n\s*/g, ' ');
  };
  function formatArgs() {
    var args = arguments;
    var useColors = this.useColors;
    var name = this.namespace;
    if (useColors) {
      var c = this.color;
      args[0] = '  \u001b[9' + c + 'm' + name + ' ' + '\u001b[0m' + args[0] + '\u001b[3' + c + 'm' + ' +' + exports.humanize(this.diff) + '\u001b[0m';
    } else {
      args[0] = new Date().toUTCString() + ' ' + name + ' ' + args[0];
    }
    return args;
  }
  function log() {
    return console.log.apply(console, arguments);
  }
  function save(namespaces) {
    if (null == namespaces) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = namespaces;
    }
  }
  function load() {
    return process.env.DEBUG;
  }
  exports.enable(load());
})(require("process"));
