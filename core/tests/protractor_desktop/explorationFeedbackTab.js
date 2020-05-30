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

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    await users.createUser(
      'user1@ExplorationFeedback.com',
      'creatorExplorationFeedback');
    await users.createUser(
      'user2@ExplorationFeedback.com',
      'learnerExplorationFeedback');
    await users.createUser(
      'user3@ExplorationFeedback.com',
      'creatorExplorationFBStatChange');
    await users.createUser(
      'user4@ExplorationFeedback.com',
      'learnerExplorationFBStatChange');
    await users.createUser(
      'user5@ExplorationFeedback.com',
      'creatorFeedback');
    await users.createUser(
      'user6@ExplorationFeedback.com',
      'learnerFeedback');
    await users.createAndLoginAdminUser(
      'user7@ExplorationFeedback.com',
      'superUserExplorationFeedback');
  });

  it('should add feedback to an exploration', async function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    await users.login('user1@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user2@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_1);
    await libraryPage.playExploration(EXPLORATION_TITLE_1);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user1@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.sendResponseToLatestFeedback(
      feedbackResponse);
    await users.logout();
  });

  it('should change status of feedback thread', async function() {
    var feedback = 'Hey! This exploration looks awesome';
    var feedbackResponse = 'Thanks for the feedback!';

    // Creator creates and publishes an exploration.
    await users.login('user3@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user4@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_2);
    await libraryPage.playExploration(EXPLORATION_TITLE_2);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user3@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');
    await explorationEditorFeedbackTab.changeFeedbackStatus(
      'Fixed', feedbackResponse);
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    await browser.refresh();
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Fixed');
    await explorationEditorFeedbackTab.changeFeedbackStatus(
      'Open', feedbackResponse);
    await explorationEditorFeedbackTab.expectFeedbackStatusNameToBe('Open');

    await users.logout();
  });

  it('should send message to feedback thread', async function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    await users.login('user5@ExplorationFeedback.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE_3,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(0);
    await users.logout();

    // Learner plays the exploration and submits a feedback.
    await users.login('user6@ExplorationFeedback.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE_3);
    await libraryPage.playExploration(EXPLORATION_TITLE_3);
    await explorationPlayerPage.submitFeedback(feedback);
    await users.logout();

    // Creator reads the feedback and responds.
    await users.login('user5@ExplorationFeedback.com');
    await creatorDashboardPage.get();
    expect(
      await creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    await creatorDashboardPage.navigateToExplorationEditor();

    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.expectToHaveFeedbackThread();
    var messages = await explorationEditorFeedbackTab.readFeedbackMessages();
    expect(messages.length).toEqual(1);
    expect(messages[0]).toEqual(feedback);
    await explorationEditorPage.navigateToFeedbackTab();
    await explorationEditorFeedbackTab.sendResponseToLatestFeedback(
      feedbackResponse);
    messages = (
      await explorationEditorFeedbackTab.readFeedbackMessagesFromThread());
    expect(messages.length).toEqual(2);
    expect(await messages[0].getText()).toEqual(feedback);
    expect(await messages[1].getText()).toEqual(feedbackResponse);
    await browser.refresh();
    await explorationEditorFeedbackTab.selectLatestFeedbackThread();
    messages = (
      await explorationEditorFeedbackTab.readFeedbackMessagesFromThread());
    expect(messages.length).toEqual(2);
    expect(await messages[0].getText()).toEqual(feedback);
    expect(await messages[1].getText()).toEqual(feedbackResponse);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
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

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();

    await users.createUser(
      'user1@ExplorationSuggestions.com',
      'authorExplorationSuggestions');
    await users.createUser(
      'user2@ExplorationSuggestions.com',
      'suggesterExpSuggestions');
    await users.createUser(
      'user3@ExplorationSuggestions.com',
      'studentExplorationSuggestions');
    await users.createAndLoginAdminUser(
      'user4@ExplorationSuggestions.com',
      'configExplorationSuggestions');
  });

  it('accepts & rejects a suggestion on a published exploration',
    async function() {
      await users.login('user1@ExplorationSuggestions.com');
      await workflow.createAndPublishExploration(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE);
      await users.logout();

      // Suggester plays the exploration and suggests a change.
      await users.login('user2@ExplorationSuggestions.com');
      await libraryPage.get();
      await libraryPage.findExploration(EXPLORATION_TITLE);
      await libraryPage.playExploration(EXPLORATION_TITLE);

      var suggestion1 = 'New Exploration';
      var suggestionDescription1 = 'Uppercased the first letter';
      var suggestion2 = 'New exploration';
      var suggestionDescription2 = 'Changed';

      await explorationPlayerPage.submitSuggestion(
        suggestion1, suggestionDescription1);
      await explorationPlayerPage.clickOnCloseSuggestionModalButton();
      await explorationPlayerPage.submitSuggestion(
        suggestion2, suggestionDescription2);
      await users.logout();

      // Exploration author reviews the suggestion and accepts it.
      await users.login('user1@ExplorationSuggestions.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.navigateToExplorationEditor();

      await explorationEditorPage.navigateToFeedbackTab();
      var threads = await explorationEditorFeedbackTab.getSuggestionThreads();
      expect(threads.length).toEqual(2);
      expect(threads[0]).toMatch(suggestionDescription2);
      await explorationEditorFeedbackTab.acceptSuggestion(
        suggestionDescription1);
      await explorationEditorFeedbackTab.goBackToAllFeedbacks();
      await explorationEditorFeedbackTab.rejectSuggestion(
        suggestionDescription2);

      await explorationEditorPage.navigateToPreviewTab();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText(suggestion1));
      await users.logout();

      // Student logs in and plays the exploration, finds the updated content.
      await users.login('user3@ExplorationSuggestions.com');
      await libraryPage.get();
      await libraryPage.findExploration(EXPLORATION_TITLE);
      await libraryPage.playExploration(EXPLORATION_TITLE);
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText(suggestion1));
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
