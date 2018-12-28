// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the core features of the exploration
 * editor and player. Core features include the features without which an
 * exploration cannot be published. These include state content, answer groups,
 * oppia's feedback and customization_args.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Core exploration functionality', function() {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display plain text content', function() {
    users.createUser('user1@stateEditor.com', 'user1StateEditor');
    users.login('user1@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('plain text'));
    explorationEditorMainTab.setInteraction('Continue', 'click here');
    explorationEditorMainTab.getResponseEditor('default')
      .setDestination('final card', true, null);

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(forms.toRichText('plain text'));
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.expectInteractionToMatch('Continue', 'click here');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();
  });

  it('should create content and multiple choice interactions', function() {
    users.createUser('user2@stateEditor.com', 'user2StateEditor');
    users.login('user2@stateEditor.com');
    workflow.createExploration();
    explorationEditorMainTab.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendItalicText('italic text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', true, null);

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.expectInteractionToMatch(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'option B');
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('should obey numeric interaction rules and display feedback', function() {
    users.createUser('user3@stateEditor.com', 'user3StateEditor');
    users.login('user3@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse('NumericInput',
      function(richTextEditor) {
        richTextEditor.appendBoldText('correct');
      }, 'final card', true, 'IsInclusivelyBetween', -1, 3);
    explorationEditorMainTab.getResponseEditor(0).expectRuleToBe(
      'NumericInput', 'IsInclusivelyBetween', [-1, 3]);
    explorationEditorMainTab.getResponseEditor(0)
      .expectFeedbackInstructionToBe('correct');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('out of bounds'));
    explorationEditorMainTab.getResponseEditor('default')
      .expectFeedbackInstructionToBe('out of bounds');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      null, false, null);

    // Setup a terminating state.

    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.submitAnswer('NumericInput', 5);
    explorationPlayerPage.expectLatestFeedbackToMatch(
      forms.toRichText('out of bounds')
    );
    explorationPlayerPage.expectExplorationToNotBeOver();
    // It's important to test the value 0 in order to ensure that it would
    // still get submitted even though it is a falsy value in JavaScript.
    explorationPlayerPage.submitAnswer('NumericInput', 0);
    explorationPlayerPage.expectLatestFeedbackToMatch(
      function(richTextChecker) {
        richTextChecker.readBoldText('correct');
      });
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();
  });

  it('should skip the customization modal for interactions having no ' +
      'customization options', function() {
    users.createUser('user4@stateEditor.com', 'user4StateEditor');
    users.login('user4@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore the
    // customization modal and the save interaction button does not appear.
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.deleteInteraction();
    // The Continue input has customization options. Therefore the
    // customization modal does appear and so does the save interaction button.
    explorationEditorMainTab.setInteraction('Continue');

    users.logout();
  });

  it('should open appropriate modal on re-clicking an interaction to ' +
     'customize it', function() {
    users.createUser('user5@stateEditor.com', 'user5StateEditor');
    users.login('user5@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore, on
    // re-clicking, a modal opens up informing the user that this interaction
    // does not have any customization options. To dismiss this modal, user
    // clicks 'Okay' implying that he/she has got the message.
    explorationEditorMainTab.setInteraction('NumericInput');
    element(by.css('.protractor-test-interaction')).click();
    var okayBtn = element(
      by.css('.protractor-test-close-no-customization-modal'));
    expect(okayBtn.isPresent()).toBe(true);
    okayBtn.click();

    // Continue input has customization options. Therefore, on re-clicking, a
    // modal opens up containing the customization arguments for this input.
    // The user can dismiss this modal by clicking the 'Save Interaction'
    // button.
    explorationEditorMainTab.deleteInteraction();
    explorationEditorMainTab.setInteraction('Continue');
    element(by.css('.protractor-test-interaction')).click();
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(true);
    saveInteractionBtn.click();

    users.logout();
  });

  it('should correctly display contents, rule parameters, feedback' +
  ' instructions and newly created state', function() {
    users.createUser('stateEditorUser1@example.com', 'stateEditorUser1');
    users.login('stateEditorUser1@example.com');
    workflow.createExploration();
    // Verify exploration's text content.
    explorationEditorMainTab.setContent(forms.toRichText('Happiness Checker'));
    explorationEditorMainTab.expectContentToMatch(
      forms.toRichText('Happiness Checker'));
    // Verify interaction's details.
    explorationEditorMainTab.setInteraction('TextInput', 'How are you?', 5);
    explorationEditorMainTab.expectInteractionToMatch(
      'TextInput', 'How are you?', 5);
    // Verify rule parameter input by checking editor's response tab.
    // Create new state 'I am happy' for 'happy' rule.
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('You must be happy!'),
      'I am happy', true, 'FuzzyEquals', 'happy');
    explorationEditorMainTab.getResponseEditor(0).expectRuleToBe(
      'TextInput', 'FuzzyEquals', ['"happy"']);
    explorationEditorMainTab.getResponseEditor(0)
      .expectFeedbackInstructionToBe('You must be happy!');
    // Verify newly created state.
    explorationEditorMainTab.moveToState('I am happy');
    explorationEditorMainTab.expectCurrentStateToBe('I am happy');
    // Go back, create default response (try again) and verify response.
    explorationEditorMainTab.moveToState('Introduction');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('You cannot be sad!'),
      '(try again)', false, 'FuzzyEquals', 'sad');
    explorationEditorMainTab.getResponseEditor(1).expectRuleToBe(
      'TextInput', 'FuzzyEquals', ['"sad"']);
    explorationEditorPage.saveChanges();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
