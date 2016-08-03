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

var ERROR_PAGE_URL_SUFFIX = '/console_errors';

var checkConsoleErrorsExist = function(errorsToFind) {
  browser.manage().logs().get('browser').then(function(browserLogs) {
    var errorsExpected = [];
    var errorsNotExpected = [];
    for (var i = 0; i < browserLogs.length; i++) {
      var error = false;
      for (var j = 0; j < errorsToFind.length; j++) {
        if (browserLogs[i].message.match(errorsToFind[j])) {
          error = true;
        }
      }
      if (error) {
        errorsExpected.push(browserLogs[i]);
      } else {
        errorsNotExpected.push(browserLogs[i]);
      }
    }
    // We get 2 console errors for a missing resource.
    expect(errorsExpected.length).toBe(2);
    expect(errorsNotExpected.length).toBe(0);
  });
};

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get(ERROR_PAGE_URL_SUFFIX);
    var missingFiles = [
      'http://localhost:9001/build/fail/logo/288x128_logo_white.png'
    ];
    checkConsoleErrorsExist(missingFiles);
  });
});
