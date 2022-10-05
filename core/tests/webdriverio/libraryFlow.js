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
 * @fileoverview End-to-end tests for library flow.
 */

var action = require('../webdriverio_utils/action.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ExplorationPlayerPage = require(
  '../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

describe('Library pages tour', function() {
  var EXPLORATION_TITLE = 'Test Exploration';
  var EXPLORATION_OBJECTIVE = 'To learn testing';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var EXPLORATION_RATING = 4;
  var SEARCH_TERM = 'python';
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var visitRecentlyPublishedPage = async function() {
    await browser.url('community-library/recently-published');
    await waitFor.pageToFullyLoad();
  };

  var rateExploration = async function() {
    var adminPage = new AdminPage.AdminPage();
    await users.createAndLoginSuperAdminUser('random@gmail.com', 'random');
    // We need an exploration to rate here.
    if (browser.isMobile) {
      await adminPage.reloadExploration(
        'protractor_mobile_test_exploration.yaml');
    } else {
      await workflow.createAndPublishExploration(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE,
        true
      );
    }
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);
    await explorationPlayerPage.rateExploration(EXPLORATION_RATING);
    await users.logout();
  };

  it('should visit the search page', async function() {
    await libraryPage.get();
    await libraryPage.findExploration(SEARCH_TERM);
    await waitFor.urlToBe(
      'http://localhost:9001/search/find?q=python&language_code=(%22en%22)');
  });

  it('should visit the library index page', async function() {
    await libraryPage.get();
  });

  it('should visit the top rated page', async function() {
    // To visit the top rated page, at least one
    // exploration has to be rated by the user.
    await rateExploration();
    await libraryPage.get();
    var topRatedButton = $('.e2e-test-library-top-rated');
    await action.click('Top Rated Button', topRatedButton);
    await waitFor.pageToFullyLoad();
    expect(await browser.getUrl()).toContain(
      'community-library/top-rated');
  });

  it('should visit the recent explorations page', async function() {
    await visitRecentlyPublishedPage();
    expect(await browser.getUrl()).toContain(
      'community-library/recently-published');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Rating', function() {
  var EXPLORATION_RATINGTEST = 'RatingTest';
  var CATEGORY_BUSINESS = 'Business';
  var LANGUAGE_ENGLISH = 'English';
  var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;
  var adminPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var addRating = async function(
      userEmail, userName, explorationName, ratingValue) {
    await users.createAndLoginUser(userEmail, userName);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_RATINGTEST);
    await libraryPage.playExploration(EXPLORATION_RATINGTEST);

    // The exploration header is only visible in desktop browsers.
    if (!browser.isMobile) {
      await explorationPlayerPage.expectExplorationNameToBe(explorationName);
    }
    await explorationPlayerPage.rateExploration(ratingValue);
    await users.logout();
  };

  it('should display ratings on exploration when minimum ratings have been ' +
     'submitted', async function() {
    await users.createAndLoginSuperAdminUser(
      'user11@explorationRating.com', 'user11Rating');

    // The below lines of code enable the user checkpoints feature on the
    // config tab. This is required to enable the lesson-info modal button
    // on the exploration footer, which in turn is required to view the ratings.
    // This should be removed when the user checkpoints feature is no longer
    // gated behind a config option.
    await adminPage.editConfigProperty(
      'Enable checkpoints feature.', 'Boolean',
      async(elem) => await (await elem).setValue(true));

    // Create a test exploration.

    // We need a test exploration here.
    if (browser.isMobile) {
      // In case of a mobile device, load a demo test exploration
      // from the admin page.
      await adminPage.reloadExploration('rating_test.yaml');
    } else {
      // For a desktop browser, create and publish an exploration.
      await workflow.createAndPublishExploration(
        EXPLORATION_RATINGTEST,
        CATEGORY_BUSINESS,
        'this is an objective',
        LANGUAGE_ENGLISH,
        true
      );
    }
    await users.logout();

    // Create test users, play exploration and review them after completion.
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@explorationRating.com';
      var username = 'NoDisplay' + i;
      await addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);
    }

    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_RATINGTEST);
    await libraryPage.expectExplorationRatingToEqual(
      EXPLORATION_RATINGTEST, 'N/A');

    var userEmail = 'Display@explorationRating.com';
    var username = 'Display';
    await addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);

    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_RATINGTEST);
    await libraryPage.expectExplorationRatingToEqual(
      EXPLORATION_RATINGTEST, '4.0');

    await libraryPage.playExploration(EXPLORATION_RATINGTEST);
    // The information card is only visible in desktop browsers.
    if (!browser.isMobile) {
      await explorationPlayerPage.
        expectExplorationRatingOnInformationCardToEqual('4.0');
    }
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
