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
 */

var fs = require('fs');
var yargs = require('yargs');
var argv = yargs
  .usage('Usage: $0 <command> [<options>]')
  .example('$0 build --minify=True')
  .command('build', 'generate optimimized third party library for production',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 build [--minify] [--output_directory]')
        .option('minify', {
          describe: 'Whether to minify third-party dependencies'
        })
        .option('output_directory', {
          describe: 'A path to the directory where the files will be generated'
        })
        .argv;
    })
  .command('start_devserver', 'start GAE development server',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 start_devserver [--gae_devserver_path]' +
         '[--clear_datastore] [--enable_sendmail] [--use_minification]' +
         '[--prod_env]')
        .option('gae_devserver_path', {
          describe: 'A path to app engine'
        })
        .option('enable_sendmail', {
          describe: 'Whether to send emails'
        })
        .option('clear_datastore', {
          describe: 'Whether to clear all data storage'
        })
        .option('use_minification', {
          describe: 'Whether to build with minification'
        })
        .option('prod_env', {
          describe: 'Whether to run server in prod mode'
        })
        .demand(['gae_devserver_path'])
        .argv;
    }).argv;
var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpStartGae = require('./scripts/gulp-start-gae-devserver');
var gulpUtil = require('gulp-util');
var manifest = require('./manifest.json');
var cleanCss = require('gulp-clean-css');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var minify = require('gulp-minify');

var gaeDevserverPath = argv.gae_devserver_path;
var params = {
  admin_host: '0.0.0.0',
  admin_port: 8000,
  host: '0.0.0.0',
  port: 8181,
  skip_sdk_update_check: true
};
if (argv.clear_datastore) {
  params.clear_datastore = true;
}

if (argv.enable_sendmail) {
  params.enable_sendmail = argv.enable_sendmail;
}

// Check if path to the file to be minified and/or concatenated does exist.
// If not, raise a warning and terminate the program.
// This will help to check spelling errors in manifest.json.
var requireFilesExist = function(filePaths) {
  filePaths.forEach(function(filePath) {
    if (!fs.lstatSync(filePath).isFile()) {
      console.log(filePath + ' is not a valid filepath, check spelling');
      process.exit();
    }
  });
};

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

var isMinificationNeeded = (
  argv.minify === 'True' || argv.use_minification === 'True');
var frontendDependencies = manifest.dependencies.frontend;
var cssFilePaths = [];
var jsFilePaths = [];
var fontFolderPaths = [];
var cssBackgroundFilepaths = [];

// In non-dev mode, we move all files inside 'third_party/generated' to
// 'build/{{cache_slug}}/third_party/generated/' and serve it from there.
// And, for dev mode without minification, we generate the files inside
// 'third_party/generated/' and serve it from there. These files are generated
// directly inside 'third_party/generated/' since we need to keep urls
// compatible across both dev and prod modes. This compatibility is achieved by
// only interpolating the prefix for urls to these files.
var generatedTargetDir = path.join('third_party', 'generated');
if ('output_directory' in argv && argv.output_directory !== undefined) {
  generatedTargetDir = argv.output_directory;
}
var generatedCssTargetDir = path.join(generatedTargetDir, 'css');
var generatedJsTargetDir = path.join(generatedTargetDir, 'js');

gulp.task('collectDependencyFilepaths', function() {
  for (var dependencyId in frontendDependencies) {
    var dependency = frontendDependencies[dependencyId];
    var dependencyDir = dependency.targetDirPrefix + dependency.version;
    if (dependency.hasOwnProperty('bundle')) {
      if (dependency.bundle.hasOwnProperty('css')) {
        dependency.bundle.css.forEach(function(cssFiles) {
          cssFilePaths.push(path.join(
            'third_party', 'static', dependencyDir, cssFiles));
        });
      }
      if (dependency.bundle.hasOwnProperty('js')) {
        dependency.bundle.js.forEach(function(jsFiles) {
          jsFilePaths.push(path.join(
            'third_party', 'static', dependencyDir, jsFiles));
        });
      }
      if (dependency.bundle.hasOwnProperty('fontsPath')) {
        var fontPrefix = '*.{eot,woff2,ttf,woff,eof,svg}';
        fontFolderPaths.push(path.join('third_party', 'static', dependencyDir,
          dependency.bundle.fontsPath, fontPrefix));
      }
      if (dependency.bundle.hasOwnProperty('cssBackgroundImage')) {
        dependency.bundle.cssBackgroundImage.forEach(function(imagePath) {
          cssBackgroundFilepaths.push(path.join(
            'third_party', 'static', dependencyDir, imagePath));
        });
      }
    }
  }
});

gulp.task('generateCss', function() {
  requireFilesExist(cssFilePaths);
  gulp.src(cssFilePaths)
    .pipe(isMinificationNeeded ? cleanCss({}) : gulpUtil.noop())
    .pipe(concat('third_party.css'))
    .pipe(gulp.dest(generatedCssTargetDir));
});

gulp.task('generateJs', function() {
  requireFilesExist(jsFilePaths);
  gulp.src(jsFilePaths)
    .pipe(sourcemaps.init())
      .pipe(concat('third_party.js'))
      .pipe(isMinificationNeeded ? minify({
        ext: {
          src: '.js',
          min: '.min.js'
        }
      }) : gulpUtil.noop())
    // This maps a combined/minified file back to an unbuilt state by holding
    // information about original files. When you query a certain line and
    // column number in your generated JavaScript, you can do a lookup in the
    // source map which returns the original location.
    // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(generatedJsTargetDir));
});
// This task is used to copy all fonts which are used by
// Bootstrap and font-Awesome to one folder
var generatedFontsTargetDir = path.join(generatedTargetDir, 'fonts');
gulp.task('copyFonts', function() {
  gulp.src(fontFolderPaths)
    .pipe(gulp.dest(path.join(generatedFontsTargetDir)));
});

// This is a task which copies background image used by css.
// TODO(Barnabas) find a way of removing this task. It is a bit of a hack,
// because it depends on the relative location of the CSS background images
// of a third-party library with respect to the CSS file that uses them.
// The currently-affected libraries include select2.css.
gulp.task('copyCssBackgroundImages', function() {
  requireFilesExist(cssBackgroundFilepaths);
  gulp.src(cssBackgroundFilepaths)
    .pipe(gulp.dest(generatedCssTargetDir));
});

gulp.task('gulpStartGae', function() {
  gulp.src('app.yaml')
    .pipe(gulpStartGae(gaeDevserverPath, [], params));
});

// This takes all functions  that are required for the build
// e.g css, Js and Images
gulp.task('build', [
  'collectDependencyFilepaths', 'generateCss', 'copyFonts',
  'copyCssBackgroundImages', 'generateJs']);

gulp.slurped = false;
gulp.task('watch', function() {
  if (!gulp.slurped) {
    gulp.watch('gulpfile.js', ['build']);
    gulp.watch(cssFilePaths, ['generateCss']);
    gulp.watch(jsFilePaths, ['generateJs']);
    gulp.watch('manifest.json', ['build']);
    gulp.slurped = true;
  }
});

// This task starts google app engine development server.
// TODO(Barnabas Makonda): check if files are already generated and if so
// do not build.
var isProdMode = argv.prod_env === 'True';
if (isProdMode) {
  gulp.task('start_devserver', ['gulpStartGae', 'watch']);
} else {
  gulp.task('start_devserver', ['build', 'gulpStartGae', 'watch']);
}
