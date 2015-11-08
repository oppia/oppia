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
    player.clickThroughToNextCard();
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

  it('should handle discarding changes, navigation, deleting states, ' +
      'changing the first state, displaying content, deleting responses and ' +
      'switching to preview mode', function() {
    users.createUser('user5@example.com', 'user5');
    users.login('user5@example.com');

    workflow.createExploration('sums', 'maths');
    general.getExplorationIdFromEditor().then(function(explorationId) {

      // Check discarding of changes
      editor.setStateName('card1');
      editor.expectStateNamesToBe(['card1']);
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
      editor.expectStateNamesToBe(['first']);

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
      player.clickThroughToNextCard();
      player.expectExplorationToBeOver();

      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

// NOTE: Gadgets are disabled by default. Enable when running gadget-specific
// integration tests.
xdescribe('Gadget editor', function() {
  it('should allow adding a gadget that is listed in the editor side panel ' +
       ' and visible in the player view.', function() {
    users.createUser('gadgetuser1@example.com', 'gadgetuser1');
    users.login('gadgetuser1@example.com');

    workflow.createExploration('sums', 'maths');

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText('gadget integration test.'));
    editor.setInteraction('EndExploration');

    // Setup a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    editor.addGadget(
      'ScoreBar', // type
      'Coconut Surplus', // name
      '9000', // maxValue
      'coconuts' // parameter to follow
    );

    editor.expectGadgetListNameToMatch(
      'ScoreBar', // type
      'Score Bar', // short_description
      'Coconut Surplus' // name
    );

    editor.saveChanges();
    general.moveToPlayer();

    player.expectGadgetToMatch(
      'ScoreBar',
      'Coconut Surplus',
      '9000',
      'coconuts'
    );

    users.logout();
  });

  it('should allow configuration of visibility settings, and properly ' +
      'render as visible or invisible as expected per state.' , function() {
    users.createUser('gadgetuser2@example.com', 'gadgetuser2');
    users.login('gadgetuser2@example.com');

    workflow.createExploration('sums', 'maths');

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText('gadget visibility integration test card 1.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'second', true);

    // Setup the second state
    editor.moveToState('second');
    editor.setContent(forms.toRichText('gadget visibility integration test card 2.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setContent(forms.toRichText('gadget visibility final card'));
    editor.setInteraction('EndExploration');
    editor.moveToState('first');

    // Add a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    editor.addGadget(
      'ScoreBar', // type
      'CoconutSurplus', // name
      '9000', // maxValue
      'coconuts' // parameter to follow
    );

    // Edit visibility
    editor.openGadgetEditorModal('CoconutSurplus');
    editor.enableGadgetVisibilityForState('final card');
    editor.saveAndCloseGadgetEditorModal();

    editor.saveChanges();
    general.moveToPlayer();

    player.expectVisibleGadget('ScoreBar');
    player.submitAnswer('Continue', null);
    general.waitForSystem(2000);

    player.expectInvisibleGadget('ScoreBar');
    player.submitAnswer('Continue', null);
    general.waitForSystem(2000);

    player.expectVisibleGadget('ScoreBar');
    users.logout();

  });

  // This test inspects within the editor view since gadget names only exist
  // to help authors differentiate between gadgets, and are not visible in the
  // player view.
  it('should allow renaming and deleting gadgets', function() {
    users.createUser('gadgetuser3@example.com', 'gadgetuser3');
    users.login('gadgetuser3@example.com');

    workflow.createExploration('sums', 'maths');

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText('gadget integration test card 1.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'second', true);

    // Add a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    editor.addGadget(
      'ScoreBar', // type
      'CoconutSurplus', // name
      '9000', // maxValue
      'coconuts' // parameter to follow
    );

    editor.renameGadget('CoconutSurplus', 'SuperCoconuts');

    editor.expectGadgetListNameToMatch(
      'ScoreBar', // type
      'Score Bar', // short_description
      'SuperCoconuts' // name
    );

    editor.deleteGadget('SuperCoconuts');
    editor.expectGadgetWithNameDoesNotExist('SuperCoconuts');

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
      richTextEditor.addRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
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
    })
    editor.setInteraction('TextInput');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('bold');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
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
    });


    users.logout();
  });

  it('should allow nesting of RTE components inside one another', function() {
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

describe('Exploration history', function() {
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

    // Compare a version to itself (just contains first node)
    editor.expectGraphComparisonOf(1, 1).toBe([
      {'label': general.FIRST_STATE_DEFAULT_NAME, 'color': COLOR_UNCHANGED}
    ], [0, 0, 0]);

    // Check renaming state, editing text, editing interactions and adding state
    editor.moveToState(general.FIRST_STATE_DEFAULT_NAME);
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
      1: {text: 'content:', highlighted: false},
      2: {text: '- type: text', highlighted: false},
      3: {text: '  value: <p>enter 6 to continue</p>', highlighted: true},
      4: {text: 'interaction:', highlighted: false},
      5: {text: '  answer_groups:', highlighted: true},
      6: {text: '  - outcome:', highlighted: true},
      7: {text: '      dest: second', highlighted: true},
      8: {text: '      feedback: []', highlighted: true},
      9: {text: '      param_changes: []', highlighted: true},
      10: {text: '    rule_specs:', highlighted: true},
      11: {text: '    - inputs:', highlighted: true},
      12: {text: '        x: 6.0', highlighted: true},
      13: {text: '      rule_type: Equals', highlighted: true},
      14: {text: '  confirmed_unclassified_answers: []', highlighted: false},
      15: {text: '  customization_args: {}', highlighted: false},
      16: {text: '  default_outcome:', highlighted: false},
      17: {text: '    dest: first', highlighted: true},
      18: {text: '    feedback: []', highlighted: false},
      19: {text: '    param_changes: []', highlighted: false},
      20: {text: '  fallbacks: []', highlighted: false},
      21: {text: '  id: NumericInput', highlighted: true},
      22: {text: 'param_changes: []', highlighted: false},
      23: {text: ' ', highlighted: false}
    };
    var VERSION_2_STATE_1_CONTENTS = {
      1: {text: 'content:', highlighted: false},
      2: {text: '- type: text', highlighted: false},
      3: {text: '  value: \'\'', highlighted: true},
      4: {text: 'interaction:', highlighted: false},
      5: {text: '  answer_groups: []', highlighted: true},
      6: {text: '  confirmed_unclassified_answers: []', highlighted: false},
      7: {text: '  customization_args: {}', highlighted: false},
      8: {text: '  default_outcome:', highlighted: false},
      // Note that highlighting *underneath* a line is still considered a
      // highlight.
      9: {
        text: '    dest: ' + general.FIRST_STATE_DEFAULT_NAME,
        highlighted: true
      },
      10: {text: '    feedback: []', highlighted: false},
      11: {text: '    param_changes: []', highlighted: false},
      12: {text: '  fallbacks: []', highlighted: false},
      13: {text: '  id: null', highlighted: true},
      14: {text: 'param_changes: []', highlighted: false},
      15: {text: ' ', highlighted: false}
    };
    var STATE_2_STRING =
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

    editor.expectGraphComparisonOf(1, 2).toBe([
      {'label': 'first (was: First ...', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'final card', 'color': COLOR_ADDED}
    ], [2, 2, 0]);
    editor.expectTextComparisonOf(1, 2, 'first (was: First ...')
      .toBeWithHighlighting(VERSION_1_STATE_1_CONTENTS, VERSION_2_STATE_1_CONTENTS);
    editor.expectTextComparisonOf(1, 2, 'second')
      .toBe(STATE_2_STRING, ' ');

    // Switching the 2 compared versions should give the same result.
    editor.expectGraphComparisonOf(2, 1).toBe([
      {'label': 'first (was: First ...', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'final card', 'color': COLOR_ADDED}
    ], [2, 2, 0]);

    // Check deleting a state
    editor.deleteState('second');
    editor.moveToState('first');
    editor.ResponseEditor(0).setDestination('final card', false);
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 3).toBe([
      {'label': 'first', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_DELETED},
      {'label': 'final card', 'color': COLOR_UNCHANGED}
    ], [3, 1, 2]);
    editor.expectTextComparisonOf(2, 3, 'second')
      .toBe(' ', STATE_2_STRING);

    // Check renaming a state
    editor.moveToState('first');
    editor.setStateName('third');
    editor.saveChanges();
    editor.expectGraphComparisonOf(3, 4).toBe([
      {'label': 'third (was: first)', 'color': COLOR_RENAMED_UNCHANGED},
      {'label': 'final card', 'color': COLOR_UNCHANGED}
    ], [1, 0, 0]);

    // Check re-inserting a deleted state
    editor.moveToState('third');
    editor.ResponseEditor(0).setDestination('second', true);
    editor.moveToState('second');
    editor.setContent(forms.toRichText('this is card 2'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'final card', false);
    editor.saveChanges();

    editor.expectGraphComparisonOf(2, 5).toBe([
      {'label': 'third (was: first)', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_UNCHANGED},
      {'label': 'final card', 'color': COLOR_UNCHANGED}
    ], [2, 0, 0]);

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
    editor.expectGraphComparisonOf(4, 6).toBe([
      {'label': 'first (was: third)', 'color': COLOR_CHANGED},
      {'label': 'second', 'color': COLOR_ADDED},
      {'label': 'final card', 'color': COLOR_UNCHANGED}
    ], [3, 2, 1]);

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
