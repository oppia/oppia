'use strict';
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var saveLicense = require('uglify-save-license');
var isObject = require('lodash/fp/isObject');
var zipObject = require('lodash/fp/zipObject');
var map = require('lodash/fp/map');
var prop = require('lodash/fp/prop');
var _ = require('lodash/fp/placeholder');
var defaultsDeep = require('lodash/fp/defaultsDeep');
var log = require('./lib/log');
var createError = require('./lib/create-error');
var GulpUglifyError = require('./lib/gulp-uglify-error');

var reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/;

var defaultOptions = defaultsDeep({
  fromString: true,
  output: {}
});

function trycatch(fn, handle) {
  try {
    return fn();
  } catch (err) {
    return handle(err);
  }
}

function setup(opts) {
  if (opts && !isObject(opts)) {
    log.warn('gulp-uglify expects an object, non-object provided');
    opts = {};
  }

  var options = defaultOptions(opts);

  if (options.preserveComments === 'all') {
    options.output.comments = true;
  } else if (options.preserveComments === 'some') {
    // preserve comments with directives or that start with a bang (!)
    options.output.comments = /^!|@preserve|@license|@cc_on/i;
  } else if (options.preserveComments === 'license') {
    options.output.comments = saveLicense;
  } else if (typeof options.preserveComments === 'function') {
    options.output.comments = options.preserveComments;
  }

  return options;
}

module.exports = function (opts, uglify) {
  function minify(file, encoding, callback) {
    var options = setup(opts || {});
    var sources;

    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(createError(file, 'Streaming not supported', null));
    }

    if (file.sourceMap) {
      // UglifyJS generates broken source maps if the input source map
      // does not contain mappings.
      if (file.sourceMap.mappings) {
        options.inSourceMap = file.sourceMap;
      }
      options.outSourceMap = file.relative;

      sources = zipObject(file.sourceMap.sources, file.sourceMap.sourcesContent);
    }

    var mangled = trycatch(function () {
      var map = {};
      map[file.relative] = String(file.contents);
      var m = uglify.minify(map, options);
      m.code = new Buffer(m.code.replace(reSourceMapComment, ''));
      return m;
    }, createError(file, 'unable to minify JavaScript'));

    if (mangled instanceof GulpUglifyError) {
      return callback(mangled);
    }

    file.contents = mangled.code;

    if (file.sourceMap) {
      var sourceMap = JSON.parse(mangled.map);

      sourceMap.sourcesContent = map(prop(_, sources), sourceMap.sources);
      applySourceMap(file, sourceMap);
    }

    callback(null, file);
  }

  return through.obj(minify);
};
