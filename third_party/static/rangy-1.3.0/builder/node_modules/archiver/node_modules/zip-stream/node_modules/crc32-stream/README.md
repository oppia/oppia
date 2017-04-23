# crc32-stream v0.2.0 [![Build Status](https://travis-ci.org/ctalkington/node-crc32-stream.svg?branch=master)](https://travis-ci.org/ctalkington/node-crc32-stream)

crc32-stream is a streaming CRC32 checksumer. It uses [buffer-crc32](https://www.npmjs.org/package/buffer-crc32) behind the scenes to reliably handle binary data and fancy character sets. Data is passed through untouched.

[![NPM](https://nodei.co/npm/crc32-stream.png)](https://nodei.co/npm/crc32-stream/)

### Install

```bash
npm install crc32-stream --save
```

You can also use `npm install https://github.com/ctalkington/node-crc32-stream/archive/master.tar.gz` to test upcoming versions.

### Usage

```js
var CRC32Stream = require('crc32-stream');

var source = fs.createReadStream('file.txt');
var checksum = new CRC32Stream();

checksum.on('end', function(err) {
  // do something with checksum.digest() here
});

// either pipe it
source.pipe(checksum);

// or write it
checksum.write('string');
checksum.end();
```

### Instance API

Inherits [Transform Stream](http://nodejs.org/api/stream.html#stream_class_stream_transform) methods.

#### digest()

Returns the checksum digest in unsigned form.

#### hex()

Returns the hexadecimal representation of the checksum digest. (ie E81722F0)

#### size()

Returns the raw size/length of passed-through data.

### Instance Options

Inherits [Transform Stream](http://nodejs.org/api/stream.html#stream_class_stream_transform) options.

## Things of Interest

- [Changelog](https://github.com/ctalkington/node-crc32-stream/releases)
- [Contributing](https://github.com/ctalkington/node-crc32-stream/blob/master/CONTRIBUTING.md)
- [MIT License](https://github.com/ctalkington/node-crc32-stream/blob/master/LICENSE-MIT)