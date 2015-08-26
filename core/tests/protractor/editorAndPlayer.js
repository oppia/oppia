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
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');
var interactions = require('../../../extensions/interactions/protractor.js');

describe('State editor', function() {
  it('should display plain text content', function() {
    users.createUser('user1@example.com', 'user1');
    users.login('user1@example.com');

    workflow.createExploration('sums', 'maths');
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

  it('should walk through the tutorial when user repeatedly clicks Next', function() {
    var NUM_TUTORIAL_STAGES = 5;
    users.createUser('user@example.com', 'user');
    users.login('user@example.com');

    workflow.createExplorationAndStartTutorial('sums', 'maths');
    for (var i = 0; i < NUM_TUTORIAL_STAGES - 1; i++) {
      editor.progressInTutorial();
    }
    editor.finishTutorial();
    users.logout();
  });

  it('should create content and multiple choice interactions', function() {
    users.createUser('user2@example.com', 'user2');
    users.login('user2@example.com');

    workflow.createExploration('sums', 'maths');
    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendItalicText('italic text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendUnderlineText('underline text');
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
    users.createUser('user3@example.com', 'user3');
    users.login('user3@example.com');

    workflow.createExploration('sums', 'maths');
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
    player.expectExplorationToBeOver();

    users.logout();
  });
});

describe('Full exploration editor', function() {
  it('should navigate multiple states correctly, with parameters', function() {
    users.createUser('user4@example.com', 'user4');
    users.login('user4@example.com');

    workflow.createExploration('sums', 'maths');
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

  it('should handle multiple rules in an answer group and also disallow ' +
      'editing of a read-only exploration', function() {
    users.createUser('user6@example.com', 'user6');
    users.createUser('user7@example.com', 'user7');
    users.login('user6@example.com');

    workflow.createExploration('sums', 'maths');

    general.getExplorationIdFromEditor().then(function(explorationId) {
      // Create an exploration with multiple groups.
      editor.setStateName('first card');
      editor.setContent(forms.toRichText('How are you feeling?'));
      editor.setInteraction('TextInput');
      editor.addResponse('TextInput', forms.toRichText('You must be happy!'),
        'first card', false, 'Equals', 'happy');
      editor.addResponse('TextInput', forms.toRichText('No being sad!'),
        'first card', false, 'Contains', 'sad');
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
      editor.setObjective('To assess happiness.');
      editor.saveChanges();
      workflow.publishExploration();

      // Login as another user and verify that the exploration editor does not
      // allow the second user to modify the exploration.
      users.logout();
      users.login('user7@example.com');
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
      player.expectExplorationToBeOver();

      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('rich-text components', function() {
  it('should display correctly', function() {
    users.createUser('user11@example.com', 'user11');
    users.login('user11@example.com')

    workflow.createExploration('RTE components', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold');
      richTextEditor.appendPlainText(' ');
      // TODO (Jacob) add test for image RTE component
      richTextEditor.addRteComponent('Link', 'http://google.com/', true);
      richTextEditor.addRteComponent('Math', 'abc');
      richTextEditor.addRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextEditor.addRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
      richTextEditor.addRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
    })
    editor.setInteraction('TextInput');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('bold');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent('Link', 'http://google.com/', true);
      richTextChecker.readRteComponent('Math', 'abc');
      richTextChecker.readRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextChecker.readRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
      richTextChecker.readRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
    });

    users.logout();
  });

  it('should allow rich text inside extensions', function() {
    users.createUser('user12@example.com', 'user12');
    users.login('user12@example.com')

    workflow.createExploration('RTE components', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendItalicText('slanted');
      richTextEditor.appendPlainText(' ');
      richTextEditor.addRteComponent(
          'Collapsible', 'heading', function(collapsibleEditor) {
        collapsibleEditor.appendBoldText('boldtext');
        collapsibleEditor.appendPlainText(' ');
        collapsibleEditor.addRteComponent('Math', 'xyz');
      });
    });

    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readItalicText('slanted');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent(
          'Collapsible', 'heading', function(collapsibleChecker) {
        collapsibleChecker.readBoldText('boldtext');
        collapsibleChecker.readPlainText(' ');
        collapsibleChecker.readRteComponent('Math', 'xyz');
      });
    });

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO (Jacob) Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'chrome-extension://boadgeojelhgndaghljhdicfkmllpafd/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://dliochdbjfkdbacpmhlcpmleaejidimm/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://eojlgccfgnjlphjnlopmadngcgmmdgpk/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://hfaagokkkhdbgiakmmlclaapfelnkoah/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://enhhojjnijigcajfphajepfemndkmdlo/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://eojlgccfgnjlphjnlopmadngcgmmdgpk/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED'
    ]);
  });
});

describe('Interactions', function() {
  it('should pass their own test suites', function() {
    users.createUser('interactions@example.com', 'interactions');
    users.login('interactions@example.com');
    workflow.createExploration('interactions', 'interactions');
    editor.setStateName('first');
    editor.setContent(forms.toRichText('some content'));

    var defaultOutcomeSet = false;

    for (var interactionId in interactions.INTERACTIONS) {
      var interaction = interactions.INTERACTIONS[interactionId];
      for (var i = 0; i < interaction.testSuite.length; i++) {
        var test = interaction.testSuite[i];

        editor.setInteraction.apply(
          null, [interactionId].concat(test.interactionArguments));

        editor.addResponse.apply(null, [
          interactionId, forms.toRichText('yes'), 'first', false
        ].concat(test.ruleArguments));

        if (!defaultOutcomeSet) {
          // The default outcome will be preserved for subsequent tests.
          editor.setDefaultOutcome(forms.toRichText('no'), null, false);
          defaultOutcomeSet = true;
        }

        editor.navigateToPreviewTab();
        player.expectInteractionToMatch.apply(
          null, [interactionId].concat(test.expectedInteractionDetails));
        for (var j = 0; j < test.wrongAnswers.length; j++) {
          player.submitAnswer(interactionId, test.wrongAnswers[j]);
          player.expectLatestFeedbackToMatch(forms.toRichText('no'));
        }
        for (var j = 0; j < test.correctAnswers.length; j++) {
          player.submitAnswer(interactionId, test.correctAnswers[j]);
          player.expectLatestFeedbackToMatch(forms.toRichText('yes'));
        }
        editor.navigateToMainTab();
      }
    }

    editor.discardChanges();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
