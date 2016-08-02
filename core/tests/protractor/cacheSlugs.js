// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for cache slugs.
 */

var general = require('../protractor_utils/general.js');

var ERROR_PAGE_URL_SUFFIX = '/console-errors';

var checkConsoleErrorsExist = function(errorsToFind) {
  browser.manage().logs().get('browser').then(function(browserLogs) {
    var fatalErrors = [];
    for (var i = 0; i < browserLogs.length; i++) {
      var errorFatal = true;
      for (var j = 0; j < errorsToFind.length; j++) {
        if (browserLogs[i].message.match(errorsToFind[j])) {
          errorFatal = false;
        }
      }
      if (errorFatal) {
        fatalErrors.push(browserLogs[i]);
      }
    }
    expect(fatalErrors.length).toBeGreaterThan(0);
  });
};

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get(ERROR_PAGE_URL_SUFFIX);
    var missingFiles = [
      'http://localhost:8181/build/fail/logo/288x128_logo_white.png'
    ];
    checkConsoleErrorsExist(missingFiles);
  });
});
