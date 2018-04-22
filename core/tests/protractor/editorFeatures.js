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

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Exploration history', function() {
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display the history', function() {
    users.createUser('user@historyTab.com', 'userHistoryTab');
    users.login('user@historyTab.com');
    workflow.createExploration();

    // Constants for colors of nodes in history graph
    var COLOR_ADDED = 'rgb(78, 162, 78)';
    var COLOR_DELETED = 'rgb(220, 20, 60)';
    var COLOR_CHANGED = 'rgb(30, 144, 255)';
    var COLOR_UNCHANGED = 'rgb(245, 245, 220)';
    var COLOR_RENAMED_UNCHANGED = 'rgb(255, 215, 0)';

    // Check renaming state, editing text, editing interactions and adding state
    editor.setStateName('first');
    editor.setContent(forms.toRichText('enter 6 to continue'));
    editor.setInteraction('NumericInput');
    editor.addResponse('NumericInput', null, 'second', true, 'Equals', 6);
    editor.moveToState('second');
    editor.setContent(forms.toRichText('this is card 2'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.moveToState('first');
    editor.saveChanges();

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
        text: '  audio_translations: {}',
        highlighted: false
      },
      4: {
        text: '  html: <p>enter 6 to continue</p>',
        highlighted: true
      },
      5: {
        text: 'interaction:',
        highlighted: false
      },
      6: {
        text: '  answer_groups:',
        highlighted: true
      },
      7: {
        text: '  - outcome:',
        highlighted: true
      },
      8: {
        text: '      dest: second',
        highlighted: true
      },
      9: {
        text: '      feedback:',
        highlighted: true
      },
      10: {
        text: '        audio_translations: {}',
        highlighted: true
      },
      11: {
        text: '        html: \'\'',
        highlighted: true
      },
      12: {
        text: '      labelled_as_correct: false',
        highlighted: true
      },
      13: {
        text: '      param_changes: []',
        highlighted: true
      },
      14: {
        text: '      refresher_exploration_id: null',
        highlighted: true
      },
      15: {
        text: '    rule_specs:',
        highlighted: true
      },
      16: {
        text: '    - inputs:',
        highlighted: true
      },
      17: {
        text: '        x: 6',
        highlighted: true
      },
      18: {
        text: '      rule_type: Equals',
        highlighted: true
      },
      19: {
        text: '      training_data: []',
        highlighted: true
      },
      20: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      21: {
        text: '  customization_args: {}',
        highlighted: false
      },
      22: {
        text: '  default_outcome:',
        highlighted: false
      },
      23: {
        text: '    dest: first',
        highlighted: true
      },
      24: {
        text: '    feedback:',
        highlighted: false
      },
      25: {
        text: '      audio_translations: {}',
        highlighted: false
      },
      26: {
        text: '      html: \'\'',
        highlighted: false
      },
      27: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      28: {
        text: '    param_changes: []',
        highlighted: false
      },
      29: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      30: {
        text: '  hints: []',
        highlighted: false
      },
      31: {
        text: '  id: NumericInput',
        highlighted: true
      },
      32: {
        text: '  solution: null',
        highlighted: false
      },
      33: {
        text: 'param_changes: []',
        highlighted: false
      },
      34: {
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
        text: '  audio_translations: {}',
        highlighted: false
      },
      4: {
        text: '  html: \'\'',
        highlighted: true
      },
      5: {
        text: 'interaction:',
        highlighted: false
      },
      6: {
        text: '  answer_groups: []',
        highlighted: true
      },
      7: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      8: {
        text: '  customization_args: {}',
        highlighted: false
      },
      9: {
        text: '  default_outcome:',
        highlighted: false
      },
      // Note that highlighting *underneath* a line is still considered a
      // highlight.
      10: {
        text: '    dest: ' + general.FIRST_STATE_DEFAULT_NAME,
        highlighted: true
      },
      11: {
        text: '    feedback:',
        highlighted: false
      },
      12: {
        text: '      audio_translations: {}',
        highlighted: false
      },
      13: {
        text: '      html: \'\'',
        highlighted: false
      },
      14: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      15: {
        text: '    param_changes: []',
        highlighted: false
      },
      16: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      17: {
        text: '  hints: []',
        highlighted: false
      },
      18: {
        text: '  id: null',
        highlighted: true
      },
      19: {
        text: '  solution: null',
        highlighted: false
      },
      20: {
        text: 'param_changes: []',
        highlighted: false
      },
      21: {
        text: ' ',
        highlighted: false
      }
    };

    var STATE_2_STRING =
      'classifier_model_id: null\n' +
      'content:\n' +
      '  audio_translations: {}\n' +
      '  html: <p>this is card 2</p>\n' +
      'interaction:\n' +
      '  answer_groups: []\n' +
      '  confirmed_unclassified_answers: []\n' +
      '  customization_args:\n' +
      '    buttonText:\n' +
      '      value: Continue\n' +
      '  default_outcome:\n' +
      '    dest: final card\n' +
      '    feedback:\n' +
      '      audio_translations: {}\n' +
      '      html: \'\'\n' +
      '    labelled_as_correct: false\n' +
      '    param_changes: []\n' +
      '    refresher_exploration_id: null\n' +
      '  hints: []\n' +
      '  id: Continue\n' +
      '  solution: null\n' +
      'param_changes: []\n' +
      ' ';

    editor.expectGraphComparisonOf(1, 2).toBe([{
      label: 'first (was: Introd...',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_ADDED
    }, {
      label: 'final card',
      color: COLOR_ADDED
    }], [2, 2, 0]);
    editor.expectTextComparisonOf(
      1, 2, 'first (was: Introd...'
    ).toBeWithHighlighting(
      VERSION_1_STATE_1_CONTENTS, VERSION_2_STATE_1_CONTENTS);
    editor.expectTextComparisonOf(1, 2, 'second').toBe(STATE_2_STRING, ' ');

    // Switching the 2 compared versions should give the same result.
    editor.expectGraphComparisonOf(2, 1).toBe([{
      label: 'first (was: Introd...',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_ADDED
    }, {
      label: 'final card',
      color: COLOR_ADDED
    }], [2, 2, 0]);

    // Check deleting a state
    editor.deleteState('second');
    editor.moveToState('first');
    editor.ResponseEditor(0).setDestination('final card', false, null);
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 3).toBe([{
      label: 'first',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_DELETED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }], [3, 1, 2]);
    editor.expectTextComparisonOf(2, 3, 'second')
      .toBe(' ', STATE_2_STRING);

    // Check renaming a state
    editor.moveToState('first');
    editor.setStateName('third');
    editor.saveChanges();
    editor.expectGraphComparisonOf(3, 4).toBe([{
      label: 'third (was: first)',
      color: COLOR_RENAMED_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }], [1, 0, 0]);

    // Check re-inserting a deleted state
    editor.moveToState('third');
    editor.ResponseEditor(0).setDestination('second', true, null);
    editor.moveToState('second');
    editor.setContent(forms.toRichText('this is card 2'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'final card', false);
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 5).toBe([{
      label: 'third (was: first)',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }], [2, 0, 0]);

    // Check that reverting works
    editor.revertToVersion(2);
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
    editor.expectGraphComparisonOf(4, 6).toBe([{
      label: 'first (was: third)',
      color: COLOR_CHANGED
    }, {
      label: 'second',
      color: COLOR_ADDED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }], [3, 2, 1]);

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('ExplorationFeedback', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
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

    // Creator creates and publishes an exploration
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

    // Learner plays the exploration and submits a feedback
    users.login('user2@ExplorationFeedback.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.submitFeedback(feedback);
    users.logout();

    // Creator reads the feedback and responds
    users.login('user1@ExplorationFeedback.com');
    creatorDashboardPage.get();
    expect(
      creatorDashboardPage.getNumberOfFeedbackMessages()
    ).toEqual(1);
    creatorDashboardPage.navigateToExplorationEditor();

    editor.expectCurrentTabToBeFeedbackTab();
    editor.readFeedbackMessages().then(function(messages) {
      expect(messages.length).toEqual(1);
      expect(messages[0]).toEqual(feedback);
    });
    editor.sendResponseToLatestFeedback(feedbackResponse);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Suggestions on Explorations', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_OBJECTIVE = 'To explore something new';
  var EXPLORATION_LANGUAGE = 'English';
  var creatorDashboardPage = null;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
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
    browser.get(general.SERVER_URL_PREFIX);
    users.logout();

    // Suggester plays the exploration and suggests a change
    users.login('user2@ExplorationSuggestions.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);

    var suggestion = 'New Exploration';
    var suggestionDescription = 'Uppercased the first letter';

    explorationPlayerPage.submitSuggestion(suggestion, suggestionDescription);
    users.logout();

    // Exploration author reviews the suggestion and accepts it
    users.login('user1@ExplorationSuggestions.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    editor.getSuggestionThreads().then(function(threads) {
      expect(threads.length).toEqual(1);
      expect(threads[0]).toMatch(suggestionDescription);
      editor.acceptSuggestion(suggestionDescription);

      editor.navigateToPreviewTab();
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
      users.logout();

      // Student logs in and plays the exploration, finds the updated content
      users.login('user3@ExplorationSuggestions.com');
      libraryPage.get();
      libraryPage.playExploration(EXPLORATION_TITLE);
      explorationPlayerPage.expectContentToMatch(forms.toRichText(suggestion));
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
