/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var fs = require('fs');
var path = require('path');

var Stream = require('stream').Stream;
var PassThrough = require('readable-stream').PassThrough;

var util = module.exports = {};

util._ = require('lodash');
util.lazystream = require('lazystream');
util.file = require('file-utils');

util.collectStream = function(source, callback) {
  var collection = [];
  var size = 0;

  source.on('error', callback);

  source.on('data', function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });

  source.on('end', function() {
    var buf = new Buffer(size, 'utf8');
    var offset = 0;

    collection.forEach(function(data) {
      data.copy(buf, offset);
      offset += data.length;
    });

    callback(null, buf);
  });
};

util.dateify = function(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === 'string') {
    dateish = new Date(dateish);
  } else {
    dateish = new Date();
  }

  return dateish;
};

// this is slightly different from lodash version
util.defaults = function(object, source, guard) {
  var args = arguments;
  args[0] = args[0] || {};

  return util._.defaults.apply(util._, args);
};

util.isStream = function(source) {
  return source instanceof Stream;
};

util.lazyReadStream = function(filepath) {
  return new util.lazystream.Readable(function() {
    return fs.createReadStream(filepath);
  });
};

// reusing bits of grunt's multi-task source normalization
util.normalizeFilesArray = function(data) {
  var files = [];

  data.forEach(function(obj) {
    var prop;
    if ('src' in obj || 'dest' in obj) {
      files.push(obj);
    }
  });

  if (files.length === 0) {
    return [];
  }

  files = util._(files).chain().forEach(function(obj) {
    if (!('src' in obj) || !obj.src) { return; }
    // Normalize .src properties to flattened array.
    if (Array.isArray(obj.src)) {
      obj.src = util._.flatten(obj.src);
    } else {
      obj.src = [obj.src];
    }
  }).map(function(obj) {
    // Build options object, removing unwanted properties.
    var expandOptions = util._.extend({}, obj);
    delete expandOptions.src;
    delete expandOptions.dest;

    // Expand file mappings.
    if (obj.expand) {
      return util.file.expandMapping(obj.src, obj.dest, expandOptions).map(function(mapObj) {
        // Copy obj properties to result.
        var result = util._.extend({}, obj);
        // Make a clone of the orig obj available.
        result.orig = util._.extend({}, obj);
        // Set .src and .dest, processing both as templates.
        result.src = mapObj.src;
        result.dest = mapObj.dest;
        // Remove unwanted properties.
        ['expand', 'cwd', 'flatten', 'rename', 'ext'].forEach(function(prop) {
          delete result[prop];
        });
        return result;
      });
    }

    // Copy obj properties to result, adding an .orig property.
    var result = util._.extend({}, obj);
    // Make a clone of the orig obj available.
    result.orig = util._.extend({}, obj);

    if ('src' in result) {
      // Expose an expand-on-demand getter method as .src.
      Object.defineProperty(result, 'src', {
        enumerable: true,
        get: function fn() {
          var src;
          if (!('result' in fn)) {
            src = obj.src;
            // If src is an array, flatten it. Otherwise, make it into an array.
            src = Array.isArray(src) ? util._.flatten(src) : [src];
            // Expand src files, memoizing result.
            fn.result = util.file.expand(expandOptions, src);
          }
          return fn.result;
        }
      });
    }

    if ('dest' in result) {
      result.dest = obj.dest;
    }

    return result;
  }).flatten().value();

  return files;
};

util.normalizeInputSource = function(source) {
  if (source === null) {
    return new Buffer(0);
  } else if (typeof source === 'string') {
    return new Buffer(source);
  } else if (util.isStream(source) && !source._readableState) {
    var normalized = new PassThrough();
    source.pipe(normalized);

    return normalized;
  }

  return source;
};

util.sanitizePath = function() {
  var filepath = path.join.apply(path, arguments);
  return filepath.replace(/\\/g, '/').replace(/:/g, '').replace(/^\/+/, '');
};

util.stat = function() {
  var filepath = path.join.apply(path, arguments);

  if (!util.file.exists(filepath)) {
    return false;
  }

  return fs.statSync(filepath);
};

util.trailingSlashIt = function(str) {
  return str.slice(-1) !== '/' ? str + '/' : str;
};

util.unixifyPath = function() {
  var filepath = path.join.apply(path, arguments);
  return filepath.replace(/\\/g, '/');
};