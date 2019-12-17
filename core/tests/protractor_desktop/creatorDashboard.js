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

var general = require('../protractor_utils/general.js');
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
  var EXPLORATION_TITLE_3 = 'Exploration 3';
  var EXPLORATION_TITLE_4 = 'Exploration 4';
  var EXPLORATION_TITLE_5 = 'Exploration 5';
  var EXPLORATION_TITLE_6 = 'Exploration 6';
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

  it('should work fine in grid view', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    users.createUser(
      'user5@creatorDashboard.com',
      'creatorDashboard');
    users.createUser(
      'user6@creatorDashboard.com',
      'learner6');
    users.createUser(
      'user7@creatorDashboard.com',
      'learner7');

    users.login('user5@creatorDashboard.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_3,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();

    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_4,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    users.logout();
    users.login('user6@creatorDashboard.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_3);
    libraryPage.playExploration(EXPLORATION_TITLE_3);
    explorationPlayerPage.rateExploration(3);
    users.logout();

    users.login('user7@creatorDashboard.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_4);
    libraryPage.playExploration(EXPLORATION_TITLE_4);
    explorationPlayerPage.rateExploration(5);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    users.login('user5@creatorDashboard.com');
    creatorDashboardPage.get();
    creatorDashboardPage.getExpSummaryTileTitles().
      then(function(titles) {
        expect(titles.length).toEqual(2);
        expect(titles[0].getText()).toEqual(EXPLORATION_TITLE_4);
        expect(titles[1].getText()).toEqual(EXPLORATION_TITLE_3);
      });
    creatorDashboardPage.getExpSummaryTileRatings().
      then(function(ratings) {
        expect(ratings.length).toEqual(2);
        expect(ratings[0].getText()).toEqual('5.0');
        expect(ratings[1].getText()).toEqual('3.0');
      });
    creatorDashboardPage.getExpSummaryTileOpenFeedbackCount().
      then(function(feedbackCount) {
        expect(feedbackCount.length).toEqual(2);
        expect(feedbackCount[0].getText()).toEqual('1');
        expect(feedbackCount[1].getText()).toEqual('0');
      });
    creatorDashboardPage.getExpSummaryTileViewsCount().
      then(function(views) {
        expect(views.length).toEqual(2);
        expect(views[0].getText()).toEqual('1');
        expect(views[1].getText()).toEqual('1');
      });
    users.logout();
  });

  it('should work fine in list view', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    // Create required users.
    users.createUser(
      'user8@creatorDashboard.com',
      'newCreatorDashboard');
    users.createUser(
      'user9@creatorDashboard.com',
      'learner9');
    users.createUser(
      'user10@creatorDashboard.com',
      'learner10');

    users.login('user8@creatorDashboard.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_5,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();

    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_6,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    users.logout();
    users.login('user9@creatorDashboard.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_5);
    libraryPage.playExploration(EXPLORATION_TITLE_5);
    explorationPlayerPage.rateExploration(3);
    users.logout();

    users.login('user10@creatorDashboard.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_6);
    libraryPage.playExploration(EXPLORATION_TITLE_6);
    explorationPlayerPage.rateExploration(5);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    users.login('user8@creatorDashboard.com');
    creatorDashboardPage.get();

    creatorDashboardPage.getListView();

    creatorDashboardPage.getExpSummaryRowTitles().
      then(function(titles) {
        expect(titles.length).toEqual(2);
        expect(titles[0].getText()).toEqual(EXPLORATION_TITLE_6);
        expect(titles[1].getText()).toEqual(EXPLORATION_TITLE_5);
      });
    creatorDashboardPage.getExpSummaryRowRatings().
      then(function(ratings) {
        expect(ratings.length).toEqual(2);
        expect(ratings[0].getText()).toEqual('5.0');
        expect(ratings[1].getText()).toEqual('3.0');
      });
    creatorDashboardPage.getExpSummaryRowOpenFeedbackCount().
      then(function(feedbackCount) {
        expect(feedbackCount.length).toEqual(2);
        expect(feedbackCount[0].getText()).toEqual('1');
        expect(feedbackCount[1].getText()).toEqual('0');
      });
    creatorDashboardPage.getExpSummaryRowViewsCount().
      then(function(views) {
        expect(views.length).toEqual(2);
        expect(views[0].getText()).toEqual('1');
        expect(views[1].getText()).toEqual('1');
      });
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
