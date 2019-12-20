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

var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var ProfilePage = require('../protractor_utils/ProfilePage.js');

describe('Un-customized profile page', function() {
  var TEST_USERNAME = 'defaultProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var profilePage = null;

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    users.createUser(TEST_EMAIL, TEST_USERNAME);
  });

  it('displays photo, default bio, and interest placeholder when logged in',
    function() {
      users.login(TEST_EMAIL);
      profilePage.get(TEST_USERNAME);
      profilePage.expectCurrUserToHaveProfilePhoto();
      profilePage.expectUserToHaveBio(DEFAULT_BIO);
      profilePage.expectUserToHaveNoInterests();
      profilePage.expectUserToHaveInterestPlaceholder(
        PLACEHOLDER_INTEREST_TEXT);
      users.logout();
    }
  );

  it('displays no photo, default bio, and no interests when logged out',
    function() {
      profilePage.get(TEST_USERNAME);
      profilePage.expectOtherUserToNotHaveProfilePhoto();
      profilePage.expectUserToHaveBio(DEFAULT_BIO);
      profilePage.expectUserToHaveNoInterests();
      profilePage.expectUserToHaveInterestPlaceholder(
        PLACEHOLDER_INTEREST_TEXT);
    }
  );

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Customized profile page for current user', function() {
  var TEST_USERNAME = 'customizedProfileFeatures';
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

  it('displays photo, custom bio, and interests when logged in', function() {
    users.login(TEST_EMAIL);
    profilePage.get(TEST_USERNAME);
    profilePage.expectCurrUserToHaveProfilePhoto();
    profilePage.expectUserToHaveBio(TEST_BIO);
    profilePage.expectUserToHaveInterests(TEST_INTERESTS);
    profilePage.expectUserToNotHaveInterestPlaceholder();
    users.logout();
  });

  it('displays no photo, custom bio, and interests when logged out',
    function() {
      profilePage.get(TEST_USERNAME);
      profilePage.expectOtherUserToNotHaveProfilePhoto();
      profilePage.expectUserToHaveBio(TEST_BIO);
      profilePage.expectUserToHaveInterests(TEST_INTERESTS);
      profilePage.expectUserToNotHaveInterestPlaceholder();
    }
  );

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Visiting user profile page', function() {
  var TEST_USERNAME = 'myUser';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var ANOTHER_USERNAME = 'anotherUser';
  var ANOTHER_EMAIL = ANOTHER_USERNAME + '@example.com';

  var profilePage = null;
  var creatorDashboardPage = null;

  var EXPLORATION = {
    title: 'A new exploration',
    category: 'Learning',
    objective: 'The goal is to create a new exploration',
    language: 'English'
  };

  beforeAll(function() {
    profilePage = new ProfilePage.ProfilePage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();

    users.createUser(ANOTHER_EMAIL, ANOTHER_USERNAME);
    users.login(ANOTHER_EMAIL);

    workflow.createAndPublishExploration(
      EXPLORATION.title,
      EXPLORATION.category,
      EXPLORATION.objective,
      EXPLORATION.language
    );

    creatorDashboardPage.get();
    creatorDashboardPage.expectToHaveExplorationCard(EXPLORATION.title);
    users.logout();
  });

  it('should show the explorations created by the user', function() {
    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);

    profilePage.get(ANOTHER_USERNAME);
    profilePage.expectToHaveExplorationCards();
    profilePage.expectToHaveExplorationCardByName(EXPLORATION.title);
  });

  it('should show created exploration stats for user', function() {
    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);

    profilePage.get(ANOTHER_USERNAME);
    profilePage.expectToHaveCreatedExplorationStat('1');
  });

  afterEach(function() {
    users.logout();
    general.checkForConsoleErrors([]);
  });
});

describe('Playing the exploration', function() {
  var TEST_USERNAME = 'testUser';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var continueButton = element(by.css('.protractor-test-continue-button'));
  var backButton = element(by.css('.protractor-test-back-button'));
  var nextButton = element(by.css('.protractor-test-next-button'));

  var explorationPlayerPage = null;
  var libraryPage = null;

  var EXPLORATION = {
    title: 'A new exploration',
    category: 'Learning',
    objective: 'The goal is to create a new exploration',
    language: 'English'
  };

  beforeAll(function() {
    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);
  });

  it('should change the cards on clicking next and back buttons', function() {
    workflow.createAndPublishTwoCardExploration(
      EXPLORATION.title,
      EXPLORATION.category,
      EXPLORATION.objective,
      EXPLORATION.language
    );

    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    libraryPage.get();
    libraryPage.findExploration(EXPLORATION.title);
    libraryPage.playExploration(EXPLORATION.title);

    explorationPlayerPage.expectExplorationNameToBe(EXPLORATION.title);
    explorationPlayerPage.expectContentToMatch(forms.toRichText('card 1'));

    // Test continue button
    waitFor.elementToBeClickable(
      continueButton, 'Continue button taking too long to be clickable');
    continueButton.click();
    waitFor.pageToFullyLoad();
    explorationPlayerPage.expectContentToMatch(forms.toRichText('card 2'));

    // Test back button
    waitFor.elementToBeClickable(
      backButton, 'Back button taking too long to be clickable');
    backButton.click();
    waitFor.pageToFullyLoad();
    explorationPlayerPage.expectContentToMatch(forms.toRichText('card 1'));

    // Test next button
    waitFor.elementToBeClickable(
      nextButton, 'Next button taking too long to be clickable');
    nextButton.click();
    waitFor.pageToFullyLoad();
    explorationPlayerPage.expectContentToMatch(forms.toRichText('card 2'));
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
