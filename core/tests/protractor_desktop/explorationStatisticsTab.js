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

  it('checks statistics tab for an exploration', function() {
    var EXPLORATION_TITLE = 'Exploration for stats testing';
    var EXPLORATION_OBJECTIVE = 'To explore something';
    var EXPLORATION_CATEGORY = 'Algorithms';
    var EXPLORATION_LANGUAGE = 'English';
    users.createUser(
      'user1@statisticsTab.com', 'statisticsTabCreator');
    users.createUser(
      'user2@statisticsTab.com', 'statisticsTabLearner1');
    users.createUser(
      'user3@statisticsTab.com', 'statisticsTabLearner2');
    var libraryPage = new LibraryPage.LibraryPage();
    var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var explorationPlayerPage =
      new ExplorationPlayerPage.ExplorationPlayerPage();
    var explorationStatsTab = explorationEditorPage.getStatsTab();

    // Creator creates and publishes an exploration.
    users.login('user1@statisticsTab.com');
    workflow.createExploration();

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
      'TextInput', forms.toRichText('Good job'), 'Two', true, 'Equals',
      'One');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));

    explorationEditorMainTab.moveToState('Two');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 2 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Three', true, 'Equals',
      'Two');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));
    explorationEditorMainTab.addHint('The number 2 in words.');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2'
    });
    explorationEditorMainTab.moveToState('Three');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 3 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Three');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));

    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    users.logout();

    // Learner 1 completes the exploration.
    users.login('user2@statisticsTab.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.submitAnswer('TextInput', '2');
    explorationPlayerPage.viewHint();
    explorationPlayerPage.submitAnswer('TextInput', '3');
    explorationPlayerPage.viewSolution();
    explorationPlayerPage.submitAnswer('TextInput', 'Two');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('TextInput', 'Three');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();

    // Learner 2 starts the exploration and immediately quits it.
    users.login('user3@statisticsTab.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.expectExplorationToNotBeOver();

    users.logout();

    // Creator visits the statistics tab.
    users.login('user1@statisticsTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToStatsTab();

    // Now, there should be one passerby for this exploration since only learner
    // 3 quit at the first state.
    explorationStatsTab.expectNumPassersbyToBe('1');

    users.logout();
  });
});
