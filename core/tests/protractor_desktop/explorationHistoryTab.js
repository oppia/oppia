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

  // Constants for colors of nodes in history graph.
  var COLOR_ADDED = 'rgb(78, 162, 78)';
  var COLOR_DELETED = 'rgb(220, 20, 60)';
  var COLOR_CHANGED = 'rgb(30, 144, 255)';
  var COLOR_UNCHANGED = 'rgb(245, 245, 220)';
  var COLOR_RENAMED_UNCHANGED = 'rgb(255, 215, 0)';

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorHistoryTab = explorationEditorPage.getHistoryTab();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should correctly display the dates of the commits', async function() {
    await users.createUser('userTestDate@historyTab.com', 'testDateUsername');
    await users.login('userTestDate@historyTab.com');

    // Creating an exploration creates the first commit. Therefore, there
    // should be a date associated with it.
    await workflow.createExploration();

    // Switch to the history tab because that is where the commit history
    // is displayed.
    await explorationEditorPage.navigateToHistoryTab();
    await explorationEditorHistoryTab.expectCommitDatesToBeDisplayed();

    await users.logout();
  });

  it('should display the history', async function() {
    await users.createUser('user@historyTab.com', 'userHistoryTab');
    await users.login('user@historyTab.com');
    await workflow.createExploration();

    // Check renaming state, editing text, editing interactions and adding
    // state.
    await explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(await forms.toRichText(
      'enter 6 to continue'));
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 2'));
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorMainTab.moveToState('first');
    await explorationEditorPage.saveChanges();

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
        text: 'next_content_id_index: 2',
        highlighted: true
      },
      37: {
        text: 'param_changes: []',
        highlighted: false
      },
      38: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      39: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      40: {
        text: '    content: {}',
        highlighted: false
      },
      41: {
        text: '    default_outcome: {}',
        highlighted: false
      },
      42: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      43: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      44: {
        text: 'written_translations:',
        highlighted: false
      },
      45: {
        text: '  translations_mapping:',
        highlighted: false
      },
      46: {
        text: '    content: {}',
        highlighted: false
      },
      47: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      48: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      49: {
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
        text: 'next_content_id_index: 0',
        highlighted: true
      },
      22: {
        text: 'param_changes: []',
        highlighted: false
      },
      23: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      24: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      25: {
        text: '    content: {}',
        highlighted: false
      },
      26: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      27: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      28: {
        text: 'written_translations:',
        highlighted: false
      },
      29: {
        text: '  translations_mapping:',
        highlighted: false
      },
      30: {
        text: '    content: {}',
        highlighted: false
      },
      31: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      32: {
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
      '      value:\n' +
      '        content_id: ca_buttonText_0\n' +
      '        unicode_str: Continue\n' +
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
      'next_content_id_index: 1\n' +
      'param_changes: []\n' +
      'recorded_voiceovers:\n' +
      '  voiceovers_mapping:\n' +
      '    ca_buttonText_0: {}\n' +
      '    content: {}\n' +
      '    default_outcome: {}\n' +
      'solicit_answer_details: false\n' +
      'written_translations:\n' +
      '  translations_mapping:\n' +
      '    ca_buttonText_0: {}\n' +
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
    await explorationEditorPage.navigateToHistoryTab();
    var historyGraph = explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.selectTwoVersions('1', '2');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(2, 2, 0);
    await historyGraph.openStateHistory('first (was: Introd...');
    await historyGraph.expectTextWithHighlightingToMatch(
      VERSION_1_STATE_1_CONTENTS, VERSION_2_STATE_1_CONTENTS);
    await historyGraph.closeStateHistory();

    await historyGraph.openStateHistory('second');
    await historyGraph.expectTextToMatch(STATE_2_STRING, '');
    await historyGraph.closeStateHistory();

    // Reset all checkboxes.
    // Switching the 2 compared versions should give the same result.
    await historyGraph.deselectVersion();
    await historyGraph.selectTwoVersions('2', '1');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(2, 2, 0);

    // Check deleting a state.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.deleteState('second');
    await explorationEditorMainTab.moveToState('first');
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.setDestination('final card', false, null);
    await explorationEditorPage.saveChanges();

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
    await explorationEditorPage.navigateToHistoryTab();
    historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.deselectVersion();
    await historyGraph.selectTwoVersions('2', '3');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(3, 1, 2);

    await historyGraph.openStateHistory('second');
    await historyGraph.expectTextToMatch('', STATE_2_STRING);
    await historyGraph.closeStateHistory();

    // Check renaming a state.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.moveToState('first');
    await explorationEditorMainTab.setStateName('third');
    await explorationEditorPage.saveChanges();
    expectedHistoryStates = [{
      label: 'third (was: first)',
      color: COLOR_RENAMED_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    await explorationEditorPage.navigateToHistoryTab();
    historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.selectTwoVersions('3', '4');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(1, 0, 0);

    // Check re-inserting a deleted state.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.moveToState('third');
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.setDestination('second', true, null);
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 2'));
    await explorationEditorMainTab.setInteraction('Continue');

    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('final card', false, null);
    await explorationEditorPage.saveChanges();

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
    await explorationEditorPage.navigateToHistoryTab();
    historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.deselectVersion();
    await historyGraph.selectTwoVersions('2', '5');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(2, 0, 0);

    await users.logout();
  });

  it('should revert to old exploration commit', async function() {
    await users.createUser('user2@historyTab.com', 'user2HistoryTab');
    await users.login('user2@historyTab.com');
    await workflow.createExploration();

    // Make changes for second commit.
    // First card.
    await explorationEditorMainTab.setStateName('first');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'enter 6 to continue'));
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    // Second card.
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('card 2 second commit text'));
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('final card', true, null);
    // Final card.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorMainTab.moveToState('first');
    await explorationEditorPage.saveChanges();

    // Create third commit.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.moveToState('first');
    await explorationEditorMainTab.setStateName('third');
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('card 2 third commit text'));
    await explorationEditorPage.saveChanges();
    expectedHistoryStates = [{
      label: 'third (was: first)',
      color: COLOR_RENAMED_UNCHANGED
    }, {
      label: 'second',
      color: COLOR_CHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    await explorationEditorPage.navigateToHistoryTab();
    var historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.selectTwoVersions('2', '3');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(2, 0, 0);
    // Revert to version 2.
    await explorationEditorPage.navigateToHistoryTab();
    await explorationEditorHistoryTab.revertToVersion(2);

    // Verify exploration is version 2.
    await general.moveToPlayer();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('enter 6 to continue'));
    await explorationPlayerPage.submitAnswer('NumericInput', 6);
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('card 2 second commit text'));
    await explorationPlayerPage.expectInteractionToMatch(
      'Continue', 'CONTINUE');
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToBeOver();

    // Verify history states between original and reversion.
    await general.moveToEditor();
    var expectedHistoryStates = [{
      label: 'first',
      color: COLOR_UNCHANGED
    }, {
      label: 'second',
      color: COLOR_UNCHANGED
    }, {
      label: 'final card',
      color: COLOR_UNCHANGED
    }];
    await explorationEditorPage.navigateToHistoryTab();
    historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.selectTwoVersions('2', '4');
    await historyGraph.expectHistoryStatesToMatch(expectedHistoryStates);
    await historyGraph.expectNumberOfLinksToMatch(2, 0, 0);

    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
