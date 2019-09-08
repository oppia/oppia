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
 * @fileoverview End-to-end tests for the core features of the exploration
 * editor and player. Core features include the features without which an
 * exploration cannot be published. These include state content, answer groups,
 * oppia's feedback and customization_args.
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


describe('Answer Details Improvements', function() {
  var EXPLORATION_TITLE = 'Check';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var adminPage = null;
  var libraryPage = null;
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var improvementsTab = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationPlayerPage =
      new ExplorationPlayerPage.ExplorationPlayerPage();

    improvementsTab = explorationEditorPage.getImprovementsTab();

    users.createUser(
      'learner@user.com', 'learnerUser');
    users.createAndLoginAdminUser(
      'creator@user.com', 'creatorUser');

    adminPage.editConfigProperty(
      'Always ask learners for answer details. For testing -- do not use',
      'Boolean', (element) => element.setValue(true));
    // TODO(#7569): Remove redundant set after feedback tab is phased out.
    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean', (element) => element.setValue(true));

    // Creator creates and publishes an exploration.
    workflow.createExplorationAsAdmin();
    explorationEditorMainTab.exitTutorial();

    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setStateName('One');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 1 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'One');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));
    explorationEditorMainTab.setSolicitAnswerDetailsFeature();
    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
  });

  it('checks solicit answer details feature', function() {
    users.login('learner@user.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.submitAnswerDetails('I liked this choice of answer');
    explorationPlayerPage.expectExplorationToNotBeOver();

    oppiaLogo.click();
    general.acceptAlert();
    users.logout();
    users.login('creator@user.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToImprovementsTab();

    var card = improvementsTab.getAnswerDetailsCard('One');
    improvementsTab.clickCardActionButton(card, 'Review Answer Details');
    improvementsTab.verifyAnswerDetails('I liked this choi...', 1);
    improvementsTab.closeModal();
    users.logout();
  });

  afterAll(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Feedback Improvements', function() {
  var EXPLORATION_TITLE_1 = 'Exploration with Feedback';
  var EXPLORATION_TITLE_2 = 'Exploration for testing feedback status';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var adminPage = null;
  var explorationEditorPage = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  var improvementsTab = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    improvementsTab = explorationEditorPage.getImprovementsTab();

    users.createAndLoginAdminUser(
      'superUser@ExplorationFeedback.com',
      'superUserExplorationFeedback');
    // TODO(#7569): Remove redundant set after feedback tab is phased out.
    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor.',
      'Boolean', (element) => element.setValue(true));
  });

  it('should add feedback to an exploration', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    users.createUser(
      'creator@ExplorationFeedback.com',
      'creatorExplorationFeedback');
    users.createUser(
      'learner@ExplorationFeedback.com',
      'learnerExplorationFeedback');

    // Creator creates and publishes an exploration.
    users.login('creator@ExplorationFeedback.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_1,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    users.logout();

    // Learner plays the exploration and submits a feedback.
    users.login('learner@ExplorationFeedback.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_1);
    libraryPage.playExploration(EXPLORATION_TITLE_1);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds.
    users.login('creator@ExplorationFeedback.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToImprovementsTab();
    var card = improvementsTab.getFeedbackCard(feedback);
    improvementsTab.clickCardActionButton(card, 'Review Thread');
    expect(improvementsTab.getThreadMessages()).toEqual([feedback]);
    improvementsTab.sendResponseAndCloseModal(feedbackResponse);

    card = improvementsTab.getFeedbackCard(feedbackResponse);
    improvementsTab.clickCardActionButton(card, 'Review Thread');
    expect(improvementsTab.getThreadMessages()).toEqual(
      [feedback, feedbackResponse]);
    improvementsTab.closeModal();

    users.logout();
  });

  it('should change status of feedback thread', function() {
    var feedback = 'Hey! This exploration looks awesome';
    var feedbackResponse = 'Thanks for the feedback!';

    users.createUser(
      'creator@ExplorationFeedbackStatusChange.com',
      'creatorExplorationFeedbackStatusChange');
    users.createUser(
      'learner@ExplorationFeedbackStatusChange.com',
      'learnerExplorationFeedbackStatusChange');

    // Creator creates and publishes an exploration.
    users.login('creator@ExplorationFeedbackStatusChange.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE_2,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_LANGUAGE);
    creatorDashboardPage.get();
    users.logout();

    // Learner plays the exploration and submits a feedback.
    users.login('learner@ExplorationFeedbackStatusChange.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE_2);
    libraryPage.playExploration(EXPLORATION_TITLE_2);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds.
    users.login('creator@ExplorationFeedbackStatusChange.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToImprovementsTab();

    // Mark thread as fixed.
    var card = improvementsTab.getFeedbackCard(feedback);
    expect(improvementsTab.getCardStatus(card)).toEqual('Open');
    improvementsTab.clickCardActionButton(card, 'Review Thread');
    improvementsTab.sendResponseAndCloseModal(feedbackResponse, 'Fixed');

    improvementsTab.setShowOnlyOpenTasks(false);
    card = improvementsTab.getFeedbackCard(feedbackResponse);
    expect(improvementsTab.getCardStatus(card)).toEqual('Fixed');

    browser.driver.navigate().refresh();

    // Re-open the thread.
    improvementsTab.setShowOnlyOpenTasks(false);
    card = improvementsTab.getFeedbackCard(feedbackResponse);
    expect(improvementsTab.getCardStatus(card)).toEqual('Fixed');
    improvementsTab.clickCardActionButton(card, 'Review Thread');
    improvementsTab.sendResponseAndCloseModal(feedbackResponse, 'Open');
    improvementsTab.setShowOnlyOpenTasks(true);
    expect(improvementsTab.getCardStatus(card)).toEqual('Open');

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
  var explorationPlayerPage = null;

  var improvementsTab = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();

    improvementsTab = explorationEditorPage.getImprovementsTab();

    users.createUser(
      'user1@ExplorationSuggestions.com',
      'authorExplorationSuggestions');
    users.createUser(
      'user2@ExplorationSuggestions.com',
      'suggesterExplorationSuggestions');
    users.createUser(
      'user3@ExplorationSuggestions.com',
      'studentExplorationSuggestions');
    users.createAndLoginAdminUser(
      'user4@ExplorationSuggestions.com',
      'configExplorationSuggestions');
    // TODO(#7569): Remove redundant set after feedback tab is phased out.
    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor.',
      'Boolean', (element) => element.setValue(true));
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
    explorationEditorPage.navigateToImprovementsTab();

    var cardToAccept = improvementsTab.getSuggestionCard(
      suggestionDescription1);
    improvementsTab.clickCardActionButton(cardToAccept, 'Review Thread');
    expect(improvementsTab.getThreadMessages()).toEqual(
      [suggestionDescription1]);
    improvementsTab.acceptSuggestion();
    improvementsTab.closeModal();

    var cardToReject = improvementsTab.getSuggestionCard(
      suggestionDescription2);
    improvementsTab.clickCardActionButton(cardToReject, 'Review Thread');
    expect(improvementsTab.getThreadMessages()).toEqual(
      [suggestionDescription2]);
    improvementsTab.rejectSuggestion();
    improvementsTab.closeModal();

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
