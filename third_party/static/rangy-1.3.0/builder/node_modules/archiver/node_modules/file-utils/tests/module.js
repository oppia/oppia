'use strict';

var file = require('..');
var File = require('../lib/file');
var _ = require('lodash');

exports['file module'] = {
  'createEnv': function(test) {
    test.expect(6);
    var logger = { bar: 'foo' };
    var src = file.createEnv({
      write: false,
      encoding: 'usc2',
      logger: logger,
      base: 'src/'
    });

    test.equal(src.option('write'), false);
    test.equal(src.option('encoding'), 'usc2');
    test.equal(src.option('logger'), logger);
    test.equal(src.option('base'), 'src/');
    test.notEqual(src, file);
    test.ok(src instanceof File);
    test.done();
  }
};
