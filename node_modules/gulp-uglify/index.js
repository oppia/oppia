'use strict';
var uglify = require('uglify-js');
var minifier = require('./minifier');
var GulpUglifyError = require('./lib/gulp-uglify-error');

module.exports = function (opts) {
  return minifier(opts, uglify);
};

module.exports.GulpUglifyError = GulpUglifyError;
