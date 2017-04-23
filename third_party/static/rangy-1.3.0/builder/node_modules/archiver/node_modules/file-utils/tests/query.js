'use strict';

var fquery = require('..');

var fs = require('fs');
var path = require('path');

var Tempfile = require('temporary/lib/file');
var Tempdir = require('temporary/lib/dir');

var tmpdir = new Tempdir();
fs.symlinkSync(path.resolve('tests/fixtures/octocat.png'), path.join(tmpdir.path, 'octocat.png'), 'file');
fs.symlinkSync(path.resolve('tests/fixtures/expand'), path.join(tmpdir.path, 'expand'), 'dir');

exports['fquery'] = {
  setUp: function(done) {
    // Assign the query interface, allow running these tests on other interface
    this.fquery = fquery;
    done();
  },
  'exists': function(test) {
    test.expect(6);
    test.ok(this.fquery.exists('tests/fixtures/octocat.png'), 'files exist.');
    test.ok(this.fquery.exists('tests', 'fixtures', 'octocat.png'), 'should work for paths in parts.');
    test.ok(this.fquery.exists('tests/fixtures'), 'directories exist.');
    test.ok(this.fquery.exists(path.join(tmpdir.path, 'octocat.png')), 'file links exist.');
    test.ok(this.fquery.exists(path.join(tmpdir.path, 'expand')), 'directory links exist.');
    test.equal(this.fquery.exists('tests/fixtures/does/not/exist'), false, 'nonexistent files do not exist.');
    test.done();
  },
  'isLink': function(test) {
    test.expect(6);
    test.equals(this.fquery.isLink('tests/fixtures/octocat.png'), false, 'files are not links.');
    test.equals(this.fquery.isLink('tests/fixtures'), false, 'directories are not links.');
    test.ok(this.fquery.isLink(path.join(tmpdir.path, 'octocat.png')), 'file links are links.');
    test.ok(this.fquery.isLink(path.join(tmpdir.path, 'expand')), 'directory links are links.');
    test.ok(this.fquery.isLink(tmpdir.path, 'octocat.png'), 'should work for paths in parts.');
    test.equals(this.fquery.isLink('tests/fixtures/does/not/exist'), false, 'nonexistent files are not links.');
    test.done();
  },
  'isDir': function(test) {
    test.expect(6);
    test.equals(this.fquery.isDir('tests/fixtures/octocat.png'), false, 'files are not directories.');
    test.ok(this.fquery.isDir('tests/fixtures'), 'directories are directories.');
    test.ok(this.fquery.isDir('tests', 'fixtures'), 'should work for paths in parts.');
    test.equals(this.fquery.isDir(path.join(tmpdir.path, 'octocat.png')), false, 'file links are not directories.');
    test.ok(this.fquery.isDir(path.join(tmpdir.path, 'expand')), 'directory links are directories.');
    test.equals(this.fquery.isDir('tests/fixtures/does/not/exist'), false, 'nonexistent files are not directories.');
    test.done();
  },
  'isFile': function(test) {
    test.expect(6);
    test.ok(this.fquery.isFile('tests/fixtures/octocat.png'), 'files are files.');
    test.ok(this.fquery.isFile('tests', 'fixtures', 'octocat.png'), 'should work for paths in parts.');
    test.equals(this.fquery.isFile('tests/fixtures'), false, 'directories are not files.');
    test.ok(this.fquery.isFile(path.join(tmpdir.path, 'octocat.png')), 'file links are files.');
    test.equals(this.fquery.isFile(path.join(tmpdir.path, 'expand')), false, 'directory links are not files.');
    test.equals(this.fquery.isFile('tests/fixtures/does/not/exist'), false, 'nonexistent files are not files.');
    test.done();
  },
  'isExecutable': function(test) {
    test.expect(2);

    var isExec = path.join(tmpdir.path, 'isExecutable-true');
    var isNotExec = path.join(tmpdir.path, 'isExecutable-false');

    fs.writeFileSync(isExec, 'bar', { mode: parseInt(777, 8) });
    fs.writeFileSync(isNotExec, 'bar', { mode: parseInt(666, 8) });

    test.ok(this.fquery.isExecutable(isExec));
    test.ok(!this.fquery.isExecutable(isNotExec));

    test.done();
  },
  'isPathAbsolute': function(test) {
    test.expect(5);
    test.ok(this.fquery.isPathAbsolute(path.resolve('/foo')), 'should return true');
    test.ok(this.fquery.isPathAbsolute(path.resolve('/foo') + path.sep), 'should return true');
    test.equal(this.fquery.isPathAbsolute('foo'), false, 'should return false');
    test.ok(this.fquery.isPathAbsolute(path.resolve('tests/fixtures/a.js')), 'should return true');
    test.equal(this.fquery.isPathAbsolute('tests/fixtures/a.js'), false, 'should return false');
    test.done();
  },
  'arePathsEquivalent': function(test) {
    test.expect(5);
    test.ok(this.fquery.arePathsEquivalent('/foo'), 'should return true');
    test.ok(this.fquery.arePathsEquivalent('/foo', '/foo/', '/foo/../foo/'), 'should return true');
    test.ok(this.fquery.arePathsEquivalent(process.cwd(), '.', './', 'tests/..'), 'should return true');
    test.equal(this.fquery.arePathsEquivalent(process.cwd(), '..'), false, 'should return false');
    test.equal(this.fquery.arePathsEquivalent('.', '..'), false, 'should return false');
    test.done();
  },
  'doesPathContain': function(test) {
    test.expect(6);
    test.ok(this.fquery.doesPathContain('/foo', '/foo/bar'), 'should return true');
    test.ok(this.fquery.doesPathContain('/foo/', '/foo/bar/baz', '/foo/bar', '/foo/whatever'), 'should return true');
    test.equal(this.fquery.doesPathContain('/foo', '/foo'), false, 'should return false');
    test.equal(this.fquery.doesPathContain('/foo/xyz', '/foo/xyz/123', '/foo/bar/baz'), false, 'should return false');
    test.equal(this.fquery.doesPathContain('/foo/xyz', '/foo'), false, 'should return false');
    test.ok(this.fquery.doesPathContain(process.cwd(), 'test', 'tests/fixtures', 'lib'), 'should return true');
    test.done();
  },
  'isPathCwd': function(test) {
    test.expect(8);
    test.ok(this.fquery.isPathCwd(process.cwd()), 'cwd is cwd');
    test.ok(this.fquery.isPathCwd('.'), 'cwd is cwd');
    test.equal(this.fquery.isPathCwd('tests'), false, 'subdirectory is not cwd');
    test.equal(this.fquery.isPathCwd(path.resolve('test')), false, 'subdirectory is not cwd');
    test.equal(this.fquery.isPathCwd('..'), false, 'parent is not cwd');
    test.equal(this.fquery.isPathCwd(path.resolve('..')), false, 'parent is not cwd');
    test.equal(this.fquery.isPathCwd('/'), false, 'root is not cwd (I hope)');
    test.equal(this.fquery.isPathCwd('nonexistent'), false, 'nonexistent path is not cwd');
    test.done();
  },
  'isPathInCwd': function(test) {
    test.expect(8);
    test.equal(this.fquery.isPathInCwd(process.cwd()), false, 'cwd is not IN cwd');
    test.equal(this.fquery.isPathInCwd('.'), false, 'cwd is not IN cwd');
    test.ok(this.fquery.isPathInCwd('tests'), 'subdirectory is in cwd');
    test.ok(this.fquery.isPathInCwd(path.resolve('tests')), 'subdirectory is in cwd');
    test.equal(this.fquery.isPathInCwd('..'), false, 'parent is not in cwd');
    test.equal(this.fquery.isPathInCwd(path.resolve('..')), false, 'parent is not in cwd');
    test.equal(this.fquery.isPathInCwd('/'), false, 'root is not in cwd (I hope)');
    test.equal(this.fquery.isPathInCwd('nonexistent'), false, 'nonexistent path is not in cwd');
    test.done();
  },
};
