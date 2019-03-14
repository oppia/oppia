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

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');

describe('Learner dashboard functionality', function() {
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
  });

  it('displays learners subscriptions', function() {
    users.createUser('learner1@learnerDashboard.com',
      'learner1learnerDashboard');
    var creator1Id = 'creatorName';
    users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    var creator2Id = 'collectionAdm';
    users.createUser(creator2Id + '@learnerDashboard.com',
      creator2Id);
    users.login(creator1Id + '@learnerDashboard.com');
    workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English'
    );
    users.logout();

    users.login('learner1@learnerDashboard.com');
    // Subscribe to both the creators.
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();

    // Completing exploration 'Activations' to activate /learner_dashboard
    libraryPage.get();
    libraryPage.findExploration('Activations');
    libraryPage.playExploration('Activations');
    explorationPlayerPage.expectExplorationNameToBe('Activations');
    explorationPlayerPage.rateExploration(4);

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToSubscriptionsSection();
    // The last user (collectionAdm) that learner subsribes to is placed first
    // in the list.
    learnerDashboardPage.expectSubscriptionFirstNameToMatch('collect...');
    // The first user (creatorName) that learner subscribes to is placed
    // last in the list.
    learnerDashboardPage.expectSubscriptionLastNameToMatch('creator...');
    users.logout();
  });

  it('displays learner feedback threads', function() {
    users.createUser('learner2@learnerDashboard.com',
      'learner2learnerDashboard');
    users.createUser(
      'feedbackAdm@learnerDashboard.com', 'feedbackAdmlearnerDashboard');
    users.login('feedbackAdm@learnerDashboard.com');
    workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English'
    );
    users.logout();

    users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    libraryPage.get();
    libraryPage.findExploration('BUS101');
    libraryPage.playExploration('BUS101');
    explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    learnerDashboardPage.get();
    learnerDashboardPage.navigateToFeedbackSection();
    learnerDashboardPage.expectFeedbackExplorationTitleToMatch('BUS101');
    learnerDashboardPage.navigateToFeedbackThread();
    learnerDashboardPage.expectFeedbackMessageToMatch(feedback);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
