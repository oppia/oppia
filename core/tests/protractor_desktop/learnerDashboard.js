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
 * @fileoverview End-to-end tests for the learner dashboard page.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Learner dashboard functionality', function() {
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('should display learners subscriptions', async function() {
    await users.createUser(
      'learner1@learnerDashboard.com', 'learner1learnerDashboard');
    var creator1Id = 'creatorName';
    await users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    var creator2Id = 'collectionAdm';
    await users.createUser(
      creator2Id + '@learnerDashboard.com', creator2Id);
    await users.login(creator1Id + '@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner1@learnerDashboard.com');
    // Subscribe to both the creators.
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    await subscriptionDashboardPage.navigateToSubscriptionButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    await subscriptionDashboardPage.navigateToSubscriptionButton();

    // Completing exploration 'Activations' to activate /learner_dashboard.
    await libraryPage.get();
    await libraryPage.findExploration('Activations');
    await libraryPage.playExploration('Activations');
    await explorationPlayerPage.expectExplorationNameToBe('Activations');
    await explorationPlayerPage.rateExploration(4);

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToSubscriptionsSection();
    // The last user (creatorName) that learner subsribes to is placed first
    // in the list.
    await learnerDashboardPage.expectSubscriptionFirstNameToMatch('creator...');
    // The first user (collectionAdm) that learner subscribes to is placed
    // last in the list.
    await learnerDashboardPage.expectSubscriptionLastNameToMatch('collect...');
    await users.logout();
  });

  it('should display learner feedback threads', async function() {
    await users.createUser(
      'learner2@learnerDashboard.com', 'learner2learnerDashboard');
    await users.createUser(
      'feedbackAdm@learnerDashboard.com', 'feedbackAdmlearnerDashboard');
    await users.login('feedbackAdm@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    await libraryPage.get();
    await libraryPage.findExploration('BUS101');
    await libraryPage.playExploration('BUS101');
    await explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToFeedbackSection();
    await learnerDashboardPage.expectFeedbackExplorationTitleToMatch('BUS101');
    await learnerDashboardPage.navigateToFeedbackThread();
    await learnerDashboardPage.expectFeedbackMessageToMatch(feedback);
    await users.logout();
  });

  it('should add exploration to play later list', async function() {
    var EXPLORATION_FRACTION = 'fraction';
    var EXPLORATION_SINGING = 'singing';
    var CATEGORY_MATHEMATICS = 'Mathematics';
    var CATEGORY_MUSIC = 'Music';
    var LANGUAGE_ENGLISH = 'English';
    var EXPLORATION_OBJECTIVE = 'hold the light of two trees';
    var EXPLORATION_OBJECTIVE2 = 'show us the darkness';

    await users.createUser(
      'creator@learnerDashboard.com', 'creatorLearnerDashboard');
    await users.login('creator@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_FRACTION,
      CATEGORY_MATHEMATICS,
      EXPLORATION_OBJECTIVE,
      LANGUAGE_ENGLISH,
      true
    );
    await workflow.createAndPublishExploration(
      EXPLORATION_SINGING,
      CATEGORY_MUSIC,
      EXPLORATION_OBJECTIVE2,
      LANGUAGE_ENGLISH,
      false
    );
    await users.logout();

    await users.createUser(
      'learner@learnerDashboard.com', 'learnerLearnerDashboard');
    await users.login('learner@learnerDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_FRACTION);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToPlayLaterExplorationSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_FRACTION);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_SINGING);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToPlayLaterExplorationSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_SINGING);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
