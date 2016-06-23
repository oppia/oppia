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
 * @fileoverview End-to-end tests of the interaction between the player and
 * editor.
 */

var general = require('../protractor_utils/general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('State editor', function() {
  it('should walk through the tutorial when user repeatedly clicks Next',
      function() {
    var NUM_TUTORIAL_STAGES = 7;
    users.createUser(
      'userTutorial@stateEditor.com', 'userTutorialStateEditor');
    users.login('userTutorial@stateEditor.com');

    workflow.createExplorationAndStartTutorial();
    editor.startTutorial();
    for (var i = 0; i < NUM_TUTORIAL_STAGES - 1; i++) {
      editor.progressInTutorial();
      general.waitForSystem();
    }
    editor.finishTutorial();
    users.logout();
  });

  it('should display plain text content', function() {
    users.createUser('user1@stateEditor.com', 'user1StateEditor');
    users.login('user1@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('plain text'));
    editor.setInteraction('Continue', 'click here');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText('plain text'));
    player.expectExplorationToNotBeOver();
    player.expectInteractionToMatch('Continue', 'click here');
    player.submitAnswer('Continue', null);
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should create content and multiple choice interactions', function() {
    users.createUser('user2@stateEditor.com', 'user2StateEditor');
    users.login('user2@stateEditor.com');

    workflow.createExploration();
    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendItalicText('italic text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectExplorationToNotBeOver();
    player.expectInteractionToMatch(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    player.submitAnswer('MultipleChoiceInput', 'option B');
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should obey numeric interaction rules and display feedback', function() {
    users.createUser('user3@stateEditor.com', 'user3StateEditor');
    users.login('user3@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));
    editor.setInteraction('NumericInput');
    editor.addResponse('NumericInput', function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    }, 'final card', true, 'IsInclusivelyBetween', -1, 3);
    editor.setDefaultOutcome(forms.toRichText('out of bounds'), null, false);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.submitAnswer('NumericInput', 5);
    player.expectLatestFeedbackToMatch(forms.toRichText('out of bounds'));
    player.expectExplorationToNotBeOver();
    // It's important to test the value 0 in order to ensure that it would
    // still get submitted even though it is a falsy value in JavaScript.
    player.submitAnswer('NumericInput', 0);
    player.expectLatestFeedbackToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('correct');
    });
    player.clickThroughToNextCard();
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should preserve input value when rule type changes in' +
      ' add response modal', function() {
    users.createUser('stateEditorUser1@example.com', 'stateEditorUser1');
    users.login('stateEditorUser1@example.com');
    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    editor.openInteraction('TextInput');
    editor.customizeInteraction('TextInput', 'My PlaceHolder', 2);
    editor.selectRuleInAddResponseModal('TextInput', 'Equals');
    editor.setRuleParametersInAddResponseModal('TextInput',
      'Equals', 'Some Text');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.selectRuleInAddResponseModal('TextInput', 'Contains');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.closeAddResponseModal();

    editor.saveChanges();
    users.logout();
  });
});
