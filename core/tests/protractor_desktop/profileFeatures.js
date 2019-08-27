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
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');

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

describe('Un-customized profile page for other user', function() {
  var TEST_USERNAME = 'otherDefaultProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var profilePage = null;

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    users.createUser(TEST_EMAIL, TEST_USERNAME);
  });

  beforeEach(function() {
    profilePage.get(TEST_USERNAME);
  });

  it('does not display the profile photo', function() {
    profilePage.expectOtherUserToNotHaveProfilePhoto();
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
    general.checkForConsoleErrors([]);
  });
});

describe('Customized profile page for current user', function() {
  var TEST_USERNAME = 'currCustomizedProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var TEST_BIO = 'My test bio!';
  var TEST_INTERESTS = ['math', 'social studies'];
  var profilePage = null;

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    var preferencesPage = new PreferencesPage.PreferencesPage();
    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);
    preferencesPage.get();
    preferencesPage.setUserBio(TEST_BIO);
    preferencesPage.get();
    preferencesPage.setUserInterests(TEST_INTERESTS);
    users.logout();
  });

  beforeEach(function() {
    users.login(TEST_EMAIL);
    profilePage.get(TEST_USERNAME);
  });

  it('displays the profile photo', function() {
    profilePage.expectCurrUserToHaveProfilePhoto();
  });

  it('displays custom bio text', function() {
    profilePage.expectUserToHaveBio(TEST_BIO);
  });

  it('displays custom interests', function() {
    profilePage.expectUserToHaveInterests(TEST_INTERESTS);
  });

  it('does not display placeholder interest text', function() {
    profilePage.expectUserToNotHaveInterestPlaceholder();
  });

  afterEach(function() {
    users.logout();
    general.checkForConsoleErrors([]);
  });
});

describe('Customized profile page for other user', function() {
  var TEST_USERNAME = 'otherCustomizedProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var TEST_BIO = 'My test bio!';
  var TEST_INTERESTS = ['math', 'social studies'];
  var profilePage = null;

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    var preferencesPage = new PreferencesPage.PreferencesPage();
    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);
    preferencesPage.get();
    preferencesPage.setUserBio(TEST_BIO);
    preferencesPage.get();
    preferencesPage.setUserInterests(TEST_INTERESTS);
    users.logout();
  });

  beforeEach(function() {
    profilePage.get(TEST_USERNAME);
  });

  it('does not display the profile photo', function() {
    profilePage.expectOtherUserToNotHaveProfilePhoto();
  });

  it('displays custom bio text', function() {
    profilePage.expectUserToHaveBio(TEST_BIO);
  });

  it('displays custom interests', function() {
    profilePage.expectUserToHaveInterests(TEST_INTERESTS);
  });

  it('does not display placeholder interest text', function() {
    profilePage.expectUserToNotHaveInterestPlaceholder();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
