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
 * @fileoverview End-to-end tests of the history tab.
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Exploration history', function() {
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
        text: '- type: text',
        highlighted: false
      },
      4: {
        text: '  value: <p>enter 6 to continue</p>',
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
        text: '  - correct: false',
        highlighted: true
      },
      8: {
        text: '    outcome:',
        highlighted: true
      },
      9: {
        text: '      dest: second',
        highlighted: true
      },
      10: {
        text: '      feedback: []',
        highlighted: true
      },
      11: {
        text: '      param_changes: []',
        highlighted: true
      },
      12: {
        text: '    rule_specs:',
        highlighted: true
      },
      13: {
        text: '    - inputs:',
        highlighted: true
      },
      14: {
        text: '        x: 6',
        highlighted: true
      },
      15: {
        text: '      rule_type: Equals',
        highlighted: true
      },
      16: {
        text: '  confirmed_unclassified_answers: []',
        highlighted: false
      },
      17: {
        text: '  customization_args: {}',
        highlighted: false
      },
      18: {
        text: '  default_outcome:',
        highlighted: false
      },
      19: {
        text: '    dest: first',
        highlighted: true
      },
      20: {
        text: '    feedback: []',
        highlighted: false
      },
      21: {
        text: '    param_changes: []',
        highlighted: false
      },
      22: {
        text: '  fallbacks: []',
        highlighted: false
      },
      23: {
        text: '  id: NumericInput',
        highlighted: true
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
        text: '- type: text',
        highlighted: false
      },
      4: {
        text: '  value: \'\'',
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
        text: '    feedback: []',
        highlighted: false
      },
      12: {
        text: '    param_changes: []',
        highlighted: false
      },
      13: {
        text: '  fallbacks: []',
        highlighted: false
      },
      14: {
        text: '  id: null',
        highlighted: true
      },
      15: {
        text: 'param_changes: []',
        highlighted: false
      },
      16: {
        text: ' ',
        highlighted: false
      }
    };

    var STATE_2_STRING =
      'classifier_model_id: null\n' +
      'content:\n' +
      '- type: text\n' +
      '  value: <p>this is card 2</p>\n' +
      'interaction:\n' +
      '  answer_groups: []\n' +
      '  confirmed_unclassified_answers: []\n' +
      '  customization_args:\n' +
      '    buttonText:\n' +
      '      value: Continue\n' +
      '  default_outcome:\n' +
      '    dest: final card\n' +
      '    feedback: []\n' +
      '    param_changes: []\n' +
      '  fallbacks: []\n' +
      '  id: Continue\n' +
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
    editor.ResponseEditor(0).setDestination('final card', false);
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
    editor.ResponseEditor(0).setDestination('second', true);
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
    player.expectContentToMatch(forms.toRichText('enter 6 to continue'));
    player.submitAnswer('NumericInput', 6);
    player.expectExplorationToNotBeOver();
    player.expectContentToMatch(forms.toRichText('this is card 2'));
    player.expectInteractionToMatch('Continue', 'CONTINUE');
    player.submitAnswer('Continue', null);
    player.expectExplorationToBeOver();

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
