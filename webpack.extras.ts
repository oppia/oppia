const loaderUtils = require('loader-utils');
const path = require('path');

const objExtend = function(args, obj) {
  args = Array.prototype.slice.call(args);
  const _a = args.slice(1);
  _a.unshift(Object.assign(obj, args[0]));
  return _a;
};


module.exports = {
  load: function(resourcePath, args) {
    resourcePath = `/${resourcePath}`;
    const root = path.resolve(__dirname, 'core/templates/dev/head');
    const argsExpr = args ? '(' + objExtend + ')' + '(arguments, ' +
      JSON.stringify(args) + ')' : 'arguments';

    return 'require(' + JSON.stringify(loaderUtils.urlToRequest(
      resourcePath, root)) + ').apply(null,' + argsExpr + ')';
  },

  loadExtensions: function(resourcePath, args) {
    resourcePath = `/${resourcePath}`;
    const root = path.resolve(__dirname, 'extensions');
    const argsExpr = args ? '(' + objExtend + ')' + '(arguments, ' +
      JSON.stringify(args) + ')' : 'arguments';

    return 'require(' + JSON.stringify(loaderUtils.urlToRequest(
      resourcePath, root)) + ').apply(null,' + argsExpr + ')';
  }
}
