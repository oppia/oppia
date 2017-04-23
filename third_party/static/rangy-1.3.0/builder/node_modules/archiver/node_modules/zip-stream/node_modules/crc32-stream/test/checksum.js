/*global before,describe,it */
var assert = require('chai').assert;

var helpers = require('./helpers');
var BinaryStream = helpers.BinaryStream;
var DeadEndStream = helpers.DeadEndStream;

var CRC32Stream = require('../lib/crc32-stream.js');

describe('CRC32Stream', function() {
  it('should checksum data while passing through data', function(done) {
    var binary = new BinaryStream(1024 * 16);
    var checksum = new CRC32Stream();
    var deadend = new DeadEndStream();

    checksum.on('end', function() {
      assert.equal(checksum.digest(), 3893830384);
      assert.equal(checksum.hex(), 'E81722F0');
      assert.equal(checksum.size(), 16384);
      done();
    });

    checksum.pipe(deadend);
    binary.pipe(checksum);
  });

  it('should gracefully handle having no data chunks passed to it', function(done) {
    var checksum = new CRC32Stream();
    var deadend = new DeadEndStream();

    checksum.on('end', function() {
      assert.equal(checksum.digest(), 0);
      done();
    });

    checksum.pipe(deadend);
    checksum.end();
  });
});