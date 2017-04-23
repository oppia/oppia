/**
 * node-zip-stream
 *
 * Copyright (c) 2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-zip-stream/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var util = require('./util');

var debug = util.debug('zip-stream:headers');

var DEFAULT_FILE_MODE = 0100644; // 644 -rw-r--r-- = S_IFREG | S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH
var DEFAULT_DIR_MODE = 040755; // 755 drwxr-xr-x = S_IFDIR | S_IRWXU | S_IRGRP | S_IXGRP | S_IROTH | S_IXOTH
var EXT_FILE_ATTR_DIR = 010173200020; // 755 drwxr-xr-x = (((S_IFDIR | 0755) << 16) | S_DOS_D)
var EXT_FILE_ATTR_FILE = 020151000040; // 644 -rw-r--r-- = (((S_IFREG | 0644) << 16) | S_DOS_A) >>> 0

// Unix file types
var S_IFIFO = 010000; // named pipe (fifo)
var S_IFCHR = 020000; // character special
var S_IFDIR = 040000; // directory
var S_IFBLK = 060000; // block special
var S_IFREG = 0100000; // regular
var S_IFLNK = 0120000; // symbolic link
var S_IFSOCK = 0140000; // socket

var S_IRWXU = 0700; // RWX mask for owner
var S_IRUSR = 0400; // R for owner
var S_IWUSR = 0200; // W for owner
var S_IXUSR = 0100; // X for owner

var S_IRWXG = 070; // RWX mask for group
var S_IRGRP = 040; // R for group
var S_IWGRP = 020; // W for group
var S_IXGRP = 010; // X for group

var S_IRWXO = 07; // RWX mask for other
var S_IROTH = 04; // R for other
var S_IWOTH = 02; // W for other
var S_IXOTH = 01; // X for other

var S_ISVTX = 01000; // save swapped text even after use

// setuid/setgid/sticky bits
var S_ISUID = 04000; // set user id on execution
var S_ISGID = 02000; // set group id on execution
var S_ISTXT = 01000; // sticky bit

// DOS file type flags
var S_DOS_A = 040; // Archive
var S_DOS_D = 020; // Directory
var S_DOS_V = 010; // Volume
var S_DOS_S = 04; // System
var S_DOS_H = 02; // Hidden
var S_DOS_R = 01; // Read Only

function ZipHeader() {
  this.name = 'zipHeader';
  this.bufferSize = 0;
  this.fields = [];
}

ZipHeader.prototype.toBuffer = function(data) {
  var self = this;
  var buf = new Buffer(self.bufferSize);
  var offset = 0;
  var val;
  var valLength;
  var fallback;

  debug('%s:start', self.name);

  data = self._normalize(data);

  self.fields.forEach(function(field) {
    fallback = (field.type === 'string') ? '' : 0;
    val = data[field.name] || field.def || fallback;
    valLength = (field.lenField && data[field.lenField] > 0) ? data[field.lenField] : field.len;

    if (typeof buf['write' + field.type] === 'function') {
      debug('%s:%s:%s:%d+%d', self.name, field.type, field.name, offset, field.len);
      buf['write' + field.type](val, offset);
    } else if (val.length > 0) {
      debug('%s:%s:%d+%d', self.name, field.name, offset, val.length);
      buf.write(val, offset);
    }

    offset += valLength;
  });

  debug('%s:finish:%d', self.name, offset);

  return buf.slice(0, offset);
};

ZipHeader.prototype.toObject = function(buf) {
  var self = this;
  var data = {};
  var offset = 0;
  var valLength;

  self.fields.forEach(function(field) {
    valLength = (field.lenField && data[field.lenField] > 0) ? data[field.lenField] : field.len;

    if (typeof buf['read' + field.type] === 'function') {
      data[field.name] = buf['read' + field.type](offset);
    } else if (valLength > 0) {
      data[field.name] = buf.toString(null, offset, valLength);
    } else {
      data[field.name] = null;
    }

    offset += valLength;
  });

  return data;
};

ZipHeader.prototype._generateExternalAttributes = function(mode, type) {
  var isDir = type === 'directory';

  var owner = (mode >> 6) & 07;
  var group = (mode >> 3) & 07;
  var other = mode & 07;

  var attr = isDir ? S_IFDIR : S_IFREG;
  attr |= ((owner & 07) << 6) | ((group & 07) << 3) | (other & 07);

  return (attr << 16) | (isDir ? S_DOS_D : S_DOS_A);
};

ZipHeader.prototype._normalize = function(data) {
  // Don't always set mode as this is a experimental feature
  // if (!data.mode) {
  //   data.mode = DEFAULT_FILE_MODE;
  // }

  data.filenameLength = 0;
  data.commentLength = 0;
  data.extraFieldLength = 0;

  if (data.name) {
    if (Buffer.byteLength(data.name) !== data.name.length) {
      data.flags |= (1 << 11);
    }

    data.filenameLength = Buffer.byteLength(data.name);
  }

  if (data.comment) {
    if (Buffer.byteLength(data.comment) !== data.comment.length) {
      data.flags |= (1 << 11);
    }

    data.commentLength = Buffer.byteLength(data.comment);
  }

  if (data.extraField) {
    data.extraFieldLength = data.extraField.length;
  }

  if (data.mode) {
    data.mode &= ~S_IFDIR;

    if (data.type === 'file') {
      data.mode |= S_IFREG;
    }

    data.externalFileAttributes &= ~data.externalFileAttributes;
    data.externalFileAttributes |= this._generateExternalAttributes(data.mode, data.type);
    data.externalFileAttributes >>>= 0;
  }

  return data;
};

function ZipHeaderFile() {
  ZipHeader.call(this);

  this.name = 'file';
  this.bufferSize = 1024;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x04034b50},
    {name: 'versionNeededToExtract', len: 2, type: 'UInt16LE', def: 20},
    {name: 'flags', len: 2, type: 'UInt16LE'},
    {name: 'compressionMethod', len: 2, type: 'UInt16LE'},
    {name: 'lastModifiedDate', len: 4, type: 'UInt32LE'},
    {name: 'crc32', len: 4, type: 'UInt32LE', def: 0},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'},
    {name: 'filenameLength', len: 2, type: 'UInt16LE'},
    {name: 'extraFieldLength', len: 2, type: 'UInt16LE'},
    {name: 'name', len: 0, lenField: 'filenameLength', type: 'string'},
    {name: 'extraField', len: 0, lenField: 'extraFieldLength', type: 'string'}
  ];
}
inherits(ZipHeaderFile, ZipHeader);

function ZipHeaderFileDescriptor() {
  ZipHeader.call(this);

  this.name = 'fileDescriptor';
  this.bufferSize = 16;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x08074b50},
    {name: 'crc32', len: 4, type: 'UInt32LE'},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'}
  ];
}
inherits(ZipHeaderFileDescriptor, ZipHeader);

function ZipHeaderCentralDirectory() {
  ZipHeader.call(this);

  this.name = 'centralDirectory';
  this.bufferSize = 1024;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x02014b50},
    {name: 'versionMadeBy', len: 2, type: 'UInt16LE', def: 20},
    {name: 'versionNeededToExtract', len: 2, type: 'UInt16LE', def: 20},
    {name: 'flags', len: 2, type: 'UInt16LE'},
    {name: 'compressionMethod', len: 2, type: 'UInt16LE'},
    {name: 'lastModifiedDate', len: 4, type: 'UInt32LE'},
    {name: 'crc32', len: 4, type: 'UInt32LE'},
    {name: 'compressedSize', len: 4, type: 'UInt32LE'},
    {name: 'uncompressedSize', len: 4, type: 'UInt32LE'},
    {name: 'filenameLength', len: 2, type: 'UInt16LE'},
    {name: 'extranameLength', len: 2, type: 'UInt16LE'},
    {name: 'commentLength', len: 2, type: 'UInt16LE'},
    {name: 'diskNumberStart', len: 2, type: 'UInt16LE'},
    {name: 'internalFileAttributes', len: 2, type: 'UInt16LE'},
    {name: 'externalFileAttributes', len: 4, type: 'UInt32LE'},
    {name: 'offset', len: 4, type: 'UInt32LE'},
    {name: 'name', len: 0, lenField: 'filenameLength', type: 'string'},
    {name: 'extraField', len: 0, lenField: 'extraFieldLength', type: 'string'},
    {name: 'comment', len: 0, lenField: 'commentLength', type: 'string'}
  ];
}
inherits(ZipHeaderCentralDirectory, ZipHeader);

function ZipHeaderCentralFooter() {
  ZipHeader.call(this);

  this.name = 'centralFooter';
  this.bufferSize = 512;
  this.fields = [
    {name: 'signature', len: 4, type: 'UInt32LE', def: 0x06054b50},
    {name: 'diskNumber', len: 2, type: 'UInt16LE'},
    {name: 'diskNumberStart', len: 2, type: 'UInt16LE'},
    {name: 'directoryRecordsDisk', len: 2, type: 'UInt16LE'},
    {name: 'directoryRecords', len: 2, type: 'UInt16LE'},
    {name: 'centralDirectorySize', len: 4, type: 'UInt32LE'},
    {name: 'centralDirectoryOffset', len: 4, type: 'UInt32LE'},
    {name: 'commentLength', len: 2, type: 'UInt16LE'},
    {name: 'comment', len: 0, lenField: 'commentLength', type: 'string'}
  ];
}
inherits(ZipHeaderCentralFooter, ZipHeader);

var headers = {
  file: new ZipHeaderFile(),
  fileDescriptor: new ZipHeaderFileDescriptor(),
  centralDirectory: new ZipHeaderCentralDirectory(),
  centralFooter: new ZipHeaderCentralFooter()
};

var encode = exports.encode = function(type, data) {
  if (!headers[type] || typeof headers[type].toBuffer !== 'function') {
    throw new Error('Unknown encode type');
  }

  return headers[type].toBuffer(data);
};

exports.file = ZipHeaderFile;
exports.fileDescriptor = ZipHeaderFileDescriptor;
exports.centralDirectory = ZipHeaderCentralDirectory;
exports.centralFooter = ZipHeaderCentralFooter;