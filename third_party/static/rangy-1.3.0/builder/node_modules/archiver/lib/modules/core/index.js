/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;

var util = require('../../util');
var Queue = require('./queue');

var Archiver = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    highWaterMark: 1024 * 1024
  });

  Transform.call(this, options);

  this._moduleOutputPiped = false;

  this._pointer = 0;
  this._files = [];
  this._module = false;

  this._queue = new Queue();
  this._queue.on('error', this._onQueueError.bind(this));
  this._queue.on('entry', this._onQueueEntry.bind(this));
  this._queue.once('end', this._onQueueEnd.bind(this));
};

inherits(Archiver, Transform);

Archiver.prototype._moduleSupports = function(key) {
  this._module.supports = util.defaults(this._module.supports, {
    directory: false
  });

  return this._module.supports[key];
};

Archiver.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    type: 'file',
    name: null,
    date: null,
    mode: null,
    sourcePath: null
  });

  var isDir = data.type === 'directory';

  if (data.name) {
    data.name = util.sanitizePath(data.name);

    if (data.name.slice(-1) === '/') {
      isDir = true;
      data.type = 'directory';
    } else if (isDir) {
      data.name += '/';
    }
  }

  if (typeof data.mode === 'number') {
    data.mode &= 0777;
  } else {
    data.mode = isDir ? 0755 : 0644;
  }

  data.date = util.dateify(data.date);

  return data;
};

Archiver.prototype._onModuleError = function(err) {
  this.emit('error', err);
};

Archiver.prototype._onQueueEnd = function() {
  if (typeof this._module.finalize === 'function') {
    this._module.finalize();
  } else if (typeof this._module.end === 'function') {
    this._module.end();
  } else {
    this.emit('error', new Error('format module missing finalize and end method'));
  }
};

Archiver.prototype._onQueueEntry = function(entry) {
  var nextCallback = function(err, file) {
    if (err) {
      this.emit('error', err);
      return;
    }

    file = file || entry.data;

    this.emit('entry', file);
    this._files.push(file);
    this._queue.next();
  }.bind(this);

  this._module.append(entry.source, entry.data, nextCallback);
};

Archiver.prototype._onQueueError = function(err) {
  this.emit('error', err);
};

Archiver.prototype._pipeModuleOutput = function() {
  this._module.on('error', this._onModuleError.bind(this));
  this._module.pipe(this);

  this._moduleOutputPiped = true;
};

Archiver.prototype._processFile = function(source, data, callback) {
  this.emit('error', new Error('method not implemented'));
};

Archiver.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this._pointer += chunk.length;
  }

  callback(null, chunk);
};

Archiver.prototype.append = function(source, data) {
  data = this._normalizeFileData(data);

  if (typeof data.name !== 'string' || data.name.length === 0) {
    this.emit('error', new Error('entry name must be a non-empty string value'));
    return this;
  }

  if (data.type === 'directory' && !this._moduleSupports('directory')) {
    this.emit('error', new Error('entries of "' + data.type + '" type not currently supported by this module'));
    return;
  }

  source = util.normalizeInputSource(source);

  if (Buffer.isBuffer(source)) {
    data.sourceType = 'buffer';
  } else if (util.isStream(source)) {
    data.sourceType = 'stream';
  } else {
    this.emit('error', new Error('input source must be valid Stream or Buffer instance'));
    return this;
  }

  this._queue.add({
    data: data,
    source: source
  });

  return this;
};

Archiver.prototype.bulk = function(mappings) {
  if (!Array.isArray(mappings)) {
    mappings = [mappings];
  }

  var self = this;
  var files = util.normalizeFilesArray(mappings);

  files.forEach(function(file){
    var isExpandedPair = file.orig.expand || false;
    var fileData = file.data || {};

    file.src.forEach(function(filepath) {
      var data = util._.extend({}, fileData);
      var name = isExpandedPair ? file.dest : util.unixifyPath(file.dest || '', filepath);

      if (name === '.') {
        return;
      }

      var stat = util.stat(filepath);
      var source;

      if (!stat) {
        return;
      }

      data.name = util.sanitizePath(name);
      data.sourcePath = filepath;

      if (stat.isFile()) {
        data.type = 'file';
        data.sourceType = 'stream';

        source = util.lazyReadStream(filepath);
      } else if (stat.isDirectory() && self._moduleSupports('directory')) {
        data.name = util.trailingSlashIt(data.name);
        data.type = 'directory';
        data.sourcePath = util.trailingSlashIt(data.sourcePath);
        data.sourceType = 'buffer';

        source = new Buffer(0);
      } else {
        return;
      }

      self._queue.add({
        data: data,
        source: source
      });
    });
  });

  return this;
};

Archiver.prototype.file = function(filepath, data) {
  data = this._normalizeFileData(data);

  if (typeof filepath !== 'string' || filepath.length === 0) {
    this.emit('error', new Error('filepath must be a non-empty string value'));
    return this;
  }

  if (util.file.isFile(filepath)) {
    if (typeof data.name !== 'string' || data.name.length === 0) {
      data.name = util.sanitizePath(filepath);
    }

    data.sourcePath = filepath;
    data.sourceType = 'stream';

    this._queue.add({
      data: data,
      source: util.lazyReadStream(filepath)
    });
  } else {
    this.emit('error', new Error('invalid file: ' + filepath));
  }

  return this;
};

Archiver.prototype.finalize = function(callback) {
  this._queue.close();

  return this;
};

Archiver.prototype.setModule = function(module) {
  if (this._moduleOutputPiped) {
    this.emit('error', new Error('format module already set'));
    return;
  }

  this._module = module;
  this._pipeModuleOutput();
};

Archiver.prototype.pointer = function() {
  return this._pointer;
};