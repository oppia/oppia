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

describe('State editor', function() {
  it('should display plain text content', function() {
    users.createUser('user1@example.com', 'user1');
    users.login('user1@example.com');

    workflow.createExploration('sums', 'maths');
    editor.setContent(forms.toRichText('plain text'));
    editor.selectInteraction('Continue', 'click here');
    editor.RuleEditor('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText('plain text'));
    player.expectExplorationToNotBeOver();
    player.expectInteractionToMatch('Continue', 'click here');
    player.submitAnswer('Continue', null);
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should create content and working multiple choice widgets', function() {
    users.createUser('user2@example.com', 'user2');
    users.login('user2@example.com');

    workflow.createExploration('sums', 'maths');
    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text ');
      richTextEditor.appendItalicText('italic text ');
      richTextEditor.appendUnderlineText('underline text');
      richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    editor.selectInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    editor.RuleEditor('default').setDestination('END');
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

  it('should respect numeric widget rules and display feedback', function() {
    users.createUser('user3@example.com', 'user3');
    users.login('user3@example.com');

    workflow.createExploration('sums', 'maths');
    editor.selectInteraction('NumericInput');
    editor.addRule('NumericInput', 'IsInclusivelyBetween', [3, 6]);
    editor.RuleEditor(0).setDestination('END');
    editor.RuleEditor(0).editFeedback(0, function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    });
    editor.RuleEditor('default').
      editFeedback(0, forms.toRichText('out of bounds'));
    editor.saveChanges();

    general.moveToPlayer();
    player.submitAnswer('NumericInput', 7);
    player.expectLatestFeedbackToMatch(forms.toRichText('out of bounds'));
    player.expectExplorationToNotBeOver();
    player.submitAnswer('NumericInput', 4);
    player.expectLatestFeedbackToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('correct');
    });
    player.expectExplorationToBeOver();

    users.logout();
  });
});

describe('Full exploration editor', function() {
  it('should navigate multiple states correctly', function() {
    users.createUser('user4@example.com', 'user4');
    users.login('user4@example.com');

    workflow.createExploration('sums', 'maths');
    editor.setStateName('state 1');
    editor.setContent(forms.toRichText('this is state 1'));
    editor.selectInteraction('NumericInput');
    editor.addRule('NumericInput', 'Equals', [21]);
    editor.RuleEditor(0).setDestination('state 2');

    editor.moveToState('state 2');
    editor.setContent(forms.toRichText('this is state 2'));
    editor.selectInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addRule('MultipleChoiceInput', 'Equals', ['return']);
    editor.RuleEditor(0).setDestination('state 1');
    editor.RuleEditor('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText('this is state 1'));
    player.submitAnswer('NumericInput', 19);
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch(forms.toRichText('this is state 2'));
    player.submitAnswer('MultipleChoiceInput', 'return');
    player.expectContentToMatch(forms.toRichText('this is state 1'));
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch(forms.toRichText('this is state 2'));
    player.expectExplorationToNotBeOver();
    player.submitAnswer('MultipleChoiceInput', 'complete');
    player.expectExplorationToBeOver();
    users.logout();
  });

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
      editor.createState('state2');
      editor.expectStateNamesToBe(['state1', 'state2', 'END']);
      editor.discardChanges();
      editor.expectCurrentStateToBe(general.FIRST_STATE_DEFAULT_NAME);
      editor.setStateName('first');
      editor.expectStateNamesToBe(['first', 'END']);

      // Check deletion of states and changing the first state
      editor.createState('second');
      editor.expectStateNamesToBe(['first', 'second', 'END']);
      editor.expectCurrentStateToBe('second');
      // TODO (Jacob) remove the '' when issue 443 is fixed
      editor.expectAvailableFirstStatesToBe(['', 'first', 'second']);
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
      editor.selectInteraction('NumericInput');
      editor.expectInteractionToMatch('NumericInput');

      // Check deletion of rules
      editor.RuleEditor('default').
        editFeedback(0, forms.toRichText('Farewell'));
      editor.RuleEditor('default').
        expectAvailableDestinationsToBe(['second', 'END']);
      editor.RuleEditor('default').setDestination('END');
      editor.RuleEditor('default').
        expectAvailableDestinationsToBe(['second', 'END']);
      editor.addRule('NumericInput', 'IsGreaterThan', [2]);
      editor.RuleEditor(0).delete();

      // Check editor preview mode
      editor.enterPreviewMode();
      player.expectContentToMatch(function(richTextEditor) {
        richTextEditor.readItalicText('Welcome');
      });
      player.expectInteractionToMatch('NumericInput');
      player.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted rule no longer applies.
      player.expectLatestFeedbackToMatch(forms.toRichText('Farewell'));
      player.expectExplorationToBeOver();
      editor.exitPreviewMode();

      editor.discardChanges();
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Non-interactive widgets', function() {
  it('should display correctly', function() {
    users.createUser('user11@example.com', 'user11');
    users.login('user11@example.com')

    workflow.createExploration('widgets', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendPlainText('plainly');
      richTextEditor.appendBoldText('bold');
      richTextEditor.addWidget('Collapsible', 'title', forms.toRichText('inner'));
      // TODO (Jacob) add image widget test
      richTextEditor.addWidget('Link', 'http://google.com/', true);
      richTextEditor.addWidget('Math', 'abc');
      richTextEditor.appendUnderlineText('underlined');
      richTextEditor.appendPlainText('extra');
      richTextEditor.addWidget('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextEditor.addWidget('Video', 'ANeHmk22a6Q', 10, 100, false);
    })
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readPlainText('plainly');
      richTextChecker.readBoldText('bold');
      richTextChecker.readWidget('Collapsible', 'title', forms.toRichText('inner'));
      richTextChecker.readWidget('Link', 'http://google.com/', true);
      richTextChecker.readWidget('Math', 'abc');
      richTextChecker.readUnderlineText('underlined');
      richTextChecker.readPlainText('extra');
      richTextChecker.readWidget('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextChecker.readWidget('Video', 'ANeHmk22a6Q', 10, 100, false);
    });

    users.logout();
  });

  it('should allow nesting of widgets inside one another', function() {
    users.createUser('user12@example.com', 'user12');
    users.login('user12@example.com')

    workflow.createExploration('widgets', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendItalicText('slanted');
      richTextEditor.addWidget(
          'Collapsible', 'heading', function(collapsibleEditor) {
        // TODO (Jacob) add sub-widgets when issue 423 is fixed
        collapsibleEditor.addWidget('Tabs', [{
          title: 'no1',
          content: function(tab1Editor) {
            tab1Editor.setPlainText('boring');
          }
        }, {
          title: 'no2',
          content: function(tab2Editor) {
            tab2Editor.appendBoldText('fun!');
          }
        }]);
        collapsibleEditor.addWidget('Math', 'xyz');
      });
    });
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readItalicText('slanted');
      richTextChecker.readWidget(
          'Collapsible', 'heading', function(collapsibleChecker) {
        collapsibleChecker.readWidget('Tabs', [{
          title: 'no1',
          content: function(tab1Checker) {
            tab1Checker.readPlainText('boring');
          }
        }, {
          title: 'no2',
          content: function(tab2Checker) {
            tab2Checker.readBoldText('fun!');
          }
        }]);
        collapsibleChecker.readWidget('Math', 'xyz');
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
      'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED'
    ]);
  });
});
