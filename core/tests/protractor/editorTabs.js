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
 * @fileoverview End-to-end tests of the exploration editor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Exploration editor tab', function() {
  it('should handle discarding changes, navigation, deleting states, ' +
      'changing the first state, displaying content, deleting rules and ' +
      'switching to preview mode', function() {
    users.createUser('user5@example.com', 'user5');
    users.login('user5@example.com');

    workflow.createExploration('sums', 'maths');
    general.getExplorationIdFromEditor().then(function(explorationId) {

      // Check discarding of changes
      editor.setStateName('state1');
      editor.expectStateNamesToBe(['state1', 'END']);
      editor.setContent(forms.toRichText('state1 content'));
      editor.setInteraction('TextInput');
      editor.addRule('TextInput', null, 'END', 'Default');
      editor.RuleEditor('default').createNewStateAndSetDestination('state2');
      editor.moveToState('state2');
      // NOTE: we must move to the state before checking state names to avoid
      // inexplicable failures of the protractor utility that reads state names
      // (the user-visible names are fine either way). See issue 732 for more.
      editor.expectStateNamesToBe(['state1', 'state2', 'END']);
      editor.setInteraction('EndExploration');

      editor.discardChanges();
      editor.expectCurrentStateToBe(general.FIRST_STATE_DEFAULT_NAME);
      editor.setStateName('first');
      editor.expectStateNamesToBe(['first', 'END']);

      // Check deletion of states and changing the first state
      editor.setInteraction('TextInput');
      editor.addRule('TextInput', null, 'END', 'Default');
      editor.RuleEditor('default').createNewStateAndSetDestination('second');
      editor.moveToState('second');
      editor.expectStateNamesToBe(['first', 'second', 'END']);
      editor.expectCurrentStateToBe('second');
      editor.expectAvailableFirstStatesToBe(['first', 'second']);
      editor.setFirstState('second');
      editor.moveToState('first');
      editor.deleteState('first');
      editor.expectCurrentStateToBe('second');
      editor.expectStateNamesToBe(['second', 'END']);

      // Check behaviour of the back button
      editor.setObjective('do stuff');
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE + explorationId +
        '#/gui/second');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE + explorationId +
        '#/settings');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE + explorationId +
        '#/gui/second');

      // Check display of content & interaction in the editor
      editor.setContent(function(richTextEditor) {
        richTextEditor.appendItalicText('Welcome');
      });
      editor.expectContentToMatch(function(richTextChecker) {
        richTextChecker.readItalicText('Welcome');
      });
      editor.setInteraction('NumericInput');
      editor.expectInteractionToMatch('NumericInput');

      // Check deletion of rules
      editor.addRule('NumericInput', forms.toRichText('Farewell'), null, 'Default');
      editor.RuleEditor('default').
        expectAvailableDestinationsToBe(['second', 'END']);
      editor.RuleEditor('default').setDestination('END');
      editor.RuleEditor('default').
        expectAvailableDestinationsToBe(['second', 'END']);
      editor.addRule('NumericInput', null, 'END', 'IsGreaterThan', 2);
      editor.RuleEditor(0).delete();

      // Check editor preview tab
      editor.navigateToPreviewTab();
      player.expectContentToMatch(function(richTextEditor) {
        richTextEditor.readItalicText('Welcome');
      });
      player.expectInteractionToMatch('NumericInput');
      player.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted rule no longer applies.
      player.expectLatestFeedbackToMatch(forms.toRichText('Farewell'));
      player.expectExplorationToBeOver();

      editor.discardChanges();
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Exploration history tab', function() {
  it('should display the history', function() {
    users.createUser('history@example.com', 'explorationhistory');
    users.login('history@example.com');
    workflow.createExploration('history', 'history');

    // Constants for colors of nodes in history graph
    var COLOR_ADDED = 'rgb(78, 162, 78)';
    var COLOR_DELETED = 'rgb(220, 20, 60)';
    var COLOR_CHANGED = 'rgb(30, 144, 255)';
    var COLOR_UNCHANGED = 'rgb(245, 245, 220)';
    var COLOR_RENAMED_UNCHANGED = 'rgb(255, 215, 0)';

    // Compare a version to itself
    editor.expectGraphComparisonOf(1, 1).toBe([
      {'label': 'First State', 'color': COLOR_UNCHANGED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [0, 0, 0]);

    // Check renaming state, editing text, editing interactions and adding state
    editor.moveToState('First State');
    editor.setStateName('first');
    editor.setContent(forms.toRichText('enter 6 to continue'));
    editor.setInteraction('NumericInput');
    editor.addRule('NumericInput', null, 'END', 'Equals', 6);
    editor.RuleEditor(0).createNewStateAndSetDestination('second');
    editor.moveToState('second');
    editor.setContent(forms.toRichText('this is state 2'));
    editor.setInteraction('Continue');
    editor.addRule('Continue', null, 'END', 'Default');
    editor.moveToState('first');
    editor.saveChanges();

    var VERSION_1_STATE_1_CONTENTS = {
      1: {text: 'content:', highlighted: false},
      2: {text: '- type: text', highlighted: false},
      3: {text: '  value: <p>enter 6 to continue</p>', highlighted: true},
      4: {text: 'interaction:', highlighted: false},
      5: {text: '  customization_args: {}', highlighted: false},
      6: {text: '  handlers:', highlighted: false},
      7: {text: '  - name: submit', highlighted: false},
      8: {text: '    rule_specs:', highlighted: false},
      9: {text: '    - definition:', highlighted: false},
      10: {text: '        inputs:', highlighted: true},
      11: {text: '          x: 6.0', highlighted: true},
      12: {text: '        name: Equals', highlighted: true},
      13: {text: '        rule_type: atomic', highlighted: true},
      14: {text: '        subject: answer', highlighted: true},
      15: {text: '      dest: second', highlighted: true},
      16: {text: '      feedback: []', highlighted: true},
      17: {text: '      param_changes: []', highlighted: true},
      18: {text: '    - definition:', highlighted: true},
      19: {text: '        rule_type: default', highlighted: false},
      20: {text: '      dest: first', highlighted: true},
      21: {text: '      feedback: []', highlighted: false},
      22: {text: '      param_changes: []', highlighted: false},
      23: {text: '  id: NumericInput', highlighted: true},
      24: {text: 'param_changes: []', highlighted: false},
      25: {text: ' ', highlighted: false}
    };
    var VERSION_2_STATE_1_CONTENTS = {
      1: {text: 'content:', highlighted: false},
      2: {text: '- type: text', highlighted: false},
      3: {text: '  value: \'\'', highlighted: true},
      4: {text: 'interaction:', highlighted: false},
      5: {text: '  customization_args: {}', highlighted: false},
      6: {text: '  handlers:', highlighted: false},
      7: {text: '  - name: submit', highlighted: false},
      8: {text: '    rule_specs:', highlighted: false},
      // Note that highlighting *underneath* a line is still considered a
      // highlight.
      9: {text: '    - definition:', highlighted: true},
      10: {text: '        rule_type: default', highlighted: false},
      11: {text: '      dest: First State', highlighted: true},
      12: {text: '      feedback: []', highlighted: false},
      13: {text: '      param_changes: []', highlighted: false},
      14: {text: '  id: null', highlighted: true},
      15: {text: 'param_changes: []', highlighted: false},
      16: {text: ' ', highlighted: false}
    };
    var STATE_2_STRING =
      'content:\n' +
      '- type: text\n' +
      '  value: <p>this is state 2</p>\n' +
      'interaction:\n' +
      '  customization_args:\n' +
      '    buttonText:\n' +
      '      value: Continue\n' +
      '  handlers:\n' +
      '  - name: submit\n' +
      '    rule_specs:\n' +
      '    - definition:\n' +
      '        rule_type: default\n' +
      '      dest: END\n' +
      '      feedback: []\n' +
      '      param_changes: []\n' +
      '  id: Continue\n' +
      'param_changes: []\n' +
      ' ';

    editor.expectGraphComparisonOf(1, 2).toBe([
      {'label': 'first (was: First ...', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [2, 2, 0]);
    editor.expectTextComparisonOf(1, 2, 'first (was: First ...')
      .toBeWithHighlighting(VERSION_1_STATE_1_CONTENTS, VERSION_2_STATE_1_CONTENTS);
    editor.expectTextComparisonOf(1, 2, 'second')
      .toBe(STATE_2_STRING, ' ');

    // Switching the 2 compared versions should give the same result.
    editor.expectGraphComparisonOf(2, 1).toBe([
      {'label': 'first (was: First ...', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [2, 2, 0]);

    // Check deleting a state
    editor.deleteState('second');
    editor.moveToState('first');
    editor.RuleEditor(0).setDestination('END');
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 3).toBe([
      {'label': 'first', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_DELETED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [3, 1, 2]);
    editor.expectTextComparisonOf(2, 3, 'second')
      .toBe(' ', STATE_2_STRING);

    // Check renaming a state
    editor.moveToState('first');
    editor.setStateName('third');
    editor.saveChanges();
    editor.expectGraphComparisonOf(3, 4).toBe([
      {'label': 'third (was: first)', 'color': COLOR_RENAMED_UNCHANGED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [1, 0, 0]);

    // Check re-inserting a deleted state
    editor.moveToState('third');
    editor.RuleEditor(0).createNewStateAndSetDestination('second');
    editor.moveToState('second');
    editor.setContent(forms.toRichText('this is state 2'));
    editor.setInteraction('Continue');
    editor.addRule('Continue', null, 'END', 'Default');
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 5).toBe([
      {'label': 'third (was: first)', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_UNCHANGED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [2, 0, 0]);

    // Check that reverting works
    editor.revertToVersion(2);
    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText('enter 6 to continue'));
    player.submitAnswer('NumericInput', 6);
    player.expectExplorationToNotBeOver();
    player.expectContentToMatch(forms.toRichText('this is state 2'));
    player.expectInteractionToMatch('Continue', 'CONTINUE');
    player.submitAnswer('Continue', null);
    player.expectExplorationToBeOver();

    general.moveToEditor();
    editor.expectGraphComparisonOf(4, 6).toBe([
      {'label': 'first (was: third)', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'END', 'color': COLOR_UNCHANGED}
    ], [3, 2, 1]);

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
