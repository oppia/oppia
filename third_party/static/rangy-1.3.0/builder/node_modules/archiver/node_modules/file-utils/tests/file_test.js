'use strict';

var file = require('..');

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers/helpers');

var Tempfile = require('temporary/lib/file');
var Tempdir = require('temporary/lib/dir');

var tmpdir = new Tempdir();
fs.symlinkSync(path.resolve('tests/fixtures/octocat.png'), path.join(tmpdir.path, 'octocat.png'), 'file');
fs.symlinkSync(path.resolve('tests/fixtures/expand'), path.join(tmpdir.path, 'expand'), 'dir');

exports['file.match'] = {
  'empty set': function(test) {
    test.expect(12);
    // Should return empty set if a required argument is missing or an empty set.
    test.deepEqual(file.match(null, null), [], 'should return empty set.');
    test.deepEqual(file.match({}, null, null), [], 'should return empty set.');
    test.deepEqual(file.match(null, 'foo.js'), [], 'should return empty set.');
    test.deepEqual(file.match('*.js', null), [], 'should return empty set.');
    test.deepEqual(file.match({}, null, 'foo.js'), [], 'should return empty set.');
    test.deepEqual(file.match({}, '*.js', null), [], 'should return empty set.');
    test.deepEqual(file.match({}, [], 'foo.js'), [], 'should return empty set.');
    test.deepEqual(file.match({}, '*.js', []), [], 'should return empty set.');
    test.deepEqual(file.match(null, ['foo.js']), [], 'should return empty set.');
    test.deepEqual(file.match(['*.js'], null), [], 'should return empty set.');
    test.deepEqual(file.match({}, null, ['foo.js']), [], 'should return empty set.');
    test.deepEqual(file.match({}, ['*.js'], null), [], 'should return empty set.');
    test.done();
  },
  'basic matching': function(test) {
    test.expect(6);
    test.deepEqual(file.match('*.js', 'foo.js'), ['foo.js'], 'should match correctly.');
    test.deepEqual(file.match('*.js', ['foo.js']), ['foo.js'], 'should match correctly.');
    test.deepEqual(file.match('*.js', ['foo.js', 'bar.css']), ['foo.js'], 'should match correctly.');
    test.deepEqual(file.match(['*.js', '*.css'], 'foo.js'), ['foo.js'], 'should match correctly.');
    test.deepEqual(file.match(['*.js', '*.css'], ['foo.js']), ['foo.js'], 'should match correctly.');
    test.deepEqual(file.match(['*.js', '*.css'], ['foo.js', 'bar.css']), ['foo.js', 'bar.css'], 'should match correctly.');
    test.done();
  },
  'no matches': function(test) {
    test.expect(2);
    test.deepEqual(file.match('*.js', 'foo.css'), [], 'should fail to match.');
    test.deepEqual(file.match('*.js', ['foo.css', 'bar.css']), [], 'should fail to match.');
    test.done();
  },
  'unique': function(test) {
    test.expect(2);
    test.deepEqual(file.match('*.js', ['foo.js', 'foo.js']), ['foo.js'], 'should return a uniqued set.');
    test.deepEqual(file.match(['*.js', '*.*'], ['foo.js', 'foo.js']), ['foo.js'], 'should return a uniqued set.');
    test.done();
  },
  'flatten': function(test) {
    test.expect(1);
    test.deepEqual(file.match([['*.js', '*.css'], ['*.*', '*.js']], ['foo.js', 'bar.css']), ['foo.js', 'bar.css'], 'should process nested pattern arrays correctly.');
    test.done();
  },
  'exclusion': function(test) {
    test.expect(5);
    test.deepEqual(file.match(['!*.js'], ['foo.js', 'bar.js']), [], 'solitary exclusion should match nothing');
    test.deepEqual(file.match(['*.js', '!*.js'], ['foo.js', 'bar.js']), [], 'exclusion should cancel match');
    test.deepEqual(file.match(['*.js', '!f*.js'], ['foo.js', 'bar.js', 'baz.js']), ['bar.js', 'baz.js'], 'partial exclusion should partially cancel match');
    test.deepEqual(file.match(['*.js', '!*.js', 'b*.js'], ['foo.js', 'bar.js', 'baz.js']), ['bar.js', 'baz.js'], 'inclusion / exclusion order matters');
    test.deepEqual(file.match(['*.js', '!f*.js', '*.js'], ['foo.js', 'bar.js', 'baz.js']), ['bar.js', 'baz.js', 'foo.js'], 'inclusion / exclusion order matters');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(2);
    test.deepEqual(file.match({matchBase: true}, '*.js', ['foo.js', 'bar', 'baz/xyz.js']), ['foo.js', 'baz/xyz.js'], 'should matchBase (minimatch) when specified.');
    test.deepEqual(file.match('*.js', ['foo.js', 'bar', 'baz/xyz.js']), ['foo.js'], 'should not matchBase (minimatch) by default.');
    test.done();
  }
};

exports['file.isMatch'] = {
  'basic matching': function(test) {
    test.expect(6);
    test.ok(file.isMatch('*.js', 'foo.js'), 'should match correctly.');
    test.ok(file.isMatch('*.js', ['foo.js']), 'should match correctly.');
    test.ok(file.isMatch('*.js', ['foo.js', 'bar.css']), 'should match correctly.');
    test.ok(file.isMatch(['*.js', '*.css'], 'foo.js'), 'should match correctly.');
    test.ok(file.isMatch(['*.js', '*.css'], ['foo.js']), 'should match correctly.');
    test.ok(file.isMatch(['*.js', '*.css'], ['foo.js', 'bar.css']), 'should match correctly.');
    test.done();
  },
  'no matches': function(test) {
    test.expect(6);
    test.equal(file.isMatch('*.js', 'foo.css'), false, 'should fail to match.');
    test.equal(file.isMatch('*.js', ['foo.css', 'bar.css']), false, 'should fail to match.');
    test.equal(file.isMatch(null, 'foo.css'), false, 'should fail to match.');
    test.equal(file.isMatch('*.js', null), false, 'should fail to match.');
    test.equal(file.isMatch([], 'foo.css'), false, 'should fail to match.');
    test.equal(file.isMatch('*.js', []), false, 'should fail to match.');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(2);
    test.ok(file.isMatch({matchBase: true}, '*.js', ['baz/xyz.js']), 'should matchBase (minimatch) when specified.');
    test.equal(file.isMatch('*.js', ['baz/xyz.js']), false, 'should not matchBase (minimatch) by default.');
    test.done();
  }
};

exports['file.expand*'] = {
  setUp: function(done) {
    this.cwd = process.cwd();
    process.chdir('tests/fixtures/expand');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.cwd);
    done();
  },
  'basic matching': function(test) {
    test.expect(8);
    test.deepEqual(file.expand('**/*.js'), ['js/bar.js', 'js/foo.js'], 'should match.');
    test.deepEqual(file.expand('**/*.js', '**/*.css'), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'should match.');
    test.deepEqual(file.expand(['**/*.js', '**/*.css']), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'should match.');
    test.deepEqual(file.expand('**d*/**'), [
      'deep',
      'deep/deep.txt',
      'deep/deeper',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest',
      'deep/deeper/deepest/deepest.txt'], 'should match files and directories.');
    test.deepEqual(file.expand({mark: true}, '**d*/**'), [
      'deep/',
      'deep/deep.txt',
      'deep/deeper/',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest/',
      'deep/deeper/deepest/deepest.txt'], 'the minimatch "mark" option ensures directories end in /.');
    test.deepEqual(file.expand('**d*/**/'), [
      'deep/',
      'deep/deeper/',
      'deep/deeper/deepest/'], 'should match directories, arbitrary / at the end appears in matches.');
    test.deepEqual(file.expand({mark: true}, '**d*/**/'), [
      'deep/',
      'deep/deeper/',
      'deep/deeper/deepest/'], 'should match directories, arbitrary / at the end appears in matches.');
    test.deepEqual(file.expand('*.xyz'), [], 'should fail to match.');
    test.done();
  },
  'filter': function(test) {
    test.expect(5);
    test.deepEqual(file.expand({filter: 'isFile'}, '**d*/**'), [
      'deep/deep.txt',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest/deepest.txt'
    ], 'should match files only.');
    test.deepEqual(file.expand({filter: 'isDirectory'}, '**d*/**'), [
      'deep',
      'deep/deeper',
      'deep/deeper/deepest'
    ], 'should match directories only.');
    test.deepEqual(file.expand({filter: function(filepath) { return (/deepest/).test(filepath); }}, '**'), [
      'deep/deeper/deepest',
      'deep/deeper/deepest/deepest.txt',
    ], 'should filter arbitrarily.');
    test.deepEqual(file.expand({filter: 'isFile'}, 'js', 'css'), [], 'should fail to match.');
    test.deepEqual(file.expand({filter: 'isDirectory'}, '**/*.js'), [], 'should fail to match.');
    test.done();
  },
  'unique': function(test) {
    test.expect(4);
    test.deepEqual(file.expand('**/*.js', 'js/*.js'), ['js/bar.js', 'js/foo.js'], 'file list should be uniqed.');
    test.deepEqual(file.expand('**/*.js', '**/*.css', 'js/*.js'), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'file list should be uniqed.');
    test.deepEqual(file.expand('js', 'js/'), ['js', 'js/'], 'mixed non-ending-/ and ending-/ dirs will not be uniqed by default.');
    test.deepEqual(file.expand({mark: true}, 'js', 'js/'), ['js/'], 'mixed non-ending-/ and ending-/ dirs will be uniqed when "mark" is specified.');
    test.done();
  },
  'file order': function(test) {
    test.expect(4);
    var actual = file.expand('**/*.{js,css}');
    var expected = ['css/baz.css', 'css/qux.css', 'js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'should select 4 files in this order, by default.');

    actual = file.expand('js/foo.js', 'js/bar.js', '**/*.{js,css}');
    expected = ['js/foo.js', 'js/bar.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');

    actual = file.expand('js/bar.js', 'js/foo.js', '**/*.{js,css}');
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');

    actual = file.expand('js/foo.js', '**/*.{js,css}', '!js/bar.js', 'js/bar.js');
    expected = ['js/foo.js', 'css/baz.css', 'css/qux.css', 'js/bar.js'];
    test.deepEqual(actual, expected, 'if a file is excluded and then re-added, it should be added at the end.');
    test.done();
  },
  'flatten': function(test) {
    test.expect(1);
    test.deepEqual(file.expand([['**/*.js'], ['**/*.css', 'js/*.js']]), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'should match.');
    test.done();
  },
  'exclusion': function(test) {
    test.expect(8);
    test.deepEqual(file.expand(['!js/*.js']), [], 'solitary exclusion should match nothing');
    test.deepEqual(file.expand(['js/bar.js','!js/bar.js']), [], 'exclusion should cancel match');
    test.deepEqual(file.expand(['**/*.js', '!js/foo.js']), ['js/bar.js'], 'should omit single file from matched set');
    test.deepEqual(file.expand(['!js/foo.js', '**/*.js']), ['js/bar.js', 'js/foo.js'], 'inclusion / exclusion order matters');
    test.deepEqual(file.expand(['**/*.js', '**/*.css', '!js/bar.js', '!css/baz.css']), ['js/foo.js','css/qux.css'], 'multiple exclusions should be removed from the set');
    test.deepEqual(file.expand(['**/*.js', '**/*.css', '!**/*.css']), ['js/bar.js', 'js/foo.js'], 'excluded wildcards should be removed from the matched set');
    test.deepEqual(file.expand(['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css', '!**/b*.*']), ['js/foo.js', 'css/qux.css'], 'different pattern for exclusion should still work');
    test.deepEqual(file.expand(['js/bar.js', '!**/b*.*', 'js/foo.js', 'css/baz.css', 'css/qux.css']), ['js/foo.js', 'css/baz.css', 'css/qux.css'], 'inclusion / exclusion order matters');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(4);
    var opts = {matchBase: true};
    test.deepEqual(file.expand('*.js'), [], 'should not matchBase (minimatch) by default.');
    test.deepEqual(file.expand(opts, '*.js'), ['js/bar.js', 'js/foo.js'], 'options should be passed through to minimatch.');
    test.deepEqual(file.expand(opts, '*.js', '*.css'), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'should match.');
    test.deepEqual(file.expand(opts, ['*.js', '*.css']), ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'], 'should match.');
    test.done();
  },
  'options.cwd': function(test) {
    test.expect(4);
    var cwd = path.resolve(process.cwd(), '..');
    test.deepEqual(file.expand({cwd: cwd}, ['expand/js', 'expand/js/*']), ['expand/js', 'expand/js/bar.js', 'expand/js/foo.js'], 'should match.');
    test.deepEqual(file.expand({cwd: cwd, filter: 'isFile'}, ['expand/js', 'expand/js/*']), ['expand/js/bar.js', 'expand/js/foo.js'], 'should match.');
    test.deepEqual(file.expand({cwd: cwd, filter: 'isDirectory'}, ['expand/js', 'expand/js/*']), ['expand/js'], 'should match.');
    test.deepEqual(file.expand({cwd: cwd, filter: 'isFile'}, ['expand/js', 'expand/js/*', '!**/b*.js']), ['expand/js/foo.js'], 'should negate properly.');
    test.done();
  },
  'options.nonull': function(test) {
    test.expect(2);
    var opts = {nonull: true};
    test.deepEqual(file.expand(opts, ['js/a*', 'js/b*', 'js/c*']), ['js/a*', 'js/bar.js', 'js/c*'], 'non-matching patterns should be returned in result set.');
    test.deepEqual(file.expand(opts, ['js/foo.js', 'js/bar.js', 'js/baz.js']), ['js/foo.js', 'js/bar.js', 'js/baz.js'], 'non-matching filenames should be returned in result set.');
    test.done();
  },
};

exports['file.expandMapping'] = {
  setUp: function(done) {
    this.cwd = process.cwd();
    process.chdir('tests/fixtures');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.cwd);
    done();
  },
  'basic matching': function(test) {
    test.expect(2);

    var actual = file.expandMapping(['expand/**/*.txt'], 'dest');
    var expected = [
      {dest: 'dest/expand/deep/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/expand/deep/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/expand/deep/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    test.deepEqual(actual, expected, 'basic src-dest options');

    actual = file.expandMapping(['expand/**/*.txt'], 'dest/');
    test.deepEqual(actual, expected, 'destBase should behave the same both with or without trailing slash');

    test.done();
  },
  'flatten': function(test) {
    test.expect(1);
    var actual = file.expandMapping(['expand/**/*.txt'], 'dest', {flatten: true});
    var expected = [
      {dest: 'dest/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    test.deepEqual(actual, expected, 'dest paths should be flattened pre-destBase+destPath join');
    test.done();
  },
  'ext': function(test) {
    test.expect(2);
    var actual, expected;
    actual = file.expandMapping(['expand/**/*.txt'], 'dest', {ext: '.foo'});
    expected = [
      {dest: 'dest/expand/deep/deep.foo', src: ['expand/deep/deep.txt']},
      {dest: 'dest/expand/deep/deeper/deeper.foo', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/expand/deep/deeper/deepest/deepest.foo', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    test.deepEqual(actual, expected, 'specified extension should be added');
    actual = file.expandMapping(['expand-mapping-ext/**/file*'], 'dest', {ext: '.foo'});
    expected = [
      {dest: 'dest/expand-mapping-ext/dir.ectory/file-no-extension.foo', src: ['expand-mapping-ext/dir.ectory/file-no-extension']},
      {dest: 'dest/expand-mapping-ext/dir.ectory/sub.dir.ectory/file.foo', src: ['expand-mapping-ext/dir.ectory/sub.dir.ectory/file.ext.ension']},
      {dest: 'dest/expand-mapping-ext/file.foo', src: ['expand-mapping-ext/file.ext.ension']},
    ];
    test.deepEqual(actual, expected, 'specified extension should be added');
    test.done();
  },
  'cwd': function(test) {
    test.expect(1);
    var actual = file.expandMapping(['**/*.txt'], 'dest', {cwd: 'expand'});
    var expected = [
      {dest: 'dest/deep/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/deep/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/deep/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    test.deepEqual(actual, expected, 'cwd should be stripped from front of destPath, pre-destBase+destPath join');
    test.done();
  },
  'rename': function(test) {
    test.expect(1);
    var actual = file.expandMapping(['**/*.txt'], 'dest', {
      cwd: 'expand',
      flatten: true,
      rename: function(destBase, destPath, options) {
        return path.join(destBase, options.cwd, 'o-m-g', destPath);
      }
    });
    var expected = [
      {dest: 'dest/expand/o-m-g/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/expand/o-m-g/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/expand/o-m-g/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    test.deepEqual(actual, expected, 'custom rename function should be used to build dest, post-flatten');
    test.done();
  },
  'rename to same dest': function(test) {
    test.expect(1);
    var actual = file.expandMapping(['**/*'], 'dest', {
      filter: 'isFile',
      cwd: 'expand',
      flatten: true,
      rename: function(destBase, destPath) {
        return path.join(destBase, 'all' + path.extname(destPath));
      }
    });
    var expected = [
      {dest: 'dest/all.md', src: ['expand/README.md']},
      {dest: 'dest/all.css', src: ['expand/css/baz.css', 'expand/css/qux.css']},
      {dest: 'dest/all.txt', src: ['expand/deep/deep.txt', 'expand/deep/deeper/deeper.txt', 'expand/deep/deeper/deepest/deepest.txt']},
      {dest: 'dest/all.js', src: ['expand/js/bar.js', 'expand/js/foo.js']},
    ];
    test.deepEqual(actual, expected, 'if dest is same for multiple src, create an array of src');
    test.done();
  },
};


// Compare two buffers. Returns true if they are equivalent.
var compareBuffers = function(buf1, buf2) {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2)) { return false; }
  if (buf1.length !== buf2.length) { return false; }
  for (var i = 0; i < buf2.length; i++) {
    if (buf1[i] !== buf2[i]) { return false; }
  }
  return true;
};

// Compare two files. Returns true if they are equivalent.
var compareFiles = function(filepath1, filepath2) {
  return compareBuffers(fs.readFileSync(filepath1), fs.readFileSync(filepath2));
};

exports['file'] = {
  setUp: function(done) {
    this.defaultEncoding = file.option('encoding');
    file.option('encoding', 'utf8');
    this.string = 'Ação é isso aí\n';
    this.object = {foo: 'Ação é isso aí', bar: ['ømg', 'pønies']};
    this.writeOption = file.option('write');
    done();
  },
  tearDown: function(done) {
    file.option('encoding', this.defaultEncoding);
    file.option('write', this.writeOption);
    done();
  },
  'read': function(test) {
    test.expect(5);
    helpers.assertTextEqual(file.read('tests/fixtures/utf8.txt'), this.string, test, 'file should be read as utf8 by default.');
    helpers.assertTextEqual(file.read('tests/fixtures/iso-8859-1.txt', {encoding: 'iso-8859-1'}), this.string,test, 'file should be read using the specified encoding.');
    test.ok(compareBuffers(file.read('tests/fixtures/octocat.png', {encoding: null}), fs.readFileSync('tests/fixtures/octocat.png')), 'file should be read as a buffer if encoding is specified as null.');
    test.strictEqual(file.read('tests/fixtures/BOM.txt'), 'foo', 'file should have BOM stripped.');

    file.option('encoding', 'iso-8859-1');
    helpers.assertTextEqual(file.read('tests/fixtures/iso-8859-1.txt'), this.string, test, 'changing the default encoding should work.');
    test.done();
  },
  'readJSON': function(test) {
    test.expect(3);
    var obj;
    obj = file.readJSON('tests/fixtures/utf8.json');
    test.deepEqual(obj, this.object, 'file should be read as utf8 by default and parsed correctly.');

    obj = file.readJSON('tests/fixtures/iso-8859-1.json', {encoding: 'iso-8859-1'});
    test.deepEqual(obj, this.object, 'file should be read using the specified encoding.');

    file.option('encoding', 'iso-8859-1');
    obj = file.readJSON('tests/fixtures/iso-8859-1.json');
    test.deepEqual(obj, this.object, 'changing the default encoding should work.');
    test.done();
  },
  'write': function(test) {
    test.expect(5);
    var tmpfile;
    tmpfile = new Tempfile();
    file.write(tmpfile.path, this.string);
    test.strictEqual(fs.readFileSync(tmpfile.path, 'utf8'), this.string, 'file should be written as utf8 by default.');
    tmpfile.unlinkSync();

    tmpfile = new Tempfile();
    file.write(tmpfile.path, this.string, {encoding: 'iso-8859-1'});
    test.strictEqual(file.read(tmpfile.path, {encoding: 'iso-8859-1'}), this.string, 'file should be written using the specified encoding.');
    tmpfile.unlinkSync();

    file.option('encoding', 'iso-8859-1');
    tmpfile = new Tempfile();
    file.write(tmpfile.path, this.string);
    file.option('encoding', 'utf8');
    test.strictEqual(file.read(tmpfile.path, {encoding: 'iso-8859-1'}), this.string, 'changing the default encoding should work.');
    tmpfile.unlinkSync();

    tmpfile = new Tempfile();
    var octocat = fs.readFileSync('tests/fixtures/octocat.png');
    file.write(tmpfile.path, octocat);
    test.ok(compareBuffers(fs.readFileSync(tmpfile.path), octocat), 'buffers should always be written as-specified, with no attempt at re-encoding.');
    tmpfile.unlinkSync();

    file.option('write', false);
    var filepath = path.join(tmpdir.path, 'should-not-exist.txt');
    file.write(filepath, 'test');
    test.equal(file.exists(filepath), false, 'file should NOT be created if `write: false` was specified.');
    test.done();
  },
  'copy': function(test) {
    test.expect(4);
    var tmpfile;
    tmpfile = new Tempfile();
    file.copy('tests/fixtures/utf8.txt', tmpfile.path);
    test.ok(compareFiles(tmpfile.path, 'tests/fixtures/utf8.txt'), 'text files should just be copied as default encoding.');
    tmpfile.unlinkSync();

    tmpfile = new Tempfile();
    file.option('encoding', 'iso-8859-1');
    file.copy('tests/fixtures/iso-8859-1.txt', tmpfile.path);
    test.ok(compareFiles(tmpfile.path, 'tests/fixtures/iso-8859-1.txt'), 'text files should just be copied as default encoding.');
    tmpfile.unlinkSync();
    file.option('encoding', 'utf8');

    tmpfile = new Tempfile();
    file.copy('tests/fixtures/octocat.png', tmpfile.path);
    test.ok(compareFiles(tmpfile.path, 'tests/fixtures/octocat.png'), 'Binary files should be copied as encoding-agnostic by default.');
    tmpfile.unlinkSync();

    file.option('write', false);
    var filepath = path.join(tmpdir.path, 'should-not-exist.txt');
    file.copy('tests/fixtures/utf8.txt', filepath);
    test.equal(file.exists(filepath), false, 'file should NOT be created if `write: false` was specified.');

    test.done();
  },
  'copy and process': function(test) {
    test.expect(13);
    var tmpfile;
    tmpfile = new Tempfile();
    file.copy('tests/fixtures/utf8.txt', tmpfile.path, {
      process: function(src, filepath) {
        test.equal(filepath.replace(/\\/g, '/'), 'tests/fixtures/utf8.txt', 'filepath should be passed in, as-specified.');
        test.equal(Buffer.isBuffer(src), false, 'when no encoding is specified, use default encoding and process src as a string');
        test.equal(typeof src, 'string', 'when no encoding is specified, use default encoding and process src as a string');
        return 'føø' + src + 'bår';
      }
    });
    helpers.assertTextEqual(file.read(tmpfile.path), 'føø' + this.string + 'bår', test, 'file should be saved as properly encoded processed string.');
    tmpfile.unlinkSync();

    tmpfile = new Tempfile();
    file.copy('tests/fixtures/iso-8859-1.txt', tmpfile.path, {
      encoding: 'iso-8859-1',
      process: function(src) {
        test.equal(Buffer.isBuffer(src), false, 'use specified encoding and process src as a string');
        test.equal(typeof src, 'string', 'use specified encoding and process src as a string');
        return 'føø' + src + 'bår';
      }
    });
    helpers.assertTextEqual(file.read(tmpfile.path, {encoding: 'iso-8859-1'}), 'føø' + this.string + 'bår', test, 'file should be saved as properly encoded processed string.');
    tmpfile.unlinkSync();

    tmpfile = new Tempfile();
    file.copy('tests/fixtures/utf8.txt', tmpfile.path, {
      encoding: null,
      process: function(src) {
        test.ok(Buffer.isBuffer(src), 'when encoding is specified as null, process src as a buffer');
        return new Buffer('føø' + src.toString() + 'bår');
      }
    });
    helpers.assertTextEqual(file.read(tmpfile.path), 'føø' + this.string + 'bår', test, 'file should be saved as the buffer returned by process.');
    tmpfile.unlinkSync();

    file.option('encoding', 'iso-8859-1');
    tmpfile = new Tempfile();
    file.copy('tests/fixtures/iso-8859-1.txt', tmpfile.path, {
      process: function(src) {
        test.equal(Buffer.isBuffer(src), false, 'use non-utf8 default encoding and process src as a string');
        test.equal(typeof src, 'string', 'use non-utf8 default encoding and process src as a string');
        return 'føø' + src + 'bår';
      }
    });
    helpers.assertTextEqual(file.read(tmpfile.path), 'føø' + this.string + 'bår', test, 'file should be saved as properly encoded processed string');
    tmpfile.unlinkSync();

    var filepath = path.join(tmpdir.path, 'should-not-exist.txt');
    file.copy('tests/fixtures/iso-8859-1.txt', filepath, {
      process: function() {
        return false;
      }
    });
    test.equal(file.exists(filepath), false, 'file should NOT be created if process returns false.');
    test.done();
  },
  'copy and process, noprocess': function(test) {
    test.expect(4);
    var tmpfile;
    tmpfile = new Tempfile();
    file.copy('tests/fixtures/utf8.txt', tmpfile.path, {
      noProcess: true,
      process: function(src) {
        return 'føø' + src + 'bår';
      }
    });
    helpers.assertTextEqual(file.read(tmpfile.path), this.string, test, 'file should not have been processed.');
    tmpfile.unlinkSync();

    ['process', 'noprocess', 'othernoprocess'].forEach(function(filename) {
      var filepath = path.join(tmpdir.path, filename);
      file.copy('tests/fixtures/utf8.txt', filepath);
      var tmpfile = new Tempfile();
      file.copy(filepath, tmpfile.path, {
        noProcess: ['**/*no*'],
        process: function(src) {
          return 'føø' + src + 'bår';
        }
      });
      if (filename === 'process') {
        helpers.assertTextEqual(file.read(tmpfile.path), 'føø' + this.string + 'bår', test, 'file should have been processed.');
      } else {
        helpers.assertTextEqual(file.read(tmpfile.path), this.string, test, 'file should not have been processed.');
      }
      tmpfile.unlinkSync();
    }, this);

    test.done();
  },
  'copy keep file executable bit': function(test) {
    test.expect(2);
    var testFile = path.join(tmpdir.path, 'copy-perm.txt');
    var targetFile = path.join(tmpdir.path, 'subfolder/copy-perm.txt');

    fs.writeFileSync(testFile, 'foo', { mode: parseInt(777, 8) });
    test.ok(file.isExecutable(testFile));

    file.copy(testFile, targetFile);
    test.ok(file.isExecutable(targetFile));

    fs.unlinkSync(testFile);
    test.done();
  },
  'delete': function(test) {
    test.expect(2);
    var oldBase = process.cwd();
    var cwd = path.resolve(tmpdir.path, 'delete', 'folder');
    file.mkdir(cwd);
    process.chdir(tmpdir.path);

    file.write(path.join(cwd, 'test.js'), 'var test;');
    test.ok(file.delete(cwd), 'should return true after deleting file.');
    test.equal(file.exists(cwd), false, 'file should have been deleted.');
    process.chdir(oldBase);
    test.done();
  },
  'delete nonexistent file': function(test) {
    test.expect(1);
    var oldWarn = file.log.warn;
    file.log.warn = function() {};
    test.ok(!file.delete('nonexistent'), 'should return false if file does not exist.');
    file.log.warn = oldWarn;
    test.done();
  },
  'delete outside working directory': function(test) {
    test.expect(3);
    var oldBase = process.cwd();
    var oldWarn = file.log.warn;
    file.log.warn = function() {};

    var cwd = path.resolve(tmpdir.path, 'delete', 'folder');
    var outsidecwd = path.resolve(tmpdir.path, 'delete', 'outsidecwd');
    file.mkdir(cwd);
    file.mkdir(outsidecwd);
    process.chdir(cwd);

    file.write(path.join(outsidecwd, 'test.js'), 'var test;');
    test.equal(file.delete(path.join(outsidecwd, 'test.js')), false, 'should not delete anything outside the cwd.');

    test.ok(file.delete(path.join(outsidecwd), {force:true}), 'should delete outside cwd when using the --force.');
    test.equal(file.exists(outsidecwd), false, 'file outside cwd should have been deleted when using the --force.');

    process.chdir(oldBase);
    file.log.warn = oldWarn;
    test.done();
  },
  'dont delete current working directory': function(test) {
    test.expect(2);
    var oldBase = process.cwd();
    var oldWarn = file.log.warn;
    file.log.warn = function() {};

    var cwd = path.resolve(tmpdir.path, 'dontdelete', 'folder');
    file.mkdir(cwd);
    process.chdir(cwd);

    test.equal(file.delete(cwd), false, 'should not delete the cwd.');
    test.ok(file.exists(cwd), 'the cwd should exist.');

    process.chdir(oldBase);
    file.log.warn = oldWarn;
    test.done();
  },
  'dont actually delete with no-write option on': function(test) {
    test.expect(2);
    file.option('write', false);

    var oldBase = process.cwd();
    var cwd = path.resolve(tmpdir.path, 'dontdelete', 'folder');
    file.mkdir(cwd);
    process.chdir(tmpdir.path);

    file.write(path.join(cwd, 'test.js'), 'var test;');
    test.ok(file.delete(cwd), 'should return true after not actually deleting file.');
    test.equal(file.exists(cwd), true, 'file should NOT be deleted if `write: false` was specified.');
    process.chdir(oldBase);

    test.done();
  },
  'mkdir': function(test) {
    test.expect(5);
    test.doesNotThrow(function() {
      file.mkdir(tmpdir.path);
    }, 'Should not explode if the directory already exists.');
    test.ok(fs.existsSync(tmpdir.path), 'path should still exist.');

    test.doesNotThrow(function() {
      file.mkdir(path.join(tmpdir.path, 'aa/bb/cc'));
    }, 'Should also not explode, otherwise.');
    test.ok(path.join(tmpdir.path, 'aa/bb/cc'), 'path should have been created.');

    fs.writeFileSync(path.join(tmpdir.path, 'aa/bb/xx'), 'test');
    test.throws(function() {
      file.mkdir(path.join(tmpdir.path, 'aa/bb/xx/yy'));
    }, 'Should throw if a path cannot be created (ENOTDIR).');

    test.done();
  },
  'recurse': function(test) {
    test.expect(1);
    var rootdir = 'tests/fixtures/expand';
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
    file.recurse(rootdir, function(abspath, rootdir, subdir, filename) {
      actual[abspath] = [rootdir, subdir, filename];
    });

    test.deepEqual(actual, expected, 'paths and arguments should match.');
    test.done();
  }
};
