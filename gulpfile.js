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
  .command('start_devserver', 'start GAE development server',
    function(yargs) {
      argv = yargs
        .usage('Usage: $0 start_devserver [--gae_devserver_path]' +
         '[--clear_datastore] [--enable_sendmail]' +
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
        .option('prod_env', {
          describe: 'Whether to run server in prod mode'
        })
        .demand(['gae_devserver_path'])
        .argv;
    }).argv;

var gulp = require('gulp');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var path = require('path');

var gulpStartGae = require('./scripts/gulp-start-gae-devserver');
var manifest = require('./manifest.json');

var thirdPartyCssFiles = path.join('third_party', 'static', '**', '*.css');
var thirdPartyJsFiles = path.join('third_party', 'static', '**', '*.js');

var isProdMode = argv.prod_env === 'True';
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

gulp.task('gulpStartGae', function() {
  gulp.src('app.yaml')
    .pipe(gulpStartGae(gaeDevserverPath, [], params));
});

gulp.task('build', function() {
  exec(['$PYTHON_CMD scripts/build.py']);
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

if (isProdMode) {
  gulp.task('start_devserver', ['gulpStartGae']);
} else {
  gulp.task('start_devserver', ['gulpStartGae', 'watch']);
}
