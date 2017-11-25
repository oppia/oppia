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

var getUniqueLogMessages = function(logs) {
  // Returns unique log messages.
  var logsDict = {};
  for (var i = 0; i < logs.length; i++) {
    if (!logsDict.hasOwnProperty(logs[i].message)) {
      logsDict[logs[i].message] = true;
    }
  }
  return Object.keys(logsDict);
};

var checkConsoleErrorsExist = function(expectedErrors) {
  // Checks that browser logs match entries in expectedErrors array.
  browser.manage().logs().get('browser').then(function(browserLogs) {
    // Some browsers such as chrome raise two errors for a missing resource.
    // To keep consistent behaviour across browsers, we keep only the logs
    // that have a unique value for their message attribute.
    var uniqueLogMessages = getUniqueLogMessages(browserLogs);
    expect(uniqueLogMessages.length).toBe(expectedErrors.length);

    for (var i = 0; i < expectedErrors.length; i++) {
      var errorPresent = false;
      for (var j = 0; j < uniqueLogMessages.length; j++) {
        if (uniqueLogMessages[j].match(expectedErrors[i])) {
          errorPresent = true;
        }
      }
      expect(errorPresent).toBe(true);
    }
  });
};

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get(ERROR_PAGE_URL_SUFFIX);
    var expectedErrors = [
      'http://localhost:9001/build/fail/logo/288x128_logo_white.png',
      '\\$modal is now deprecated. Use \\$uibModal instead.'
    ];
    checkConsoleErrorsExist(expectedErrors);
  });
});
