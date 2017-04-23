/**
 * node-zip-stream
 *
 * Copyright (c) 2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-zip-stream/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;

var crc32 = require('buffer-crc32');
var ChecksumStream = require('crc32-stream');
var DeflateCRC32Stream = require('deflate-crc32-stream');
var headers = require('./headers');
var util = require('./util');

var debug = util.debug('zip-stream:instance');
var debugEntry = util.debug('zip-stream:entry');

var ZipStream = module.exports = function(options) {
  if (!(this instanceof ZipStream)) {
    return new ZipStream(options);
  }

  debug('init');

  options = this.options = util.defaults(options, {
    highWaterMark: 1024 * 1024,
    comment: '',
    forceUTC: false,
    store: false
  });

  if (typeof options.zlib !== 'object') {
    options.zlib = {};
  }

  if (typeof options.level === 'number' && options.level >= 0) {
    options.zlib.level = options.level;
    delete options.level;
  } else if (typeof options.zlib.level !== 'number') {
    options.zlib.level = 1;
  }

  if (options.zlib.level === 0) {
    options.store = true;
  }

  Transform.call(this, options);

  this.offset = 0;
  this.entries = [];

  this._finalize = false;
  this._finalized = false;
  this._processing = false;

  this.once('end', function() {
    debug('stats:' + this.entries.length + 'e:' + this.offset + 'b');
    debug('end');
  });
};

inherits(ZipStream, Transform);

ZipStream.prototype._afterAppend = function(entry) {
  debugEntry('%s:finish', entry.name);

  this.entries.push(entry);
  this._processing = false;

  if (this._finalize) {
    this.finalize();
  }
};

ZipStream.prototype._appendBuffer = function(source, data, callback) {
  var self = this;

  data.offset = self.offset;

  if (source.length === 0) {
    data.store = true;
    data.compressionMethod = 0;
  }

  if (data.store) {
    data.uncompressedSize = source.length;
    data.compressedSize = data.uncompressedSize;
    data.crc32 = crc32.unsigned(source);
  } else {
    data.flags |= (1 << 3);
  }

  self._writeHeader('file', data);

  if (data.store) {
    self.write(source);
    self._afterAppend(data);
    callback(null, data);
  } else {
    var processStream = self._newProcessStream(data.store, function(err) {
      if (err) {
        return callback(err);
      }

      data.crc32 = processStream.digest();
      data.uncompressedSize = processStream.size();
      data.compressedSize = processStream.compressedSize || data.uncompressedSize;

      self._writeHeader('fileDescriptor', data);
      self._afterAppend(data);
      callback(null, data);
    });

    processStream.end(source);
  }
};

ZipStream.prototype._appendStream = function(source, data, callback) {
  var self = this;

  data.flags |= (1 << 3);
  data.offset = self.offset;

  self._writeHeader('file', data);

  var processStream = self._newProcessStream(data.store, function(err) {
    if (err) {
      return callback(err);
    }

    data.crc32 = processStream.digest();
    data.uncompressedSize = processStream.size();
    data.compressedSize = processStream.size(true);

    self._writeHeader('fileDescriptor', data);
    self._afterAppend(data);
    callback(null, data);
  });

  source.pipe(processStream);
};

ZipStream.prototype._emitErrorCallback = function(err, data) {
  if (err) {
    this.emit('error', err);
  }
};

ZipStream.prototype._newProcessStream = function(store, callback) {
  var process;

  if (store) {
    process = new ChecksumStream();
  } else {
    process = new DeflateCRC32Stream(this.options.zlib);
  }

  if (typeof callback === 'function') {
    process.once('error', callback);
    process.once('end', callback);
  }

  process.pipe(this, { end: false });

  return process;
};

ZipStream.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    type: 'file',
    name: null,
    date: null,
    store: this.options.store,
    comment: ''
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

  if (isDir) {
    data.store = true;
  }

  if (typeof data.lastModifiedDate !== 'number') {
    data.lastModifiedDate = util.dosDateTime(data.date, this.options.forceUTC);
  }

  data.flags = 0;
  data.compressionMethod = data.store ? 0 : 8;
  data.uncompressedSize = 0;
  data.compressedSize = 0;

  return data;
};

ZipStream.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

ZipStream.prototype._writeCentralDirectory = function() {
  var entries = this.entries;
  var comment = this.options.comment;
  var cdoffset = this.offset;
  var cdsize = 0;

  var centralDirectoryBuffer;
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];

    centralDirectoryBuffer = this._writeHeader('centralDirectory', entry);
    cdsize += centralDirectoryBuffer.length;
  }

  var centralDirectoryFooterData = {
    directoryRecordsDisk: entries.length,
    directoryRecords: entries.length,
    centralDirectorySize: cdsize,
    centralDirectoryOffset: cdoffset,
    comment: comment
  };

  this._writeHeader('centralFooter', centralDirectoryFooterData);
};

ZipStream.prototype._writeHeader = function(type, data) {
  var encoded = headers.encode(type, data);
  this.write(encoded);

  return encoded;
};

ZipStream.prototype.entry = function(source, data, callback) {
  if (typeof callback !== 'function') {
    callback = this._emitErrorCallback.bind(this);
  }

  if (this._processing) {
    callback(new Error('already processing an entry'));
    return;
  }

  if (this._finalize || this._finalized) {
    callback(new Error('entry after finalize()'));
    return;
  }

  data = this._normalizeFileData(data);
  debugEntry('%s:start', data.name);

  if (data.type !== 'file' && data.type !== 'directory') {
    callback(new Error(data.type + ' entries not currently supported'));
    return;
  }

  if (typeof data.name !== 'string' || data.name.length === 0) {
    callback(new Error('entry name must be a non-empty string value'));
    return;
  }

  this._processing = true;
  source = util.normalizeInputSource(source);

  if (Buffer.isBuffer(source)) {
    debugEntry('%s:source:buffer', data.name);
    this._appendBuffer(source, data, callback);
  } else if (util.isStream(source)) {
    debugEntry('%s:source:stream', data.name);
    this._appendStream(source, data, callback);
  } else {
    this._processing = false;
    callback(new Error('input source must be valid Stream or Buffer instance'));
    return;
  }
};

ZipStream.prototype.finalize = function() {
  if (this._processing) {
    this._finalize = true;
    return;
  }

  debug('finalize');
  this._writeCentralDirectory();
  this._finalized = true;
  debug('finalized');
  this.end();
};

ZipStream.prototype.write = function(chunk, cb) {
  if (chunk) {
    this.offset += chunk.length;
  }

  return Transform.prototype.write.call(this, chunk, cb);
};