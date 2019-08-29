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
 * @fileoverview End-to-end tests for the creator dashboard page.
 */

var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Creator dashboard functionality', function() {
  var EXPLORATION_TITLE_1 = 'Exploration 1';
  var EXPLORATION_TITLE_2 = 'Exploration 2';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';

  var creatorDashboardPage = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('should display correct stats on dashboard', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    users.createUser(
      'user1@creatorDashboard.com',
      'creatorDashboardOwner');
    users.createUser(
      'user2@creatorDashboard.com',
      'learner2');
    users.createUser(
      'user3@creatorDashboard.com',
      'learner3');
    users.createUser(
      'user4@creatorDashboard.com',
      'learner4');

    users.login('user1@creatorDashboard.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();

    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);

    users.login('user2@creatorDashboard.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creatorDashboardOwner');
    subscriptionDashboardPage.navigateToSubscriptionButton();
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_1);
    libraryPage.playExploration(EXPLORATION_TITLE_1);
    explorationPlayerPage.rateExploration(3);
    users.logout();

    users.login('user3@creatorDashboard.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_1);
    libraryPage.playExploration(EXPLORATION_TITLE_1);
    explorationPlayerPage.rateExploration(5);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    users.login('user1@creatorDashboard.com');
    creatorDashboardPage.get();
    expect(creatorDashboardPage.getAverageRating()).toEqual('4');
    expect(creatorDashboardPage.getTotalPlays()).toEqual('2');
    expect(creatorDashboardPage.getOpenFeedbacks()).toEqual('1');
    expect(creatorDashboardPage.getSubscribers()).toEqual('1');
    users.logout();

    users.login('user4@creatorDashboard.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(
      'creatorDashboardOwner');
    subscriptionDashboardPage.navigateToSubscriptionButton();
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_2);
    libraryPage.playExploration(EXPLORATION_TITLE_2);
    explorationPlayerPage.rateExploration(4);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    users.login('user1@creatorDashboard.com');
    creatorDashboardPage.get();
    expect(creatorDashboardPage.getAverageRating()).toEqual('4');
    expect(creatorDashboardPage.getTotalPlays()).toEqual('3');
    expect(creatorDashboardPage.getOpenFeedbacks()).toEqual('2');
    expect(creatorDashboardPage.getSubscribers()).toEqual('2');
    users.logout();
  });
});
