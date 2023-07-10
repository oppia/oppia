// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var forms = require('../webdriverio_utils/forms.js');
var users = require('../webdriverio_utils/users.js');
var general = require('../webdriverio_utils/general.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var CreatorDashboardPage =
  require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var PreferencesPage = require('../webdriverio_utils/PreferencesPage.js');
var ProfilePage = require('../webdriverio_utils/ProfilePage.js');

describe('Un-customized profile page', function() {
  var TEST_USERNAME = 'defaultProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var profilePage = null;

  beforeAll(async function() {
    profilePage = new ProfilePage.ProfilePage();
    await users.createUser(TEST_EMAIL, TEST_USERNAME);
  });

  it('should display photo, default bio, and interest placeholder when ' +
    'logged in',
  async function() {
    await users.login(TEST_EMAIL);
    await profilePage.get(TEST_USERNAME);
    await profilePage.expectUserToHaveProfilePhoto();
    await profilePage.expectUserToHaveBio(DEFAULT_BIO);
    await profilePage.expectUserToHaveNoInterests();
    await profilePage.expectUserToHaveInterestPlaceholder(
      PLACEHOLDER_INTEREST_TEXT);
    await users.logout();
  }
  );

  it('should display default photo, default bio, and no interests when ' +
    'logged out',
  async function() {
    await profilePage.get(TEST_USERNAME);
    await profilePage.expectUserToHaveProfilePhoto();
    await profilePage.expectUserToHaveBio(DEFAULT_BIO);
    await profilePage.expectUserToHaveNoInterests();
    await profilePage.expectUserToHaveInterestPlaceholder(
      PLACEHOLDER_INTEREST_TEXT);
  }
  );

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Customized profile page for current user', function() {
  var TEST_USERNAME = 'customizedProfileFeatures';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var TEST_BIO = 'My test bio!';
  var TEST_INTERESTS = ['math', 'social studies'];

  var profilePage = null;

  beforeAll(async function() {
    profilePage = new ProfilePage.ProfilePage();
    var preferencesPage = new PreferencesPage.PreferencesPage();
    await users.createUser(TEST_EMAIL, TEST_USERNAME);
    await users.login(TEST_EMAIL);
    await preferencesPage.get();
    await preferencesPage.setUserBio(TEST_BIO);
    await preferencesPage.get();
    await preferencesPage.setUserInterests(TEST_INTERESTS);
    await users.logout();
  });

  it('should display photo, custom bio, and interests when logged in',
    async function() {
      await users.login(TEST_EMAIL);
      await profilePage.get(TEST_USERNAME);
      await profilePage.expectUserToHaveProfilePhoto();
      await profilePage.expectUserToHaveBio(TEST_BIO);
      await profilePage.expectUserToHaveInterests(TEST_INTERESTS);
      await profilePage.expectUserToNotHaveInterestPlaceholder();
      await users.logout();
    });

  it('should display default photo, custom bio, and interests when logged out',
    async function() {
      await profilePage.get(TEST_USERNAME);
      await profilePage.expectUserToHaveProfilePhoto();
      await profilePage.expectUserToHaveBio(TEST_BIO);
      await profilePage.expectUserToHaveInterests(TEST_INTERESTS);
      await profilePage.expectUserToNotHaveInterestPlaceholder();
    }
  );

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
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

  beforeAll(async function() {
    profilePage = new ProfilePage.ProfilePage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();

    await users.createUser(ANOTHER_EMAIL, ANOTHER_USERNAME);
    await users.login(ANOTHER_EMAIL);

    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION.title,
      EXPLORATION.category,
      EXPLORATION.objective,
      EXPLORATION.language,
      true
    );

    await creatorDashboardPage.get();
    await creatorDashboardPage.expectToHaveExplorationCard(EXPLORATION.title);
    await users.logout();
  });

  it('should show the explorations created by the user', async function() {
    await users.createUser(TEST_EMAIL, TEST_USERNAME);
    await users.login(TEST_EMAIL);

    await profilePage.get(ANOTHER_USERNAME);
    await profilePage.expectToHaveExplorationCards();
    await profilePage.expectToHaveExplorationCardByName(EXPLORATION.title);
    await users.logout();
  });

  it('should show created exploration stats for user', async function() {
    await users.login(TEST_EMAIL);

    await profilePage.get(ANOTHER_USERNAME);
    await profilePage.expectToHaveCreatedExplorationStat('1');
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Playing the exploration', function() {
  var TEST_USERNAME = 'testUser';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';

  var explorationPlayerPage = null;
  var libraryPage = null;

  var EXPLORATION = {
    title: 'A new exploration to play',
    category: 'Learning',
    objective: 'The goal is to check back and next buttons',
    language: 'English'
  };

  var backButtonSelector = function() {
    return $('.e2e-test-back-button');
  };
  var nextButtonSelector = function() {
    return $('.e2e-test-next-button');
  };

  beforeAll(async function() {
    await users.createUser(TEST_EMAIL, TEST_USERNAME);
    await users.login(TEST_EMAIL);
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    await workflow.createAndPublishTwoCardExploration(
      EXPLORATION.title,
      EXPLORATION.category,
      EXPLORATION.objective,
      EXPLORATION.language,
      true
    );
    await users.logout();
  });

  it('should change the cards on clicking next and back buttons',
    async function() {
      await users.login(TEST_EMAIL);
      await libraryPage.get();
      await libraryPage.findExploration(EXPLORATION.title);
      await libraryPage.playExploration(EXPLORATION.title);

      await explorationPlayerPage.expectExplorationNameToBe(EXPLORATION.title);
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('card 1'));

      // Test continue button.
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.expectExplorationToNotBeOver();

      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('card 2'));

      // Test back button.
      var backButton = backButtonSelector();
      await waitFor.elementToBeClickable(
        backButton, 'Back button taking too long to be clickable');
      await backButton.click();
      await waitFor.pageToFullyLoad();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('card 1'));

      // Test next button.
      var nextButton = nextButtonSelector();
      await waitFor.elementToBeClickable(
        nextButton, 'Next button taking too long to be clickable');
      await nextButton.click();
      await waitFor.pageToFullyLoad();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('card 2'));
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
