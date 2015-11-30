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

var yargs = require('yargs');
var argv = yargs
  .usage('Usage: $0 <command> [<options>]')
  .example('$0 build --minify=True')
  .command('build', 'generate optimimized third party library for production',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 build [--minify]')
        .option('minify', {
          describe: 'Whether to minify third-party dependencies'
        })
        .demand(['minify'])
        .argv;
    })
  .command('start_devserver', 'start GAE development server',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 start_devserver [--gae_devserver_path]' +
         '[--clear_datastore] [--enable_sendmail]')
        .option('gae_devserver_path', {
          describe: 'A path to app engine'
        })
        .option('enable_sendmail', {
          describe: 'Whether to send emails'
        })
        .option('clear_datastore', {
          describe: 'Whether to clear all data storage'
        })
        .demand(['gae_devserver_path'])
        .argv;
    }).argv;
var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpStartGae = require('./scripts/gulp-start-gae-devserver');
var gulpUtil = require('gulp-util');
var manifest = require('./manifest.json');
var minifyCss = require('gulp-minify-css');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var gaeDevserverPath = argv.gae_devserver_path;
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

// Check if there are enough commands/actions/tasks to run gulp.
var checkCommands = function(yargs, argv, numRequired) {
  if (argv._.length < numRequired) {
    // Display help(usage) message.
    console.log(yargs.help());
    // Stop gulp and exit.
    process.exit();
  }
};
// There should atleast be minimum of one defined task.
checkCommands(yargs, argv, 1);

var isMinificationNeeded = (argv.minify == 'True');
var frontendDependencies = manifest.dependencies.frontend;
var cssFilesPath = [];
var jsFilesPath = [];
var fontFolderPath = [];
var cssBackgroundPath = [];
var generatedCssTargetDir = path.join(
  'third_party', 'generated',
  isMinificationNeeded ? 'prod' : 'dev', 'css');
var generatedJsTargetDir = path.join(
  'third_party', 'generated',
  isMinificationNeeded ? 'prod' : 'dev', 'js');

for (var dependencyId in frontendDependencies) {
  var dependency = frontendDependencies[dependencyId];
  var dependencyDir = dependency.targetDirPrefix + dependency.version;
  if (dependency.hasOwnProperty('cssFiles')) {
    dependency.cssFiles.forEach(function(cssFiles) {
      cssFilesPath.push(path.join(
        'third_party', 'static', dependencyDir, cssFiles));
    });
  }
  if (dependency.hasOwnProperty('jsFiles')) {
    dependency.jsFiles.forEach(function(jsFiles) {
      jsFilesPath.push(path.join(
        'third_party', 'static', dependencyDir, jsFiles));
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

gulp.task('generateJs', function() {
  gulp.src(jsFilesPath)
    .pipe(sourcemaps.init())
      .pipe(concat('third_party.js'))
      .pipe(isMinificationNeeded ? uglify() : gulpUtil.noop())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(generatedJsTargetDir));
});
// This task is used to copy all fonts which are used by
// Bootstrap and font-Awesome to one folder
gulp.task('copyFonts', function() {
  gulp.src(fontFolderPath)
    .pipe(gulp.dest(path.join(
      'third_party', 'generated',
      isMinificationNeeded ? 'prod' : 'dev', 'fonts')));
});

// This is a task which copies background image used by css.
// TODO(Barnabas) find a way of removing this task.
// It is a bit of a hack,
// because it depends on the relative location of the CSS background images
// of a third-party library with respect to the CSS file that uses them.
// The currently-affected libraries include select2.css.
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
gulp.task('build', ['generateCss', 'copyFonts', 'copyCssBackgroundImages', 'generateJs']);

gulp.slurped = false;
gulp.task('watch', function() {
  if (!gulp.slurped) {
    gulp.watch('gulpfile.js', ['build']);
    gulp.watch(cssFilesPath, ['generateCss']);
    gulp.watch('manifest.json', ['build']);
    gulp.slurped = true;
  }
});

// This task starts google app engine development server.
// TODO(Barnabas Makonda): check if files are already generated and if so
// do not build.
gulp.task('start_devserver', ['build', 'gulpStartGae', 'watch']);