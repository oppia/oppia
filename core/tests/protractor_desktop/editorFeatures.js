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
 * @fileoverview End-to-end tests for feedback on explorations
 * Tests the following sequence:
 * User 1 creates and publishes an exploration.
 * User 2 plays the exploration and leaves feedback on it
 * User 1 reads the feedback and responds to it.
 * Note: In production, after this sequence of events, the only notification
 * User 2 will receive is via email, and we can't easily test this
 * in an e2e test.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var AdminPage =
  require('../protractor_utils/AdminPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Exploration history', function() {
  var explorationEditorPage = null;
  var explorationPlayerPage = null;
  var explorationEditorHistoryTab = null;
  var explorationEditorMainTab = null;
  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorHistoryTab = explorationEditorPage.getHistoryTab();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display the history', function() {
    users.createUser('user@historyTab.com', 'userHistoryTab');
    users.login('user@historyTab.com');
    workflow.createExploration();

    // Constants for colors of nodes in history graph.
    var COLOR_ADDED = 'rgb(78, 162, 78)';
    var COLOR_DELETED = 'rgb(220, 20, 60)';
    var COLOR_CHANGED = 'rgb(30, 144, 255)';
    var COLOR_UNCHANGED = 'rgb(245, 245, 220)';
    var COLOR_RENAMED_UNCHANGED = 'rgb(255, 215, 0)';

    // Check renaming state, editing text, editing interactions and adding
    // state.
    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'enter 6 to continue'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    explorationEditorMainTab.moveToState('second');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 2'));
    explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.moveToState('first');
    explorationEditorPage.saveChanges();

    var VERSION_1_STATE_1_CONTENTS = {
      1: {
        text: 'classifier_model_id: null',
        highlighted: false
      },
      2: {
        text: 'content:',
        highlighted: false
      },
      3: {
        text: '  content_id: content',
        highlighted: false
      },
      4: {
        text: '  html: <p>enter 6 to continue</p>',
        highlighted: true
      },
      5: {
        text: 'content_ids_to_audio_translations:',
        highlighted: false
      },
      6: {
        text: '  content: {}',
        highlighted: false
      },
      7: {
        text: '  default_outcome: {}',
        highlighted: false
      },
      8: {
        text: '  feedback_1: {}',
        highlighted: true
      },
      9: {
        text: 'interaction:',
        highlighted: false
      },
      10: {
        text: '  answer_groups:',
        highlighted: true
      },
      11: {
        text: '  - outcome:',
        highlighted: true
      },
      12: {
        text: '      dest: second',
        highlighted: true
      },
      13: {
        text: '      feedback:',
        highlighted: true
      },
      14: {
        text: '        content_id: feedback_1',
        highlighted: true
      },
      15: {
        text: '        html: \'\'',
        highlighted: true
      },
      16: {
        text: '      labelled_as_correct: false',
        highlighted: true
      },
      17: {
        text: '      missing_prerequisite_skill_id: null',
        highlighted: true
      },
      18: {
        text: '      param_changes: []',
        highlighted: true
      },
      19: {
        text: '      refresher_exploration_id: null',
        highlighted: true
      },
      20: {
        text: '    rule_specs:',
        highlighted: true
      },
      21: {
        text: '    - inputs:',
        highlighted: true
      },
      22: {
        text: '        x: 6',
        highlighted: true
      },
      23: {
        text: '      rule_type: Equals',
        highlighted: true
      },
      24: {
        text: '    tagged_misconception_id: null',
        highlighted: true
      },
      25: {
        text: '    training_data: []',
        highlighted: true
      },
      26: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      27: {
        text: '  customization_args: {}',
        highlighted: false
      },
      28: {
        text: '  default_outcome:',
        highlighted: false
      },
      29: {
        text: '    dest: first',
        highlighted: true
      },
      30: {
        text: '    feedback:',
        highlighted: false
      },
      31: {
        text: '      content_id: default_outcome',
        highlighted: false
      },
      32: {
        text: '      html: \'\'',
        highlighted: false
      },
      33: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      34: {
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      35: {
        text: '    param_changes: []',
        highlighted: false
      },
      36: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      37: {
        text: '  hints: []',
        highlighted: false
      },
      38: {
        text: '  id: NumericInput',
        highlighted: true
      },
      39: {
        text: '  solution: null',
        highlighted: false
      },
      40: {
        text: 'param_changes: []',
        highlighted: false
      },
      41: {
        text: ' ',
        highlighted: false
      }
    };

    var VERSION_2_STATE_1_CONTENTS = {
      1: {
        text: 'classifier_model_id: null',
        highlighted: false
      },
      2: {
        text: 'content:',
        highlighted: false
      },
      3: {
        text: '  content_id: content',
        highlighted: false
      },
      4: {
        text: '  html: \'\'',
        highlighted: true
      },
      5: {
        text: 'content_ids_to_audio_translations:',
        highlighted: false
      },
      6: {
        text: '  content: {}',
        highlighted: false
      },
      7: {
        text: '  default_outcome: {}',
        highlighted: true
      },
      8: {
        text: 'interaction:',
        highlighted: false
      },
      9: {
        text: '  answer_groups: []',
        highlighted: true
      },
      10: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      11: {
        text: '  customization_args: {}',
        highlighted: false
      },
      12: {
        text: '  default_outcome:',
        highlighted: false
      },
      // Note that highlighting *underneath* a line is still considered a
      // highlight.
      13: {
        text: '    dest: ' + general.FIRST_STATE_DEFAULT_NAME,
        highlighted: true
      },
      14: {
        text: '    feedback:',
        highlighted: false
      },
      15: {
        text: '      content_id: default_outcome',
        highlighted: false
      },
      16: {
        text: '      html: \'\'',
        highlighted: false
      },
      17: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      18: {
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      19: {
        text: '    param_changes: []',
        highlighted: false
      },
      20: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      21: {
        text: '  hints: []',
        highlighted: false
      },
      22: {
        text: '  id: null',
        highlighted: true
      },
      23: {
        text: '  solution: null',
        highlighted: false
      },
      24: {
        text: 'param_changes: []',
        highlighted: false
      },
      25: {
        text: ' ',
        highlighted: false
      }
    };

    var STATE_2_STRING =
      'classifier_model_id: null\n' +
      'content:\n' +
      '  content_id: content\n' +
      '  html: <p>this is card 2</p>\n' +
      'content_ids_to_audio_translations:\n' +
      '  content: {}\n' +
      '  default_outcome: {}\n' +
      'interaction:\n' +
      '  answer_groups: []\n' +
      '  confirmed_unclassified_answers: []\n' +
      '  customization_args:\n' +
      '    buttonText:\n' +
      '      value: Continue\n' +
      '  default_outcome:\n' +
      '    dest: final card\n' +
      '    feedback:\n' +
      '      content_id: default_outcome\n' +
      '      html: \'\'\n' +
      '    labelled_as_correct: false\n' +
      '    missing_prerequisite_skill_id: null\n' +
      '    param_changes: []\n' +
      '    refresher_exploration_id: null\n' +
      '  hints: []\n' +
      '  id: Continue\n' +
      '  solution: null\n' +
      'param_changes: []\n' +
      ' ';

    var expectedHistoryStates = [{
      label: 'first (was: Introd...',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_ADDED
    }, {
      label: 'final card',
      color: COLOR_ADDED
    }];
    explorationEditorPage.navigateToHistoryTab();
    var historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    historyGraph.selectTwoVersions(1, 2);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(2, 2, 0);
    historyGraph.openStateHistory('first (was: Introd...');
    historyGraph.expectTextWithHighlightingToMatch(
      VERSION_1_STATE_1_CONTENTS, VERSION_2_STATE_1_CONTENTS);
    historyGraph.closeStateHistory();

    historyGraph.openStateHistory('second');
    historyGraph.expectTextToMatch(STATE_2_STRING, ' ');
    historyGraph.closeStateHistory();

    // Reset all checkboxes.
    // Switching the 2 compared versions should give the same result.
    historyGraph.deselectTwoVersions(1, 2);
    historyGraph.selectTwoVersions(2, 1);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(2, 2, 0);

    // Check deleting a state.
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.deleteState('second');
    explorationEditorMainTab.moveToState('first');
    explorationEditorMainTab.getResponseEditor(0).
      setDestination('final card', false, null);
    explorationEditorPage.saveChanges();

    expectedHistoryStates = [{
      label: 'first',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_DELETED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    explorationEditorPage.navigateToHistoryTab();
    historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    historyGraph.selectTwoVersions(2, 3);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(3, 1, 2);

    historyGraph.openStateHistory('second');
    historyGraph.expectTextToMatch(' ', STATE_2_STRING);
    historyGraph.closeStateHistory();

    // Check renaming a state.
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.moveToState('first');
    explorationEditorMainTab.setStateName('third');
    explorationEditorPage.saveChanges();
    expectedHistoryStates = [{
      label: 'third (was: first)',
      color: COLOR_RENAMED_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    explorationEditorPage.navigateToHistoryTab();
    historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    historyGraph.selectTwoVersions(3, 4);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(1, 0, 0);

    // Check re-inserting a deleted state.
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.moveToState('third');
    explorationEditorMainTab.getResponseEditor(0).
      setDestination('second', true, null);
    explorationEditorMainTab.moveToState('second');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 2'));
    explorationEditorMainTab.setInteraction('Continue');

    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', false, null);
    explorationEditorPage.saveChanges();

    expectedHistoryStates = [{
      label: 'third (was: first)',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    explorationEditorPage.navigateToHistoryTab();
    historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    historyGraph.selectTwoVersions(2, 5);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(2, 0, 0);

    // Check that reverting works.
    explorationEditorHistoryTab.revertToVersion(2);
    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('enter 6 to continue'));
    explorationPlayerPage.submitAnswer('NumericInput', 6);
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('this is card 2'));
    explorationPlayerPage.expectInteractionToMatch('Continue', 'CONTINUE');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.expectExplorationToBeOver();

    general.moveToEditor();
    expectedHistoryStates = [{
      label: 'first (was: third)',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_ADDED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    explorationEditorPage.navigateToHistoryTab();
    historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    historyGraph.selectTwoVersions(4, 6);
    historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    historyGraph.expectNumberOfLinksToMatch(3, 2, 1);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('ExplorationFeedback', function() {
  var EXPLORATION_TITLE = 'Exploration with Feedback';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var explorationEditorPage = null;
  var explorationEditorFeedbackTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  beforeEach(function() {
    users.createUser(
      'user1@ExplorationFeedback.com',
      'creatorExplorationFeedback');
    users.createUser(
      'user2@ExplorationFeedback.com',
      'learnerExplorationFeedback');
  });

  it('adds feedback to an exploration', function() {
    var feedback = 'A good exploration. Would love to see a few more questions';
    var feedbackResponse = 'Thanks for the feedback';

    // Creator creates and publishes an exploration.
    users.login('user1@ExplorationFeedback.com');
    workflow.createAndPublishExploration(
      EXPLORATION_TITLE,
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
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
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

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Issues visualization', function() {
  var EXPLORATION_TITLE = 'Welcome to Oppia!';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorStatsTab = null;
  var explorationPlayerPage = null;
  var adminPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorStatsTab = explorationEditorPage.getStatsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
    adminPage = new AdminPage.AdminPage();
  });

  beforeEach(function() {
    users.createAndLoginAdminUser(
      'user1@ExplorationIssues.com',
      'authorExplorationIssues');
    adminPage.reloadExploration('welcome.yaml');
    adminPage.editConfigProperty(
      'The set of exploration IDs for recording issues and playthroughs',
      'List',
      function(elem) {
        elem.addItem('Unicode').setValue('0');
      });
    adminPage.editConfigProperty(
      'The probability of recording playthroughs', 'Real',
      function(elem) {
        elem.setValue(1.0);
      });
  });

  it('records early quit issue.', function() {
    users.createAndLoginUser(
      'user2@ExplorationIssues.com',
      'learnerExplorationIssues');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput',
      'It\'s translated from a different language.');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToNotBeOver();

    oppiaLogo.click();
    general.acceptAlert();
    users.logout();

    users.login('user1@ExplorationIssues.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    general.moveToEditor();
    explorationEditorPage.navigateToStatsTab();

    explorationEditorStatsTab.clickInitIssue();
  });
});


describe('Suggestions on Explorations', function() {
  var EXPLORATION_TITLE = 'Exploration with Suggestion';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_OBJECTIVE = 'To explore something new';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorFeedbackTab = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorFeedbackTab = explorationEditorPage.getFeedbackTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    libraryPage = new LibraryPage.LibraryPage();
  });

  beforeEach(function() {
    users.createUser(
      'user1@ExplorationSuggestions.com',
      'authorExplorationSuggestions');
    users.createUser(
      'user2@ExplorationSuggestions.com',
      'suggesterExplorationSuggestions');
    users.createUser(
      'user3@ExplorationSuggestions.com',
      'studentExplorationSuggestions');
  });

  it('accepts a suggestion on a published exploration', function() {
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

    var suggestion = 'New Exploration';
    var suggestionDescription = 'Uppercased the first letter';

    explorationPlayerPage.submitSuggestion(suggestion, suggestionDescription);
    users.logout();

    // Exploration author reviews the suggestion and accepts it.
    users.login('user1@ExplorationSuggestions.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();

    explorationEditorPage.navigateToFeedbackTab();
    explorationEditorFeedbackTab.getSuggestionThreads().then(function(threads) {
      expect(threads.length).toEqual(1);
      expect(threads[0]).toMatch(suggestionDescription);
    });
    explorationEditorFeedbackTab.acceptSuggestion(suggestionDescription);

    explorationEditorPage.navigateToPreviewTab();
    explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
    users.logout();

    // Student logs in and plays the exploration, finds the updated content.
    users.login('user3@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
