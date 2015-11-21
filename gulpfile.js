// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview node module that automate tasks.
 *
 * @author barnabasmakonda@gmail.com (Barnabas Makonda)
 */

var argv = require('yargs')
    .usage(
      'Usage: $0 --gaeDevserverPath [path to app engine]' +
      '--clear_datastore [whether to clear all data storage]' +
      '--enable_sendmail [whether to send emails]' +
      '--minify [whether to minify third-party dependencies]').argv;
var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpStartGae = require('./scripts/gulp-start-gae-devserver');
var gulpUtil = require('gulp-util');
var manifest = require('./manifest.json');
var minifyCss = require('gulp-minify-css');
var path = require('path');

var gaeDevserverPath = argv.gaeDevserverPath;
var params = {
  admin_host: '0.0.0.0',
  admin_port: 8000,
  host: '0.0.0.0',
  port: 8181
};
if (argv.clear_datastore) {
  params.clear_datastore = true;
}

if (argv.enable_sendmail) {
  params.enable_sendmail = argv.enable_sendmail;
}

var isMinificationNeeded = (argv.minify == 'True');
var frontendDependencies = manifest.dependencies.frontend;
var cssFilesPath = [];
var fontFolderPath = [];
var cssBackgroundPath = [];
var generatedCssTargetDir = path.join(
  'third_party', 'generated',
  isMinificationNeeded ? 'prod' : 'dev', 'css');

for (var dependencyId in frontendDependencies) {
  var dependency = frontendDependencies[dependencyId];
  var dependencyDir = dependency.targetDirPrefix + dependency.version;
  if (dependency.hasOwnProperty('cssFiles')) {
    dependency.cssFiles.forEach(function(cssFiles) {
      cssFilesPath.push(path.join(
        'third_party', 'static', dependencyDir, cssFiles));
    });
  }
  if (dependency.hasOwnProperty('fontsPath')) {
    var fontPrefix = '*.{eot,woff2,ttf,woff,eof,svg}';
    fontFolderPath.push(path.join('third_party', 'static', dependencyDir,
      dependency.fontsPath, fontPrefix));
  }
  if (dependency.hasOwnProperty('cssBackgroundImage')) {
    dependency.cssBackgroundImage.forEach(function(imagePath) {
      cssBackgroundPath.push(path.join(
        'third_party', 'static', dependencyDir, imagePath));
    });
  }
}
gulp.task('generateCss', function() {
  gulp.src(cssFilesPath)
    .pipe(isMinificationNeeded ? minifyCss() : gulpUtil.noop())
    .pipe(concat('third_party.css'))
    .pipe(gulp.dest(generatedCssTargetDir));
});

// This task is used to copy all fonts which are used by
// Bootstrap and font-Awesome to one folder
gulp.task('copyFonts', function() {
  gulp.src(fontFolderPath)
    .pipe(gulp.dest(path.join(
      'third_party', 'generated',
      isMinificationNeeded ? 'prod' : 'dev', 'fonts')));
});

// This is a task which copies backgroun image used by select2.css
// TODO(Barnabas) find a way of removing this task.
// It is a bit of a hacky method and does not seems to scale with a program
gulp.task('copyCssBackgroundImages', function() {
  gulp.src(cssBackgroundPath)
    .pipe(gulp.dest(generatedCssTargetDir));
});

gulp.task('gulpStartGae', function() {
  gulp.src('app.yaml')
    .pipe(gulpStartGae(gaeDevserverPath, [], params));
});

// This takes all functions  that are required for the build
// e.g css, Js and Images
gulp.task('build', ['generateCss', 'copyFonts', 'copyCssBackgroundImages']);

gulp.slurped = false;
gulp.task('watch', function() {
  if (!gulp.slurped) {
    gulp.watch('gulpfile.js', ['build']);
    gulp.watch(cssFilesPath, ['generateCss']);
    gulp.watch('manifest.json', ['build']);
    gulp.slurped = true;
  }
});

// This takes all default task which must be run when start.sh is started.
// TODO (barnabas) check if files are already generated and if so
// do not build.
gulp.task('.', ['build', 'gulpStartGae', 'watch']);

