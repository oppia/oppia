// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests to check for console errors in pages
 * a logged-in user gets access to
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

describe('Login Flow', function() {
  beforeEach(function() {
    users.createAndLoginUser('randomuser@gmail.com', 'r4nd0m');
  });

  it('visits the links in the dropdown', function() {
    var profileDropdown = element(by.css('.protractor-test-profile-dropdown'));

    var classNames = [
      '.protractor-test-profile-link',
      '.protractor-test-dashboard-link',
      '.protractor-test-preferences-link',
      '.protractor-test-notifications-link'
    ];
    classNames.forEach(function(className) {
      browser.actions().mouseMove(profileDropdown).perform();
      general.waitForSystem(100);
      profileDropdown.element(by.css(className)).click();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
