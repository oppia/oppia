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
 * @fileoverview End-to-end tests of the exploration rating feature.
 */
var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var library = require('../protractor_utils/library.js');
var player = require('../protractor_utils/player.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Library index page', function() {
  var EXPLORATION_RATINGTEST = 'RatingTest';
  var CATEGORY_BUSINESS = 'Business';
  var LANGUAGE_ENGLISH = 'English';
  var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;
  var addRating = function(userEmail, userName, explorationName, ratingValue) {
    users.createUser(userEmail, userName);
    users.login(userEmail);
    browser.get(general.LIBRARY_URL_SUFFIX);
    library.playExploration(EXPLORATION_RATINGTEST);
    player.expectExplorationNameToBe(explorationName);
    player.submitAnswer('Continue');
    player.rateExploration(ratingValue);

    users.logout();
  };

  it('should display ratings on exploration when minimum ratings have been ' +
     'submitted', function() {
    users.createUser('user1@explorationRating.com', 'user1Rating');
    // Create an test exploration
    users.login('user1@explorationRating.com');
    workflow.createAndPublishExploration(
      EXPLORATION_RATINGTEST, CATEGORY_BUSINESS,
      'this is an objective', LANGUAGE_ENGLISH);
    users.logout();

    // Create test users, play exploration and review them after completion
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@explorationRating.com';
      var username = 'NoDisplay' + i;
      addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);
    }

    browser.get(general.LIBRARY_URL_SUFFIX);
    library.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, 'N/A');

    var userEmail = 'Display@explorationRating.com';
    var username = 'Display';
    addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);

    browser.get(general.LIBRARY_URL_SUFFIX);
    library.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, '4.0');

    library.playExploration(EXPLORATION_RATINGTEST);
    player.expectExplorationRatingOnInformationCardToEqual('4.0');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
