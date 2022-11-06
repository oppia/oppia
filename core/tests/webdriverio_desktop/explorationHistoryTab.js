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
 * @fileoverview End-to-end tests for the functionality the history tab of the
 * exploration editor.
 */

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');


var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');

describe('Exploration history', function() {
  var explorationEditorPage = null;
  var explorationPlayerPage = null;
  var explorationEditorHistoryTab = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;

  // Constants for colors of nodes in history graph.
  var COLOR_ADDED = 'rgb(78,162,78)';
  var COLOR_DELETED = 'rgb(220,20,60)';
  var COLOR_CHANGED = 'rgb(30,144,255)';
  var COLOR_UNCHANGED = 'rgb(245,245,220)';
  var COLOR_RENAMED_UNCHANGED = 'rgb(255,215,0)';

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorHistoryTab = explorationEditorPage.getHistoryTab();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should correctly display the dates of the commits', async function() {
    await users.createUser('userTestDate@historyTab.com', 'testDateUsername');
    await users.login('userTestDate@historyTab.com');

    // Creating an exploration creates the first commit. Therefore, there
    // should be a date associated with it.
    await workflow.createExploration(true);

    // Switch to the history tab because that is where the commit history
    // is displayed.
    await explorationEditorPage.navigateToHistoryTab();
    await explorationEditorHistoryTab.expectCommitDatesToBeDisplayed();

    await users.logout();
  });

  it('should display the history of the states', async function() {
    await users.createUser('user@historyTab.com', 'userHistoryTab');
    await users.login('user@historyTab.com');
    await workflow.createExploration(true);

    // Check renaming state, editing text, editing interactions and adding
    // state.
    await explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(await forms.toRichText(
      'enter 6 to continue'), true);
    await explorationEditorMainTab.setInteraction('NumericInput', false);
    await explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 2'), true);
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
        text: 'content:',
        highlighted: false
      },
      2: {
        text: '  html: \'\'',
        highlighted: true
      },
      3: {
        text: '  content_id: content',
        highlighted: false
      },
      4: {
        text: 'classifier_model_id: null',
        highlighted: false
      },
      5: {
        text: 'linked_skill_id: null',
        highlighted: false
      },
      6: {
        text: 'interaction:',
        highlighted: false
      },
      7: {
        text: '  answer_groups: []',
        highlighted: true
      },
      8: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: true
      },
      9: {
        text: '  customization_args: {}',
        highlighted: true
      },
      10: {
        text: '  default_outcome:',
        highlighted: false
      },
      // Note that highlighting *underneath* a line is still considered a
      // highlight.
      11: {
        text: '    dest: ' + general.FIRST_STATE_DEFAULT_NAME,
        highlighted: true
      },
      12: {
        text: '    dest_if_really_stuck: null',
        highlighted: false
      },
      13: {
        text: '    feedback:',
        highlighted: false
      },
      14: {
        text: '      html: \'\'',
        highlighted: false
      },
      15: {
        text: '      content_id: default_outcome',
        highlighted: false
      },
      16: {
        text: '    labelled_as_correct: false',
        highlighted: false
      },
      17: {
        text: '    param_changes: []',
        highlighted: false
      },
      18: {
        text: '    refresher_exploration_id: null',
        highlighted: false
      },
      19: {
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      20: {
        text: '  hints: []',
        highlighted: false
      },
      21: {
        text: '  id: null',
        highlighted: true
      },
      22: {
        text: '  solution: null',
        highlighted: false
      },
      23: {
        text: 'param_changes: []',
        highlighted: false
      },
      24: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      25: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      26: {
        text: '    content: {}',
        highlighted: false
      },
      27: {
        text: '    default_outcome: {}',
        highlighted: true
      },
      28: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      29: {
        text: 'card_is_checkpoint: true',
        highlighted: false
      },
      30: {
        text: 'written_translations:',
        highlighted: false
      },
      31: {
        text: '  translations_mapping:',
        highlighted: false
      },
      32: {
        text: '    content: {}',
        highlighted: false
      },
      33: {
        text: '    default_outcome: {}',
        highlighted: false
      },
      34: {
        text: 'next_content_id_index: 0',
        highlighted: true
      },
      35: {
        text: '',
        highlighted: false
      }
    };

    var VERSION_2_STATE_1_CONTENTS = {
      1: {
        text: 'content:',
        highlighted: false
      },
      2: {
        text: '  html: <p>enter 6 to continue</p>',
        highlighted: true
      },
      3: {
        text: '  content_id: content',
        highlighted: false
      },
      4: {
        text: 'classifier_model_id: null',
        highlighted: false
      },
      5: {
        text: 'linked_skill_id: null',
        highlighted: false
      },
      6: {
        text: 'interaction:',
        highlighted: false
      },
      7: {
        text: '  answer_groups:',
        highlighted: true
      },
      8: {
        text: '    - rule_specs:',
        highlighted: true
      },
      9: {
        text: '        - rule_type: Equals',
        highlighted: true
      },
      10: {
        text: '          inputs:',
        highlighted: true
      },
      11: {
        text: '            x: 6',
        highlighted: true
      },
      12: {
        text: '      outcome:',
        highlighted: true
      },
      13: {
        text: '        dest: second',
        highlighted: true
      },
      14: {
        text: '        dest_if_really_stuck: null',
        highlighted: true
      },
      15: {
        text: '        feedback:',
        highlighted: true
      },
      16: {
        text: '          html: \'\'',
        highlighted: true
      },
      17: {
        text: '          content_id: feedback_1',
        highlighted: true
      },
      18: {
        text: '        labelled_as_correct: false',
        highlighted: true
      },
      19: {
        text: '        param_changes: []',
        highlighted: true
      },
      20: {
        text: '        refresher_exploration_id: null',
        highlighted: true
      },
      21: {
        text: '        missing_prerequisite_skill_id: null',
        highlighted: true
      },
      22: {
        text: '      training_data: []',
        highlighted: true
      },
      23: {
        text: '      tagged_skill_misconception_id: null',
        highlighted: true
      },
      24: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: true
      },
      25: {
        text: '  customization_args:',
        highlighted: true
      },
      26: {
        text: '    requireNonnegativeInput:',
        highlighted: true
      },
      27: {
        text: '      value: false',
        highlighted: true
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
        text: '    dest_if_really_stuck: null',
        highlighted: false
      },
      31: {
        text: '    feedback:',
        highlighted: false
      },
      32: {
        text: '      html: \'\'',
        highlighted: false
      },
      33: {
        text: '      content_id: default_outcome',
        highlighted: false
      },
      34: {
        text: '    labelled_as_correct: false',
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
        text: '    missing_prerequisite_skill_id: null',
        highlighted: false
      },
      38: {
        text: '  hints: []',
        highlighted: false
      },
      39: {
        text: '  id: NumericInput',
        highlighted: true
      },
      40: {
        text: '  solution: null',
        highlighted: false
      },
      41: {
        text: 'param_changes: []',
        highlighted: false
      },
      42: {
        text: 'recorded_voiceovers:',
        highlighted: false
      },
      43: {
        text: '  voiceovers_mapping:',
        highlighted: false
      },
      44: {
        text: '    content: {}',
        highlighted: false
      },
      45: {
        text: '    default_outcome: {}',
        highlighted: false
      },
      46: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      47: {
        text: 'solicit_answer_details: false',
        highlighted: false
      },
      48: {
        text: 'card_is_checkpoint: true',
        highlighted: false
      },
      49: {
        text: 'written_translations:',
        highlighted: false
      },
      50: {
        text: '  translations_mapping:',
        highlighted: false
      },
      51: {
        text: '    content: {}',
        highlighted: false
      },
      52: {
        text: '    default_outcome: {}',
        highlighted: false
      },
      53: {
        text: '    feedback_1: {}',
        highlighted: true
      },
      54: {
        text: 'next_content_id_index: 2',
        highlighted: true
      },
      55: {
        text: '',
        highlighted: false
      }
    };

    var STATE_2_STRING =
      'content:\n' +
      '  html: <p>this is card 2</p>\n' +
      '  content_id: content\n' +
      'classifier_model_id: null\n' +
      'linked_skill_id: null\n' +
      'interaction:\n' +
      '  answer_groups: []\n' +
      '  confirmed_unclassified_answers: []\n' +
      '  customization_args:\n' +
      '    buttonText:\n' +
      '      value:\n' +
      '        unicode_str: Continue\n' +
      '        content_id: ca_buttonText_0\n' +
      '  default_outcome:\n' +
      '    dest: final card\n' +
      '    dest_if_really_stuck: null\n' +
      '    feedback:\n' +
      '      html: \'\'\n' +
      '      content_id: default_outcome\n' +
      '    labelled_as_correct: false\n' +
      '    param_changes: []\n' +
      '    refresher_exploration_id: null\n' +
      '    missing_prerequisite_skill_id: null\n' +
      '  hints: []\n' +
      '  id: Continue\n' +
      '  solution: null\n' +
      'param_changes: []\n' +
      'recorded_voiceovers:\n' +
      '  voiceovers_mapping:\n' +
      '    content: {}\n' +
      '    default_outcome: {}\n' +
      '    ca_buttonText_0: {}\n' +
      'solicit_answer_details: false\n' +
      'card_is_checkpoint: false\n' +
      'written_translations:\n' +
      '  translations_mapping:\n' +
      '    content: {}\n' +
      '    default_outcome: {}\n' +
      '    ca_buttonText_0: {}\n' +
      'next_content_id_index: 1\n' +
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
    await historyGraph.expectTextToMatch('', STATE_2_STRING);
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
    await historyGraph.expectTextToMatch(STATE_2_STRING, '');
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
      await forms.toRichText('this is card 2'), true);
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

  it('should show the history of exploration metadata', async function() {
    await users.createUser('user3@historyTab.com', 'user3HistoryTab');
    await users.login('user3@historyTab.com');
    await workflow.createExploration(true);

    var METADATA_1_STRING = (
      'title: \'\'\n' +
      'category: \'\'\n' +
      'objective: \'\'\n' +
      'language_code: en\n' +
      'tags: []\n' +
      'blurb: \'\'\n' +
      'author_notes: \'\'\n' +
      'states_schema_version: 53\n' +
      'init_state_name: Introduction\n' +
      'param_specs: {}\n' +
      'param_changes: []\n' +
      'auto_tts_enabled: false\n' +
      'correctness_feedback_enabled: true\n' +
      'edits_allowed: true\n' +
      ''
    );

    var METADATA_2_STRING = (
      'title: Dummy Exploration\n' +
      'category: Algorithms\n' +
      'objective: Learn more about Oppia\n' +
      'language_code: en\n' +
      'tags: []\n' +
      'blurb: \'\'\n' +
      'author_notes: \'\'\n' +
      'states_schema_version: 53\n' +
      'init_state_name: Introduction\n' +
      'param_specs: {}\n' +
      'param_changes: []\n' +
      'auto_tts_enabled: false\n' +
      'correctness_feedback_enabled: true\n' +
      'edits_allowed: true\n' +
      ''
    );

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Dummy Exploration');
    await explorationEditorSettingsTab.setCategory('Algorithms');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.saveChanges();
    await explorationEditorPage.navigateToHistoryTab();
    var historyGraph = await explorationEditorHistoryTab.getHistoryGraph();
    await historyGraph.selectTwoVersions('1', '2');
    await historyGraph.openExplorationMetadataHistory();
    await historyGraph.expectTextToMatch(METADATA_1_STRING, METADATA_2_STRING);
    await historyGraph.closeExplorationMetadataHistory();
    await users.logout();
  });

  it('should revert to old exploration commit', async function() {
    await users.createUser('user2@historyTab.com', 'user2HistoryTab');
    await users.login('user2@historyTab.com');
    await workflow.createExploration(true);

    // Make changes for second commit.
    // First card.
    await explorationEditorMainTab.setStateName('first');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'enter 6 to continue'), true);
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    // Second card.
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('card 2 second commit text'), true);
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
      await forms.toRichText('card 2 third commit text'), true);
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
    await explorationEditorHistoryTab.expectRevertToVersion(2);

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
    await general.moveToEditor(false);
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
