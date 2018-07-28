// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end test to check console errors.
 */

var general = require('../protractor_utils/general.js');

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get('/console_errors');
    var expectedErrors = [
      'http://localhost:9001/build/fail/logo/288x128_logo_white.png'
    ];
    general.checkConsoleErrorsExist(expectedErrors);
  });
});
