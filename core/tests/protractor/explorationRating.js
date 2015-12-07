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
 *
 * @author Shouvik Roy (shouvik@techie.com)
 */
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');
var gallery = require('../protractor_utils/gallery.js');
var forms = require('../protractor_utils/forms.js');

describe('Gallery view', function() {
  var EXPLORATION_SILMARILS = 'silmarils';
  var EXPLORATION_VINGILOT = 'Vingilot';
  var CATEGORY_BUSINESS = 'Business';
  var LANGUAGE_ENGLISH = 'English';
  var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;

  it('shouldnot display ratings on exploration when submitted rating is less than minimum number', function() {
    users.createUser('feanor@exmple.com', 'Feanor');
    // Create an test exploration
    users.login('feanor@exmple.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_BUSINESS,
      'hold the light of the two trees', LANGUAGE_ENGLISH);
    users.logout();

    // Create test users, play exploration and review them after completion
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@example.com';
      var username = 'NoDisplay' + i;
      users.createUser(userEmail, username);
      users.login(userEmail);
      browser.get('/gallery');
      general.waitForSystem();
      gallery.playExploration(EXPLORATION_SILMARILS);
      player.expectExplorationNameToBe('silmarils');
      player.submitAnswer('Continue');
      player.reviewExploration(4);

      users.logout();
    }
    browser.get('/gallery');
    gallery.expectExplorationRatingToBeNotDisplayed(EXPLORATION_SILMARILS);
  });

  it('should display ratings when minimum rating is submitted', function() {
    // Create an test exploration
    users.login('feanor@exmple.com');
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_BUSINESS,
      'seek the aid of the Valar', LANGUAGE_ENGLISH);
    users.logout();

    // Create test users, play exploration and review them after completion
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS; i++) {
      var userEmail = 'Display' + i + '@example.com';
      var username = 'Display' + i;
      users.createUser(userEmail, username);
      users.login(userEmail);
      browser.get('/gallery');
      general.waitForSystem();
      gallery.playExploration(EXPLORATION_VINGILOT);
      player.expectExplorationNameToBe('Vingilot');
      player.submitAnswer('Continue');
      player.reviewExploration(4);

      users.logout();
    }
    browser.get('/gallery');
    gallery.expectExplorationRatingToBeDisplayed(EXPLORATION_VINGILOT);
  });
  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
