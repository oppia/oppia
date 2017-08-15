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
    }
  );

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

  it('should skip the customization modal for interactions having no ' +
      'customization options', function() {
    users.createUser('user4@stateEditor.com', 'user4StateEditor');
    users.login('user4@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore the
    // customization modal and the save interaction button does not appear.
    editor.openInteraction('NumericInput');
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(false);

    element(by.css('.protractor-test-close-add-response-modal')).click();

    // The Continue input has customization options. Therefore the
    // customization modal does appear and so does the save interaction button.
    editor.openInteraction('Continue');
    expect(saveInteractionBtn.isPresent()).toBe(true);
    users.logout();
  });

  it('should open appropriate modal on re-clicking an interaction to ' +
     'customize it', function() {
    users.createUser('user5@stateEditor.com', 'user5StateEditor');
    users.login('user5@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore, on
    // re-clicking, a modal opens up informing the user that this interaction
    // does not have any customization options. To dismiss this modal, user
    // clicks 'Okay' implying that he/she has got the message.
    editor.setInteraction('NumericInput');
    element(by.css('.protractor-test-interaction')).click();
    var okayBtn = element(
      by.css('.protractor-test-close-no-customization-modal'));
    expect(okayBtn.isPresent()).toBe(true);
    okayBtn.click();

    // Continue input has customization options. Therefore, on re-clicking, a
    // modal opens up containing the customization arguments for this input.
    // The user can dismiss this modal by clicking the 'Save Interaction'
    // button.
    editor.setInteraction('Continue');
    element(by.css('.protractor-test-interaction')).click();
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(true);
    saveInteractionBtn.click();

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

  it('should add/modify/delete a hint', function() {
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
    editor.addHint('hint one');
    editor.HintEditor(0).setHint('modified hint one');
    editor.HintEditor(0).deleteHint();
    editor.saveChanges();
    users.logout();
  });

  it('should add a solution', function() {
    users.login('stateEditorUser1@example.com');
    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    editor.openInteraction('TextInput');
    editor.customizeInteraction('TextInput', 'My PlaceHolder', 2);
    editor.addResponse('TextInput', function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    }, 'final card', true, 'Equals', 'Some Text');

    editor.addHint('hint one');
    editor.addSolution('TextInput', {
      answerIsExclusive: true,
      correctAnswer: 'Some Text',
      explanation: 'sample explanation'
    });

    editor.saveChanges();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
