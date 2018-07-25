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
 * @fileoverview End-to-end tests of the rating mechanism.
 */

var AdminPage = require('../protractor_utils/AdminPage.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

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

  var addRating = function(userEmail, userName, explorationName, ratingValue) {
    users.createUser(userEmail, userName);
    users.login(userEmail);
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.playExploration(EXPLORATION_RATINGTEST);

    // The exploration header is only visible in desktop browsers.
    if (!browser.isMobile) {
      explorationPlayerPage.expectExplorationNameToBe(explorationName);
    }
    explorationPlayerPage.rateExploration(ratingValue);
    users.logout();
  };

  it('should display ratings on exploration when minimum ratings have been ' +
     'submitted', function() {
    users.createUser('user11@explorationRating.com', 'user11Rating');
    // Create a test exploration.
    users.login('user11@explorationRating.com', true);

    // We need a test exploration here.
    if (browser.isMobile) {
      // In case of a mobile device, load a demo test exploration
      // from the admin page.
      adminPage.reloadExploration('rating_test.yaml');
    } else {
      // For a desktop browser, create and publish an exploration.
      workflow.createAndPublishExploration(
        EXPLORATION_RATINGTEST, CATEGORY_BUSINESS,
        'this is an objective', LANGUAGE_ENGLISH);
    }
    users.logout();

    // Create test users, play exploration and review them after completion.
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@explorationRating.com';
      var username = 'NoDisplay' + i;
      addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);
    }

    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, 'N/A');

    var userEmail = 'Display@explorationRating.com';
    var username = 'Display';
    addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);

    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, '4.0');

    libraryPage.playExploration(EXPLORATION_RATINGTEST);
    // The information card is only visible in desktop browsers.
    if (!browser.isMobile) {
      explorationPlayerPage.expectExplorationRatingOnInformationCardToEqual(
        '4.0');
    }
  });

  afterEach(function() {
    if (browser.isMobile) {
      general.checkForConsoleErrors([
        // TODO(apb7): Remove these when https://github.com/oppia/oppia/issues/5363 is resolved.
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: RatingTest"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Mismatch"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "SearchQuery: RatingTest"',
        'http://localhost:9001/third_party/static/angularjs-1.5.8/angular.min.js 117:9 "Input: "'
      ]);
    } else {
      general.checkForConsoleErrors([]);
    }
  });
});
