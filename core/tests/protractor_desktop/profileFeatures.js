// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for user profile features.
 */

var DEFAULT_BIO = 'This user has not supplied a bio yet.';
var PLACEHOLDER_INTEREST_TEXT = 'none specified';

var users = require('../protractor_utils/users.js');
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');

var ProfilePage = require('../protractor_utils/ProfilePage.js');

describe('Un-customized profile page for current, logged-in user', function() {
  var TEST_USERNAME = 'currentDefaultProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var profilePage = null;

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    users.createUser(TEST_EMAIL, TEST_USERNAME);
  });

  beforeEach(function() {
    users.login(TEST_EMAIL);
    profilePage.get(TEST_USERNAME);
  });

  it('displays profile photo', function() {
    profilePage.expectCurrUserToHaveProfilePhoto();
  });

  it('displays placeholder bio text', function() {
    profilePage.expectUserToHaveBio(DEFAULT_BIO);
  });

  it('displays no interests', function() {
    profilePage.expectUserToHaveNoInterests();
  });

  it('displays placeholder interest text', function() {
    profilePage.expectUserToHaveInterestPlaceholder(
      PLACEHOLDER_INTEREST_TEXT);
  });

  afterEach(function() {
    users.logout();
    general.checkForConsoleErrors([]);
  });
});
