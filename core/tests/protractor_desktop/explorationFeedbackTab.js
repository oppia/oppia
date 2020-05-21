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
 * @fileoverview End-to-end tests for the functionality of the feedback tab of
 * the exploration editor.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('ExplorationFeedback', function() {
  var EXPLORATION_TITLE_1 = 'Exploration with Feedback';
  var EXPLORATION_TITLE_2 = 'Exploration for testing feedback status';
  var EXPLORATION_TITLE_3 = 'Exploration for testing feedback message';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var adminPage = null;
  var explorationEditorPage = null;
  var explorationEditorFeedbackTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    users.createUser(
      'user1@ExplorationFeedback.com',
      'creatorExplorationFeedback');
    users.createUser(
      'user2@ExplorationFeedback.com',
      'learnerExplorationFeedback');
    users.createUser(
      'user3@ExplorationFeedback.com',
      'creatorExplorationFBStatChange');
    users.createUser(
      'user4@ExplorationFeedback.com',
      'learnerExplorationFBStatChange');
    users.createUser(
      'user5@ExplorationFeedback.com',
      'creatorFeedback');
    users.createUser(
      'user6@ExplorationFeedback.com',
      'learnerFeedback');
    users.createAndLoginAdminUser(
      'user7@ExplorationFeedback.com',
      'superUserExplorationFeedback');
  });

  it('should add feedback to an exploration', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    users.login('user1@ExplorationFeedback.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    users.logout();

    // Learner plays the exploration and submits a feedback.
    users.login('user2@ExplorationFeedback.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_1);
    libraryPage.playExploration(EXPLORATION_TITLE_1);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds.
    users.login('user1@ExplorationFeedback.com');
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    creatorDashboardPage.navigateToExplorationEditor();

    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    explorationEditorFeedbackTab.readFeedbackMessages()
      .then(function(messages) {
        expect(messages.length).toEqual(1);
        expect(messages[0]).toEqual(feedback);
      });
    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.sendResponseToLatestFeedback(feedbackResponse);
    users.logout();
  });

  it('should change status of feedback thread', function() {
    var feedback = 'Hey! This exploration looks awesome';
    var feedbackResponse = 'Thanks for the feedback!';

    // Creator creates and publishes an exploration.
    users.login('user3@ExplorationFeedback.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    users.logout();

    // Learner plays the exploration and submits a feedback.
    users.login('user4@ExplorationFeedback.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_2);
    libraryPage.playExploration(EXPLORATION_TITLE_2);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds.
    users.login('user3@ExplorationFeedback.com');
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    creatorDashboardPage.navigateToExplorationEditor();

    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    explorationEditorFeedbackTab.readFeedbackMessages()
      .then(function(messages) {
        expect(messages.length).toEqual(1);
        expect(messages[0]).toEqual(feedback);
      });
    explorationEditorFeedbackTab.selectLatestFeedbackThread();
    explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');
    explorationEditorFeedbackTab.changeFeedbackStatus(
      'Fixed', feedbackResponse);
    explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    browser.refresh();
    explorationEditorFeedbackTab.selectLatestFeedbackThread();
    explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    explorationEditorFeedbackTab.changeFeedbackStatus(
      'Open', feedbackResponse);
    explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');

    users.logout();
  });

  it('should send message to feedback thread', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    users.login('user5@ExplorationFeedback.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_3,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    users.logout();

    // Learner plays the exploration and submits a feedback.
    users.login('user6@ExplorationFeedback.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_3);
    libraryPage.playExploration(EXPLORATION_TITLE_3);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds.
    users.login('user5@ExplorationFeedback.com');
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    creatorDashboardPage.navigateToExplorationEditor();

    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    explorationEditorFeedbackTab.readFeedbackMessages()
      .then(function(messages) {
        expect(messages.length).toEqual(1);
        expect(messages[0]).toEqual(feedback);
      });
    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.sendResponseToLatestFeedback(
      feedbackResponse);
    explorationEditorFeedbackTab.readFeedbackMessagesFromThread()
      .then(function(messages) {
        expect(messages.length).toEqual(2);
        expect(messages[0].getText()).toEqual(feedback);
        expect(messages[1].getText()).toEqual(feedbackResponse);
      });
    browser.refresh();
    explorationEditorFeedbackTab.selectLatestFeedbackThread();
    explorationEditorFeedbackTab.readFeedbackMessagesFromThread()
      .then(function(messages) {
        expect(messages.length).toEqual(2);
        expect(messages[0].getText()).toEqual(feedback);
        expect(messages[1].getText()).toEqual(feedbackResponse);
      });
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Suggestions on Explorations', function() {
  var EXPLORATION_TITLE = 'Exploration with Suggestion';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_OBJECTIVE = 'To explore something new';
  var EXPLORATION_LANGUAGE = 'English';
  var adminPage = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorFeedbackTab = null;
  var explorationPlayerPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();

    users.createUser(
      'user1@ExplorationSuggestions.com',
      'authorExplorationSuggestions');
    users.createUser(
      'user2@ExplorationSuggestions.com',
      'suggesterExpSuggestions');
    users.createUser(
      'user3@ExplorationSuggestions.com',
      'studentExplorationSuggestions');
    users.createAndLoginAdminUser(
      'user4@ExplorationSuggestions.com',
      'configExplorationSuggestions');
  });

  it('accepts & rejects a suggestion on a published exploration', function() {
    users.login('user1@ExplorationSuggestions.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    users.logout();

    // Suggester plays the exploration and suggests a change.
    users.login('user2@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    var suggestion1 = 'New Exploration';
    var suggestionDescription1 = 'Uppercased the first letter';
    var suggestion2 = 'New exploration';
    var suggestionDescription2 = 'Changed';

    explorationPlayerPage.submitSuggestion(
      suggestion1, suggestionDescription1);
    explorationPlayerPage.clickOnCloseSuggestionModalButton();
    explorationPlayerPage.submitSuggestion(
      suggestion2, suggestionDescription2);
    users.logout();

    // Exploration author reviews the suggestion and accepts it.
    users.login('user1@ExplorationSuggestions.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();

    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.getSuggestionThreads().then(
      function(threads) {
        expect(threads.length).toEqual(2);
        expect(threads[0]).toMatch(suggestionDescription2);
      });
    explorationEditorFeedbackTab.acceptSuggestion(suggestionDescription1);
    explorationEditorFeedbackTab.goBackToAllFeedbacks();
    explorationEditorFeedbackTab.rejectSuggestion(suggestionDescription2);

    explorationEditorPage.navigateToPreviewTab();
    explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion1));
    users.logout();

    // Student logs in and plays the exploration, finds the updated content.
    users.login('user3@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion1));
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
