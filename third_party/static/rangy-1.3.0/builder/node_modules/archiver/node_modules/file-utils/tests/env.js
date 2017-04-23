'use strict';

var path = require('path');
var fs = require('fs');
var file = require('..');
var _ = require('lodash');
var helpers = require('./helpers/helpers');
var defLogger = require('../lib/logger');

var Tempdir = require('temporary/lib/dir');
var tmpdir = new Tempdir();

exports['Env()'] = {
  'setUp': function(done) {
    this.fixtures = file.createEnv({ base: path.join(__dirname, 'fixtures') });
    this.env = file.createEnv({ base: path.join(tmpdir.path, '/env/scope') });
    done();
  },
  'inherits from global file config': function(test) {
    test.expect(3);
    var logger = { bar: 'foo' };
    file.option('logger', logger);
    file.option('write', false);
    var env = file.createEnv();
    test.deepEqual(env.option('logger'), logger, 'logger should be inherited');
    test.deepEqual(env.log, file.log, 'logger should be inherited');
    test.equal(env.option('write'), false, 'write state should be inherited');
    file.option('write', true);
    file.option('logger', defLogger);
    test.done();
  },
  'read': function(test) {
    test.expect(1);
    helpers.assertTextEqual(this.fixtures.read('utf8.txt'), 'Ação é isso aí\n', test, 'file should be read from base path.');
    test.done();
  },
  'readJSON': function(test) {
    test.expect(1);
    var obj = {foo: 'Ação é isso aí', bar: ['ømg', 'pønies']};
    var fileContent = this.fixtures.readJSON('utf8.json');
    test.deepEqual(fileContent, obj, 'file should be read from base path and parsed correctly.');
    test.done();
  },
  'write': function(test) {
    test.expect(1);
    var str = 'foo bar';
    this.env.write('write.txt', str);
    test.strictEqual(fs.readFileSync(path.join(tmpdir.path, '/env/scope', 'write.txt'), 'utf8'), str, 'file should be written in the root dir.');
    test.done();
  },
  'copy': function(test) {
    test.expect(1);
    var root = 'utf8.txt';
    var dest = path.join( tmpdir.path, 'copy.txt');
    this.fixtures.copy(root, dest);

    var initial = this.fixtures.read(root);
    var copied = fs.readFileSync(dest, 'utf8');

    test.strictEqual(initial, copied, 'File should be copied from the root dir');

    test.done();
  },
  'copy with dest': function(test) {
    test.expect(1);
    var dest = path.join(tmpdir.path, '/copy');
    var env = file.createEnv({
      base: path.join(__dirname, 'fixtures'),
      dest: dest
    });

    env.copy('utf8.txt', 'utf-8.txt');

    var initial = this.fixtures.read('utf8.txt');
    var copied = fs.readFileSync(dest + '/utf-8.txt', 'utf8');
    test.strictEqual(initial, copied, 'File should be copied from the root dir to the dest dir');
    test.done();
  },
  'delete': function(test) {
    test.expect(3);
    this.env.write('delete.txt', 'foo');
    test.ok(file.exists(path.join(tmpdir.path, '/env/scope', 'delete.txt')), 'file should exist');
    test.ok(this.env.delete('delete.txt'), 'return true if it delete the file');
    test.ok(!file.exists(path.join(tmpdir.path, '/env/scope', 'delete.txt')), 'file should\'ve been deleted');
    test.done();
  },
  'mkdir': function(test) {
    test.expect(2);

    test.doesNotThrow(function() {
      this.env.mkdir('aa/bb/cc');
    }.bind(this), 'Should also not explode');
    test.ok(file.isDir(this.env.fromBase('aa/bb/cc')), 'path should have been created.');

    this.env.delete('aa/bb/cc');

    test.done();
  },
  'recurse': function(test) {
    test.expect(1);
    var rootdir = this.fixtures.fromBase('expand').replace(/\\/g, '/');
    var expected = {};
    expected[rootdir + '/css/baz.css'] = [rootdir, 'css', 'baz.css'];
    expected[rootdir + '/css/qux.css'] = [rootdir, 'css', 'qux.css'];
    expected[rootdir + '/deep/deep.txt'] = [rootdir, 'deep', 'deep.txt'];
    expected[rootdir + '/deep/deeper/deeper.txt'] = [rootdir, 'deep/deeper', 'deeper.txt'];
    expected[rootdir + '/deep/deeper/deepest/deepest.txt'] = [rootdir, 'deep/deeper/deepest', 'deepest.txt'];
    expected[rootdir + '/js/bar.js'] = [rootdir, 'js', 'bar.js'];
    expected[rootdir + '/js/foo.js'] = [rootdir, 'js', 'foo.js'];
    expected[rootdir + '/README.md'] = [rootdir, undefined, 'README.md'];

    var actual = {};
    this.fixtures.recurse('expand', function(abspath, rootdir, subdir, filename) {
      actual[abspath] = [rootdir.replace(/\\/g, '/'), subdir, filename];
    });

    test.deepEqual(actual, expected, 'paths and arguments should match.');
    test.done();
  },
  'setBase': function(test) {
    this.env.setBase('foo');
    test.equal(this.env.fromBase('bar').replace(/\\/g, '/'), 'foo/bar');
    test.done();
  },
  'setDestBase': function(test) {
    this.env.setDestBase('foo');
    test.equal(this.env.fromDestBase('bar').replace(/\\/g, '/'), 'foo/bar');
    test.done();
  },
  'setBase as function': function(test) {
    this.env.setBase(function () { return 'foo'; });
    test.equal(this.env.fromBase('bar').replace(/\\/g, '/'), 'foo/bar');
    test.done();
  },
  'setDestBase as function': function(test) {
    this.env.setDestBase(function () { return 'foo'; });
    test.equal(this.env.fromDestBase('bar').replace(/\\/g, '/'), 'foo/bar');
    test.done();
  }
};

exports['Env() filters'] = {
  'setUp': function(done) {
    this.env = file.createEnv({ base: tmpdir.path });
    done();
  },
  '.registerWriteFilter() synchronous and apply output': function(test) {
    test.expect(3);
    this.env.registerWriteFilter('tmp', function(file) {
      test.equal(file.path, 'foo');
      test.equal(file.contents, 'bar');
      return { path: 'simple-filter', contents: 'test' };
    });
    this.env.write('foo', 'bar');
    var written = this.env.read('simple-filter');
    test.equal(written, 'test', 'should have written the filtered file and path');
    test.done();
  },
  'pipe all filters': function(test) {
    test.expect(4);
    this.env.registerWriteFilter('1', function(file) {
      test.equal(file.path, 'foo');
      test.equal(file.contents, 'bar');
      return { path: 'piped-filter', contents: 'test' };
    });
    this.env.registerWriteFilter('2', function(file) {
      test.equal(file.path, 'piped-filter');
      test.equal(file.contents, 'test');
      return file;
    });
    this.env.write('foo', 'bar');
    test.done();
  },
  '.removeWriteFilter()': function(test) {
    test.expect(1);
    this.env.registerWriteFilter('broke', function(file) {
      test.ok(false);
      return { path: 'broke', contents: 'broke' };
    });
    this.env.removeWriteFilter('broke');
    this.env.write('no-filter', 'bar');
    var written = this.env.read('no-filter');
    test.equal(written, 'bar', 'should have removed the filter');
    test.done();
  },
  'Async write filter': function(test) {
    test.expect(2);
    this.env._actualWrite = function(filepath, contents) {
      test.equal(filepath, 'async-write');
      test.equal(contents, 'puts async');
      test.done();
    };

    this.env.registerWriteFilter('async', function() {
      var done = this.async();
      setTimeout(function() {
        done({ path: 'async-write', contents: 'puts async' });
      }, 10);
    });

    this.env.write('foo', 'bar');
  },
  '.registerValidationFilter': {
    'setUp': function(done) {
      var self = this;
      this.env.option('logger', _.extend({}, require('../lib/logger'), {
        write: function(msg) {
          self.errMsg = msg;
        }
      }));
      done();
    },
    'passing validation': function(test) {
      test.expect(3);
      this.env.registerValidationFilter('tmp', function(file) {
        test.equal(file.path, 'foo');
        test.equal(file.contents, 'bar');
        return true;
      });
      this.env.write('foo', 'bar');
      var written = this.env.read('simple-filter');
      test.equal(written, 'test', 'should have written the filtered file and path');
      test.done();
    },
    'failing validation': function(test) {
      test.expect(2);
      this.env.registerValidationFilter('tmp', function(file) { return false; });
      this.env.write('failing-filter', 'bar');
      test.ok(!file.exists(this.env.fromBase('failing-filter')), 'should have written the filtered file and path');
      test.equal(this.errMsg, 'Not actually writing to failing-filter haven\'t pass validation', 'default error message is log');
      test.done();
    },
    'validation with text file': function(test) {
      test.expect(1);
      this.env.registerValidationFilter('tmp', function(file) {
        test.ok(typeof file.contents === 'string');
        test.done();
        return 'abort';
      });
      var textPath = path.join(__dirname, 'fixtures/utf8.txt');
      this.env.copy(textPath, textPath);
    },
    'validation with binary file': function(test) {
      test.expect(1);
      this.env.registerValidationFilter('tmp', function(file) {
        test.ok(file.contents instanceof Buffer);
        test.done();
        return 'abort';
      });
      var binaryPath = path.join(__dirname, 'fixtures/octocat.png');
      this.env.copy(binaryPath, binaryPath);
    },
    'failing validation and custom error message': function(test) {
      test.expect(2);
      this.env.registerValidationFilter('tmp', function(file) { return 'a bad error'; });
      this.env.write('failing-filter', 'bar');
      test.ok(!file.exists(this.env.fromBase('failing-filter')), 'should not have written');
      test.equal(this.errMsg, 'a bad error', 'custom error message is log');
      test.done();
    },
    'async validator': function(test) {
      var self = this;
      test.expect(1);
      this.env._actualWrite = function() { test.ok(false, 'should not be call') };
      this.env.registerValidationFilter('tmp', function(file) {
        var done = this.async();
        setTimeout(function() {
          done('a bad error');
          test.equal(self.errMsg, 'a bad error', 'custom error message is log');
          test.done();
        }, 10);
      });
      this.env.write('async-failing-filter', 'bar');
    }
  },
  '.removeValidationFilter': function(test) {
    test.expect(1);
    this.env.registerValidationFilter('no-run', function() {
      test.ok(false, 'shouldn\'t run the filter');
    });
    this.env.removeValidationFilter('no-run');
    this.env.write('removed-validation', 'bar');
    test.ok(true);
    test.done();
  }
};
