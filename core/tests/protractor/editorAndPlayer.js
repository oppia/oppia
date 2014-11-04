// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Verson 2.0 (the "License");
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
    editor.selectWidget('Continue', 'click here');
    editor.editRule('default').setDestination('END');
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
    editor.setContent(function(handler) {
      handler.clear();
      handler.appendBoldText('bold text ');
      handler.appendItalicText('italic text ');
      handler.appendUnderlineText('underline text');
      handler.appendOrderedList(['entry 1', 'entry 2']);
      handler.appendUnorderedList(['an entry', 'another entry']);
    });
    editor.selectWidget(
      'MultipleChoiceInput', 
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    editor.editRule('default').setDestination('END');
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
    editor.selectWidget('NumericInput');
    editor.addNumericRule.IsInclusivelyBetween(3, 6);
    editor.editRule(0).setDestination('END');
    editor.editRule(0).editFeedback().editEntry(0, 'RichText').
      appendPlainText('correct');
    editor.editRule('default').editFeedback().editEntry(0, 'RichText').
      appendPlainText('out of bounds');
    editor.saveChanges();

    general.moveToPlayer();
    player.submitAnswer('NumericInput', 7);
    expect(player.getLatestFeedbackText()).toBe('out of bounds');
    player.expectExplorationToNotBeOver();
    player.submitAnswer('NumericInput', 4);
    expect(player.getLatestFeedbackText()).toBe('correct');
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
    editor.selectWidget('NumericInput');
    editor.addNumericRule.Equals(21);
    editor.editRule(0).setDestination('state 2');

    editor.moveToState('state 2');
    editor.setContent(forms.toRichText('this is state 2'));
    editor.selectWidget(
      'MultipleChoiceInput', 
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addMultipleChoiceRule.Equals('return');
    editor.editRule(0).setDestination('state 1');
    editor.editRule('default').setDestination('END');
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

    editor.setContent(function(handler) {
      handler.clear();
      handler.appendPlainText('plainly');
      handler.appendBoldText('bold');
      handler.addWidget('Collapsible', 'title', forms.toRichText('inner'));
      // TODO (Jacob) add image widget test
      handler.addWidget('Link', 'http://google.com/', true);
      handler.addWidget('Math', 'abc');
      handler.appendUnderlineText('underlined');
      handler.appendPlainText('extra');
      handler.addWidget('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      handler.addWidget('Video', 'ANeHmk22a6Q', 10, 100, false);
    })
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(checker) {
      checker.readPlainText('plainly');
      checker.readBoldText('bold');
      checker.readWidget('Collapsible', 'title', forms.toRichText('inner'));
      checker.readWidget('Link', 'http://google.com/', true);
      checker.readWidget('Math', 'abc');
      checker.readUnderlineText('underlined');
      checker.readPlainText('extra');
      checker.readWidget('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      checker.readWidget('Video', 'ANeHmk22a6Q', 10, 100, false);
    });

    users.logout();
  });

  it('should allow nesting of widgets inside one another', function() {
    users.createUser('user12@example.com', 'user12');
    users.login('user12@example.com')
    
    workflow.createExploration('widgets', 'maths');

    editor.setContent(function(handler) {
      handler.clear();
      handler.appendItalicText('slanted');
      handler.addWidget(
          'Collapsible', 'heading', function(handler2) {
        handler2.clear();
        // TODO (Jacob) add sub-widgets when issue 423 is fixed
        handler2.addWidget('Tabs', [{
          title: 'no1',
          content: function(handler3) {
            handler3.setPlainText('boring');
          }
        }, {
          title: 'no2',
          content: function(handler4) {
            handler4.clear();
            handler4.appendBoldText('fun!');
          }
        }]);
        handler2.addWidget('Math', 'xyz');
      });
    });
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(checker) {
      checker.readItalicText('slanted');
      checker.readWidget('Collapsible', 'heading', function(checker2) {
        checker2.readWidget('Tabs', [{
          title: 'no1',
          content: function(checker3) {
            checker3.readPlainText('boring');
          }
        }, {
          title: 'no2',
          content: function(checker4) {
            checker4.readBoldText('fun!');
          }
        }]); 
        checker2.readWidget('Math', 'xyz');
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