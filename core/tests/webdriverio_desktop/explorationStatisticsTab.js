// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var forms = require('../webdriverio_utils/forms.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Statistics tab', function () {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;

  beforeEach(function () {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  it('should check statistics tab for an exploration', async function () {
    var EXPLORATION_TITLE = 'Exploration for stats testing';
    var EXPLORATION_OBJECTIVE = 'To explore something';
    var EXPLORATION_CATEGORY = 'Algorithms';
    var EXPLORATION_LANGUAGE = 'English';
    await users.createUser('user1@statisticsTab.com', 'statisticsTabCreator');
    await users.createUser('user2@statisticsTab.com', 'statisticsTabLearner1');
    await users.createUser('user3@statisticsTab.com', 'statisticsTabLearner2');
    var libraryPage = new LibraryPage.LibraryPage();
    var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var explorationPlayerPage =
      new ExplorationPlayerPage.ExplorationPlayerPage();
    var explorationStatsTab = explorationEditorPage.getStatsTab();

    // Creator creates and publishes an exploration.
    await users.login('user1@statisticsTab.com');
    await workflow.createExploration(true);

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    await explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    await explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    await explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('One');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 1 in words.'),
      true
    );
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText('Good job'),
      'Two',
      true,
      'Equals',
      ['One']
    );
    var responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));

    await explorationEditorMainTab.moveToState('Two');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 2 in words.'),
      true
    );
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText('Good job'),
      'Three',
      true,
      'Equals',
      ['Two']
    );
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('Try again'));
    await explorationEditorMainTab.addHint('The number 2 in words.');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2',
    });
    await explorationEditorMainTab.moveToState('Three');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Please write 3 in words.'),
      true
    );
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText('Good job'),
      'End',
      true,
      'Equals',
      ['Three']
    );
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
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
