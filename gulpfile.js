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
 * @fileoverview We use this file to watch over third party
 * related folders and files and to start rebuild process if needed. This file
 * should be only used for the mentioned purposes until we devise a way
 * to watch folders from Python, then it should be removed.
 */

var yargs = require('yargs');
var argv = yargs
  .usage('Usage: $0 <command> [<options>]')
  .command('watch', 'watch files in nonprod mode',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 watch')
        .argv;
    }).argv;

var gulp = require('gulp');
var concat = require('gulp-concat');
var childProcess = require('child_process');
var path = require('path');

var manifest = require('./manifest.json');

var thirdPartyCssFiles = path.join('third_party', 'static', '**', '*.css');
var thirdPartyJsFiles = path.join('third_party', 'static', '**', '*.js');

// Check if there are enough commands/actions/tasks to run gulp.
var checkCommands = function(yargs, argv, numRequired) {
  if (argv._.length < numRequired) {
    // Display help(usage) message.
    console.error(yargs.help());
    // Stop gulp and exit.
    process.exit();
  }
};
// There should atleast be minimum of one defined task.
checkCommands(yargs, argv, 1);

gulp.task('build', function() {
  childProcess.exec(['$PYTHON_CMD scripts/build.py']);
});

gulp.slurped = false;
gulp.task('watch', function() {
  if (!gulp.slurped) {
    gulp.watch('gulpfile.js', ['build']);
    gulp.watch(thirdPartyCssFiles, ['build']);
    gulp.watch(thirdPartyJsFiles, ['build']);
    gulp.watch('manifest.json', ['build']);
    gulp.slurped = true;
  }
});

gulp.task('watch', ['watch']);
