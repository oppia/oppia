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
 * @fileoverview End-to-end tests for the functionality the history tab of the
 * exploration editor.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');

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
        text: '        content_id: feedback_1',
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
        text: '      missing_prerequisite_skill_id: null',
        highlighted: true
      },
      14: {
        text: '      param_changes: []',
        highlighted: true
      },
      15: {
        text: '      refresher_exploration_id: null',
        highlighted: true
      },
      16: {
        text: '    rule_specs:',
        highlighted: true
      },
      17: {
        text: '    - inputs:',
        highlighted: true
      },
      18: {
        text: '        x: 6',
        highlighted: true
      },
      19: {
        text: '      rule_type: Equals',
        highlighted: true
      },
      20: {
        text: '    tagged_skill_misconception_id: null',
        highlighted: true
      },
      21: {
        text: '    training_data: []',
        highlighted: true
      },
      22: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      23: {
        text: '  customization_args: {}',
        highlighted: false
      },
      24: {
        text: '  default_outcome:',
        highlighted: false
      },
      25: {
        text: '    dest: first',
        highlighted: true
      },
      26: {
        text: '    feedback:',
        highlighted: false
      },
      27: {
        text: '      content_id: default_outcome',
        highlighted: false
      },
      28: {
        text: '      html: \'\'',
        highlighted: false
      },
      29: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      30: {
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      31: {
        text: '    param_changes: []',
        highlighted: false
      },
      32: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      33: {
        text: '  hints: []',
        highlighted: false
      },
      34: {
        text: '  id: NumericInput',
        highlighted: true
      },
      35: {
        text: '  solution: null',
        highlighted: false
      },
      36: {
        text: 'param_changes: []',
        highlighted: false
      },
      37: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      38: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      39: {
        text: '    content: {}',
        highlighted: false
      },
      40: {
        text: '    default_outcome: {}',
        highlighted: false
      },
      41: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      42: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      43: {
        text: 'written_translations:',
        highlighted: false
      },
      44: {
        text: '  translations_mapping:',
        highlighted: false
      },
      45: {
        text: '    content: {}',
        highlighted: false
      },
      46: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      47: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      48: {
        text: '',
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
        text: '      content_id: default_outcome',
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
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      16: {
        text: '    param_changes: []',
        highlighted: false
      },
      17: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      18: {
        text: '  hints: []',
        highlighted: false
      },
      19: {
        text: '  id: null',
        highlighted: true
      },
      20: {
        text: '  solution: null',
        highlighted: false
      },
      21: {
        text: 'param_changes: []',
        highlighted: false
      },
      22: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      23: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      24: {
        text: '    content: {}',
        highlighted: false
      },
      25: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      26: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      27: {
        text: 'written_translations:',
        highlighted: false
      },
      28: {
        text: '  translations_mapping:',
        highlighted: false
      },
      29: {
        text: '    content: {}',
        highlighted: false
      },
      30: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      31: {
        text: '',
        highlighted: false
      }
    };

    var STATE_2_STRING =
      'classifier_model_id: null\n' +
      'content:\n' +
      '  content_id: content\n' +
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
      'recorded_voiceovers:\n' +
      '  voiceovers_mapping:\n' +
      '    content: {}\n' +
      '    default_outcome: {}\n' +
      'solicit_answer_details: false\n' +
      'written_translations:\n' +
      '  translations_mapping:\n' +
      '    content: {}\n' +
      '    default_outcome: {}\n' +
      '';

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
    historyGraph.expectTextToMatch(STATE_2_STRING, '');
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
    historyGraph.expectTextToMatch('', STATE_2_STRING);
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
