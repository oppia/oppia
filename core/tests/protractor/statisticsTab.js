// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for hints/solutions on explorations.
 * Tests the following sequence:
 * User 1 creates and publishes an exploration.
 * User 2 plays the exploration and completes it.
 * User 3 plays the exploration and quits immediately.
 * User 1 visits the statistics tab for the exploration.
 * User 1 views the statistics for the learners using the exploration.
 */

var CreatorDashboardPage =
 require('../protractor_utils/CreatorDashboardPage.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('StatisticsTab', function() {
  var EXPLORATION_TITLE = 'Exploration for stats testing';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;
  beforeEach(function() {
    users.createUser(
      'user1@statisticsTab.com', 'statisticsTabCreator');
    users.createUser(
      'user2@statisticsTab.com', 'statisticsTabLearner1');
    users.createUser(
      'user3@statisticsTab.com', 'statisticsTabLearner2');
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('checks statistics tab for an exploration', function() {
    // Creator creates and publishes an exploration
    users.login('user1@statisticsTab.com');
    workflow.createExploration();

    editor.setTitle(EXPLORATION_TITLE);
    editor.setCategory(EXPLORATION_CATEGORY);
    editor.setObjective(EXPLORATION_OBJECTIVE);
    if (EXPLORATION_LANGUAGE) {
      editor.setLanguage(EXPLORATION_LANGUAGE);
    }

    editor.setStateName('One');
    editor.setContent(forms.toRichText('Please write 1 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Two', true, 'Equals',
      'One');
    editor.setDefaultOutcome(forms.toRichText('Try again'));

    editor.moveToState('Two');
    editor.setContent(forms.toRichText('Please write 2 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Three', true, 'Equals',
      'Two');
    editor.setDefaultOutcome(forms.toRichText('Try again'));
    editor.addHint('The number 2 in words.');
    editor.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2'
    });
    editor.moveToState('Three');
    editor.setContent(forms.toRichText('Please write 3 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Three');
    editor.setDefaultOutcome(forms.toRichText('Try again'));

    editor.moveToState('End');
    editor.setInteraction('EndExploration');
    editor.saveChanges();
    workflow.publishExploration();

    users.logout();

    // Learner 1 completes the exploration.
    users.login('user2@statisticsTab.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.submitAnswer('TextInput', '2');
    explorationPlayerPage.viewHint();
    explorationPlayerPage.clickGotItButton();
    explorationPlayerPage.submitAnswer('TextInput', '3');
    explorationPlayerPage.viewSolution();
    explorationPlayerPage.clickGotItButton();
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
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.expectExplorationToNotBeOver();

    users.logout();

    // Creator visits the statistics tab.
    users.login('user1@statisticsTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    editor.navigateToStatsTab();

    // Now, there should be one passerby for this exploration since only learner
    // 3 quit at the first state.
    editor.expectNumPassersbyToBe('1');

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      'TypeError: google.visualization.PieChart is not a constructor'
    ]);
  });
});
