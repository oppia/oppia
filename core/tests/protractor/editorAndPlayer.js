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
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');

describe('Full exploration editor', function() {
  var explorationPlayerPage = null;

  beforeAll(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should redirect back to parent exploration correctly when parent id is ' +
      'given as query parameter', function() {
    users.createUser('user1@editorAndPlayer.com', 'user1EditorAndPlayer');
    users.login('user1@editorAndPlayer.com');

    workflow.createAndPublishExploration(
      'Parent Exploration 1',
      'Algebra',
      'This is the topmost parent exploration.');
    general.getExplorationIdFromEditor().then(function(explorationId) {
      var parentId1 = explorationId;

      workflow.createAndPublishExploration(
        'Parent Exploration 2',
        'Algebra',
        'This is the second parent exploration to which refresher ' +
        'exploration redirects.');
      general.getExplorationIdFromEditor().then(function(explorationId) {
        var parentId2 = explorationId;

        workflow.createAndPublishExploration(
          'Refresher Exploration',
          'Algebra',
          'This is the most basic refresher exploration');
        general.getExplorationIdFromEditor().then(function(explorationId) {
          var refresherExplorationId = explorationId;

          browser.get('/explore/' + refresherExplorationId + '?parent=' +
            parentId1 + '&parent=' + parentId2);
          browser.waitForAngular();

          explorationPlayerPage.clickOnSummaryTileAtEnd();

          browser.getCurrentUrl().then(function(url) {
            var currentExplorationId = url.split('/')[4].split('?')[0];
            expect(currentExplorationId).toBe(parentId2);
          });

          explorationPlayerPage.clickOnSummaryTileAtEnd();

          browser.getCurrentUrl().then(function(url) {
            currentExplorationId = url.split('/')[4];
            expect(currentExplorationId).toBe(parentId1);
          });
        });
      });
    });
    users.logout();
  });

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
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('this is card 1'));
    explorationPlayerPage.submitAnswer('NumericInput', 19);
    explorationPlayerPage.submitAnswer('NumericInput', 21);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'return');
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 1'));
    explorationPlayerPage.submitAnswer('NumericInput', 21);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'complete');
    explorationPlayerPage.expectExplorationToBeOver();
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
      editor.setContent(forms.toRichText('card1 content'));

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
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/gui/second');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/settings');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/gui/second');

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
      // eslint-disable-next-line dot-notation
      editor.ResponseEditor(0).delete();

      // Setup a terminating state
      editor.moveToState('final card');
      editor.setInteraction('EndExploration');

      // Check that preview/editor switch doesn't change state
      editor.navigateToPreviewTab();
      explorationPlayerPage.expectExplorationToBeOver();
      editor.navigateToMainTab();
      editor.expectCurrentStateToBe('final card');
      editor.moveToState('second');

      // Check editor preview tab
      editor.navigateToPreviewTab();
      explorationPlayerPage.expectContentToMatch(function(richTextEditor) {
        richTextEditor.readItalicText('Welcome');
      });
      explorationPlayerPage.expectInteractionToMatch('NumericInput');
      explorationPlayerPage.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted group no longer applies.
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('Farewell'));
      explorationPlayerPage.clickThroughToNextCard();
      explorationPlayerPage.expectExplorationToBeOver();

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
      editor.setCategory('Algebra');
      editor.setObjective('To assess happiness.');
      editor.openAndClosePreviewSummaryTile();
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
      explorationPlayerPage.expectContentToMatch(
        forms.toRichText('How are you feeling?'));
      explorationPlayerPage.expectInteractionToMatch('TextInput');

      explorationPlayerPage.submitAnswer('TextInput', 'happy');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      explorationPlayerPage.submitAnswer('TextInput', 'meh, I\'m okay');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      explorationPlayerPage.submitAnswer('TextInput', 'NO I\'M SAD');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('No being sad!'));

      explorationPlayerPage.submitAnswer('TextInput', 'Fine...I\'m doing okay');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      // Finish the exploration.
      explorationPlayerPage.submitAnswer('TextInput', 'Whatever...');

      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('Okay, now this is just becoming annoying.'));
      explorationPlayerPage.clickThroughToNextCard();
      explorationPlayerPage.expectExplorationToBeOver();

      users.logout();
    });
  });

  it('should delete interactions cleanly', function() {
    users.createUser('user8@editorAndPlayer.com', 'user8EditorAndPlayer');
    users.login('user8@editorAndPlayer.com');
    workflow.createExploration();

    general.getExplorationIdFromEditor().then(function(explorationId) {
      editor.setContent(forms.toRichText('How are you feeling?'));
      editor.setInteraction('EndExploration');
      editor.setInteraction('TextInput');
      editor.addResponse(
        'TextInput', forms.toRichText('Happy!'), null, false, 'Equals',
        'happy');
      editor.setInteraction('EndExploration');
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
