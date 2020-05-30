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
 * @fileoverview End-to-end tests for the functionality of the statistics tabs
 * in the exploration editor.
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


describe('Issues visualization', function() {
  var EXPLORATION_TITLE = 'Welcome to Oppia!';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorStatsTab = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var adminPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));

  beforeAll(async function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorStatsTab = explorationEditorPage.getStatsTab();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    adminPage = new AdminPage.AdminPage();

    await users.createUser(
      'user2@ExplorationIssues.com',
      'learnerExplorationIssues');
    await users.createAndLoginAdminUser(
      'user1@ExplorationIssues.com',
      'authorExplorationIssues');

    await workflow.createExplorationAsAdmin();
    await explorationEditorMainTab.exitTutorial();

    var url = await browser.getCurrentUrl();
    var expId = url.split('/')[4].slice(0, -1);

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    await explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    await explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    await explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('One');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 1 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'Two',
      true, 'Equals', 'One');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('Two');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 2 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'Three',
      true, 'Equals', 'Two');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('Three');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 3 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'End',
      true, 'Equals', 'Three');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Try 2 again'), 'Two',
      false, 'Equals', 'Two');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();

    await adminPage.editConfigProperty(
      'The set of exploration IDs for recording playthrough issues',
      'List',
      async function(elem) {
        elem = await elem.addItem('Unicode');
        await elem.setValue(expId);
      });
    await adminPage.editConfigProperty(
      'The probability of recording playthroughs', 'Real',
      async function(elem) {
        await elem.setValue(1.0);
      });
  });

  it('records early quit issue.', async function() {
    await users.login('user2@ExplorationIssues.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);

    await explorationPlayerPage.submitAnswer('TextInput', 'One');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToNotBeOver();

    await oppiaLogo.click();
    await general.acceptAlert();
    await users.logout();

    await users.login('user1@ExplorationIssues.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);
    await general.moveToEditor();
    await explorationEditorPage.navigateToStatsTab();

    await explorationEditorStatsTab.clickIssue(0, 'Issue 1');
    await explorationEditorStatsTab.expectIssueTitleToBe(
      'Several learners exited the exploration in less than a minute.');
    await explorationEditorStatsTab.markResolved();
    await users.logout();
  });

  it('records multiple incorrect issue.', async function() {
    await users.login('user2@ExplorationIssues.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);

    await explorationPlayerPage.submitAnswer('TextInput', 'WrongAnswer1');
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('Try again'));
    await explorationPlayerPage.submitAnswer('TextInput', 'WrongAnswer2');
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('Try again'));
    await explorationPlayerPage.submitAnswer('TextInput', 'WrongAnswer3');
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('Try again'));
    await explorationPlayerPage.expectExplorationToNotBeOver();

    await oppiaLogo.click();
    await general.acceptAlert();
    await users.logout();

    await users.login('user1@ExplorationIssues.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration(EXPLORATION_TITLE);
    await explorationEditorPage.navigateToStatsTab();
    await explorationEditorStatsTab.clickIssue(0, 'Issue 1');
    await explorationEditorStatsTab.expectIssueTitleToBe(
      'Several learners submitted answers to card "One" several times, ' +
      'then gave up and quit.');
    await explorationEditorStatsTab.markResolved();
    await users.logout();
  });

  it('records cyclic transitions issue.', async function() {
    await users.login('user2@ExplorationIssues.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);

    await explorationPlayerPage.submitAnswer('TextInput', 'One');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 2 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 3 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 2 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 3 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 2 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Please write 3 in words.'));
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToNotBeOver();

    await oppiaLogo.click();
    await general.acceptAlert();
    await users.logout();

    await users.login('user1@ExplorationIssues.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);
    await general.moveToEditor();
    await explorationEditorPage.navigateToStatsTab();

    await explorationEditorStatsTab.clickIssue(0, 'Issue 1');
    await explorationEditorStatsTab.expectIssueTitleToBe(
      'Several learners ended up in a cyclic loop revisiting card ' +
      '"Two" many times.');
    await explorationEditorStatsTab.markResolved();
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Statistics tab', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('checks statistics tab for an exploration', async function() {
    var EXPLORATION_TITLE = 'Exploration for stats testing';
    var EXPLORATION_OBJECTIVE = 'To explore something';
    var EXPLORATION_CATEGORY = 'Algorithms';
    var EXPLORATION_LANGUAGE = 'English';
    await users.createUser(
      'user1@statisticsTab.com', 'statisticsTabCreator');
    await users.createUser(
      'user2@statisticsTab.com', 'statisticsTabLearner1');
    await users.createUser(
      'user3@statisticsTab.com', 'statisticsTabLearner2');
    var libraryPage = new LibraryPage.LibraryPage();
    var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    var explorationStatsTab = explorationEditorPage.getStatsTab();

    // Creator creates and publishes an exploration.
    await users.login('user1@statisticsTab.com');
    await workflow.createExploration();

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    await explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    await explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    await explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('One');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 1 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'Two', true, 'Equals',
      'One');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('Two');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 2 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'Three', true, 'Equals',
      'Two');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));
    await explorationEditorMainTab.addHint('The number 2 in words.');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2'
    });
    await explorationEditorMainTab.moveToState('Three');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 3 in words.'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'), 'End', true, 'Equals',
      'Three');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();

    await users.logout();

    // Learner 1 completes the exploration.
    await users.login('user2@statisticsTab.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);

    await explorationPlayerPage.submitAnswer('TextInput', 'One');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.submitAnswer('TextInput', '2');
    await explorationPlayerPage.viewHint();
    await explorationPlayerPage.submitAnswer('TextInput', '3');
    await explorationPlayerPage.viewSolution();
    await explorationPlayerPage.submitAnswer('TextInput', 'Two');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.submitAnswer('TextInput', 'Three');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();

    await users.logout();

    // Learner 2 starts the exploration and immediately quits it.
    await users.login('user3@statisticsTab.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_TITLE);
    await libraryPage.playExploration(EXPLORATION_TITLE);

    await explorationPlayerPage.expectExplorationToNotBeOver();

    await users.logout();

    // Creator visits the statistics tab.
    await users.login('user1@statisticsTab.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.navigateToExplorationEditor();
    await explorationEditorPage.navigateToStatsTab();

    // Now, there should be one passerby for this exploration since only learner
    // 3 quit at the first state.
    await explorationStatsTab.expectNumPassersbyToBe('1');

    await users.logout();
  });
});
