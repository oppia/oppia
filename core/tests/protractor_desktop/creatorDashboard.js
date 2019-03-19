
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
 * @fileoverview End-to-end tests for the creator dashboard page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');


var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage = require('../protractor_utils/CreatorDashboardPage.js');
var CollectionEditorPage = require('../protractor_utils/CollectionEditorPage.js');
var ExplorationEditorPage = require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Creator dashboard functionality', function() {
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('displays creators subscribers', function() {
    // created a creator ID and 2 learner ID.
    var creator1Id = 'creatorName';
    users.createUser('learner1@learnerDashboard.com', 
    'learner1learnerDashboard');
    users.createUser('learner2@learnerDashboard.com', 
    'learner2learnerDashboard');
    users.createUser(creator1Id + '@creatorDashboard.com', creator1Id);

      // created a new exploration for the creator.
    users.login(creator1Id + '@creatorDashboard.com');
    creatorDashboardPage.clickCreateExplorationButton();    
    workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English'
    );
    users.logout();
     
    // both the learners will subscribe to the creator.
    users.login('learner1@learnerDashboard.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();
    users.logout();

    users.login('learner2@learnerDashboard.com');
    subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    subscriptionDashboardPage.navigateToSubscriptionButton();
    users.logout();
     
      //exploration created by the creator.
    users.login(creator1Id + '@creatorDashboard.com');
    workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English'
    );
    
      //navigating to creator's subscribed dashboard.
    creatorDashboardPage.navigateToSubscriptionDashboard();
    users.logout();
  });

  it('get all feedback messages count & edit exploration', function() {
    var creator1Id = 'creatorName';
    users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    users.createUser('learner1@learnerDashboard.com', 'learner1learnerDashboard');
    users.login(creator1Id + '@creatorDashboard.com');
    creatorDashboardPage.clickCreateExplorationButton();    
    workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English'
    );
    users.logout();

      //learner gives a feedback to creator exploration.
    users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    libraryPage.get();
    libraryPage.findExploration('Activations');
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    //creator checks all his feedback messages.
    users.login(creator1Id + '@creatorDashboard.com');
    creatorDashboardPage.getNumberOfFeedbackMessages();
    creatorDashboardPage.editExploration('Activations');
    users.logout();
  });
      
  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
