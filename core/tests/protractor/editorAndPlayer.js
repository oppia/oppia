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
 * @fileoverview End-to-end tests of the full exploration editor.
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Full exploration editor', function() {
  it('should navigate multiple states correctly, with parameters', function() {
    users.createUser('user4@editorAndPlayer.com', 'user4EditorAndPlayer');
    users.login('user4@editorAndPlayer.com');

    workflow.createExploration();
    editor.setStateName('card 1');
    editor.setContent(forms.toRichText('this is card 1'));
    editor.setInteraction('NumericInput');
    editor.addResponse('NumericInput', null, 'final card', true, 'Equals', 21);
    editor.ResponseEditor(0).setDestination('card 2', true);

    editor.moveToState('card 2');
    editor.setContent(forms.toRichText(
      'this is card 2 with previous answer {{answer}}'));
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addResponse('MultipleChoiceInput', null, 'card 1', false,
      'Equals', 'return');
    editor.setDefaultOutcome(null, 'final card', false);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText('this is card 1'));
    player.submitAnswer('NumericInput', 19);
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    player.submitAnswer('MultipleChoiceInput', 'return');
    player.expectContentToMatch(forms.toRichText('this is card 1'));
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    player.expectExplorationToNotBeOver();
    player.submitAnswer('MultipleChoiceInput', 'complete');
    player.expectExplorationToBeOver();
    users.logout();
  });

  it('should handle discarding changes, navigation, deleting states, ' +
      'changing the first state, displaying content, deleting responses and ' +
      'switching to preview mode', function() {
    users.createUser('user5@editorAndPlayer.com', 'user5EditorAndPlayer');
    users.login('user5@editorAndPlayer.com');

    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(explorationId) {
      // Check discarding of changes
      editor.setStateName('card1');
      editor.expectCurrentStateToBe('card1');
      editor.setContent(forms.toRichText('card1 content'));
      editor.setInteraction('TextInput');
      editor.setDefaultOutcome(null, 'final card', true);
      editor.ResponseEditor('default').setDestination('card2', true);
      editor.moveToState('card2');
      // NOTE: we must move to the state before checking state names to avoid
      // inexplicable failures of the protractor utility that reads state names
      // (the user-visible names are fine either way). See issue 732 for more.
      editor.expectStateNamesToBe(['final card', 'card1', 'card2']);
      editor.setInteraction('EndExploration');

      editor.discardChanges();
      editor.expectCurrentStateToBe(general.FIRST_STATE_DEFAULT_NAME);
      editor.setStateName('first');
      editor.expectCurrentStateToBe('first');

      // Check deletion of states and changing the first state
      editor.setInteraction('TextInput');
      editor.setDefaultOutcome(null, 'final card', true);
      editor.ResponseEditor('default').setDestination('second', true);
      editor.moveToState('second');
      editor.expectStateNamesToBe(['final card', 'first', 'second']);
      editor.expectCurrentStateToBe('second');
      editor.expectAvailableFirstStatesToBe(['final card', 'first', 'second']);
      editor.setFirstState('second');
      editor.moveToState('first');
      editor.deleteState('first');
      editor.expectCurrentStateToBe('second');
      editor.expectStateNamesToBe(['final card', 'second']);

      // Check behaviour of the back button
      editor.setObjective('do some stuff here');
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

      // Check deletion of groups
      editor.setDefaultOutcome(forms.toRichText('Farewell'), null, false);
      editor.ResponseEditor('default').
        expectAvailableDestinationsToBe(['second', 'final card']);
      editor.ResponseEditor('default').setDestination('final card', false);
      editor.ResponseEditor('default').
        expectAvailableDestinationsToBe(['second', 'final card']);
      editor.addResponse('NumericInput', null, 'final card', false,
        'IsGreaterThan', 2);
      editor.ResponseEditor(0).delete();

      // Setup a terminating state
      editor.moveToState('final card');
      editor.setInteraction('EndExploration');

      // Check that preview/editor switch doesn't change state
      editor.navigateToPreviewTab();
      player.expectExplorationToBeOver();
      editor.navigateToMainTab();
      editor.expectCurrentStateToBe('final card');
      editor.moveToState('second');

      // Check editor preview tab
      editor.navigateToPreviewTab();
      player.expectContentToMatch(function(richTextEditor) {
        richTextEditor.readItalicText('Welcome');
      });
      player.expectInteractionToMatch('NumericInput');
      player.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted group no longer applies.
      player.expectLatestFeedbackToMatch(forms.toRichText('Farewell'));
      player.clickThroughToNextCard();
      player.expectExplorationToBeOver();

      editor.discardChanges();
      users.logout();
    });
  });

  it('should handle multiple rules in an answer group and also disallow ' +
      'editing of a read-only exploration', function() {
    users.createUser('user6@editorAndPlayer.com', 'user6EditorAndPlayer');
    users.createUser('user7@editorAndPlayer.com', 'user7EditorAndPlayer');
    users.login('user6@editorAndPlayer.com');
    workflow.createExploration();

    general.getExplorationIdFromEditor().then(function(explorationId) {
      // Create an exploration with multiple groups.
      editor.setStateName('first card');
      editor.setContent(forms.toRichText('How are you feeling?'));
      editor.setInteraction('TextInput');
      editor.addResponse('TextInput', forms.toRichText('You must be happy!'),
        null, false, 'Equals', 'happy');
      editor.addResponse('TextInput', forms.toRichText('No being sad!'),
        null, false, 'Contains', 'sad');
      editor.setDefaultOutcome(forms.toRichText(
        'Okay, now this is just becoming annoying.'), 'final card', true);

      // Now, add multiple rules to a single answer group.
      editor.ResponseEditor(0).addRule('TextInput', 'Contains', 'meh');
      editor.ResponseEditor(0).addRule('TextInput', 'Contains', 'okay');

      // Ensure that the only rule for this group cannot be deleted.
      editor.ResponseEditor(1).expectCannotDeleteRule(0);

      // Setup a terminating state.
      editor.moveToState('final card');
      editor.setInteraction('EndExploration');

      // Save.
      editor.setTitle('Testing multiple rules');
      editor.setCategory('Answer Groups');
      editor.setObjective('To assess happiness.');
      editor.saveChanges();
      workflow.publishExploration();

      // Login as another user and verify that the exploration editor does not
      // allow the second user to modify the exploration.
      users.logout();
      users.login('user7@editorAndPlayer.com');
      general.openEditor(explorationId);
      editor.exitTutorialIfNecessary();

      // Verify nothing can change with this user.
      editor.expectInteractionToMatch('TextInput');
      editor.expectCannotDeleteInteraction();
      editor.expectCannotAddResponse();
      editor.expectCannotSaveChanges();

      // Check answer group 1.
      var responseEditor = editor.ResponseEditor(0);
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();
      responseEditor.expectCannotDeleteResponse();
      responseEditor.expectCannotAddRule();
      responseEditor.expectCannotDeleteRule(0);
      responseEditor.expectCannotDeleteRule(1);

      // Check answer group 2.
      responseEditor = editor.ResponseEditor(0);
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();
      responseEditor.expectCannotDeleteResponse();
      responseEditor.expectCannotAddRule();
      responseEditor.expectCannotDeleteRule(0);

      // Check default outcome.
      responseEditor = editor.ResponseEditor('default');
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();

      // Check editor preview tab to verify multiple rules are working.
      general.moveToPlayer();
      player.expectContentToMatch(forms.toRichText('How are you feeling?'));
      player.expectInteractionToMatch('TextInput');

      player.submitAnswer('TextInput', 'happy');
      player.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      player.submitAnswer('TextInput', 'meh, I\'m okay');
      player.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      player.submitAnswer('TextInput', 'NO I\'M SAD');
      player.expectLatestFeedbackToMatch(forms.toRichText('No being sad!'));

      player.submitAnswer('TextInput', 'Fine...I\'m doing okay');
      player.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      // Finish the exploration.
      player.submitAnswer('TextInput', 'Whatever...');

      player.expectLatestFeedbackToMatch(
        forms.toRichText('Okay, now this is just becoming annoying.'));
      player.clickThroughToNextCard();
      player.expectExplorationToBeOver();

      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
