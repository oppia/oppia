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
 * This originated from this repo https://github.com/maciejzasada/gulp-gae.
 * We do not use it directly because supported actions are
 * dev_appserver.py and appcfg.py which will require every developer to install
 * google app_engine and export its path.
 *
 * @fileoverview module that start gae server in gulp.
 */

'use strict';

var gulpUtil = require('gulp-util');
var path = require('path');
var spawn = require('child_process').spawn;
var through = require('through2');

var File = gulpUtil.File;
var PluginError = gulpUtil.PluginError;

module.exports = function(action, args, params) {
  action = action;
  args = args || [];
  params = params || {};

  var proc;

  var parseParams = function(params) {
    var p = [];
    for (var key in params) {
      var value = params[key];
      if (value === undefined) {
        // Value-less parameters.
        p.push('--' + key);
      } else {
        p.push('--' + key + '=' + value);
      }
    }

    return p;
  };

  var runScript = function(file, args, params, cb) {
    var scriptArgs = args.concat(parseParams(params));
    proc = spawn(file, scriptArgs);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    cb && cb();
  };

  var stopScript = function() {
    gulpUtil.log('[gulp-gae]', 'stopping script');
    proc && proc.kill('SIGHUP');
    proc = null;
    process.exit();
  };

  var bufferContents = function(file, enc, cb) {
    var appYamlPath = path.dirname(file.path);
    var shouldWait = false;

    if (action) {
      args = [appYamlPath].concat(args);
    }

    runScript(action, args, params, cb);

    process.on('SIGINT', stopScript);
    process.on('exit', stopScript);
  };

  var endStream = function(cb) {
    cb();
    return;
  };

  return through.obj(bufferContents, endStream);
};
