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
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('State editor', function() {
  it('should display plain text content', function() {
    users.createUser('user1@example.com', 'user1');
    users.login('user1@example.com');

    workflow.createExploration('sums', 'maths');
    editor.editContent().open();
    editor.editContent().setPlainText('plain text');
    editor.editContent().close();
    editor.selectWidget('Continue', 'click here');
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch('plain text');
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
    editor.editContent().open();
    editor.editContent().clear();
    editor.editContent().appendBoldText('bold text ');
    editor.editContent().appendItalicText('italic text ');
    editor.editContent().appendUnderlineText('underline text');
    editor.editContent().appendOrderedList(['entry 1', 'entry 2']);
    editor.editContent().appendUnorderedList(['an entry', 'another entry']);
    editor.editContent().close();

    editor.selectWidget('MultipleChoiceInput', ['option A', 'option B']);
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectExplorationToNotBeOver();
    player.expectInteractionToMatch(
      'MultipleChoiceInput', ['option A', 'option B']);
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
    editor.editContent().open();
    editor.editContent().setPlainText('this is state 1');
    editor.editContent().close();
    editor.selectWidget('NumericInput');
    editor.addNumericRule.Equals(21);
    editor.editRule(0).setDestination('state 2');

    editor.moveToState('state 2');
    editor.editContent().open();
    editor.editContent().setPlainText('this is state 2');
    editor.editContent().close();
    editor.selectWidget('MultipleChoiceInput', ['return', 'complete']);
    editor.addMultipleChoiceRule.Equals('return');
    editor.editRule(0).setDestination('state 1');
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch('this is state 1');
    player.submitAnswer('NumericInput', 19);
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch('this is state 2');
    player.submitAnswer('MultipleChoiceInput', 'return');
    player.expectContentToMatch('this is state 1');
    player.submitAnswer('NumericInput', 21);
    player.expectContentToMatch('this is state 2');
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

    editor.editContent().open();
    editor.editContent().clear();
    editor.editContent().appendPlainText('plainly');
    editor.editContent().appendBoldText('bold');
    editor.editContent().addWidget('Collapsible', 'title', 'inner');
    // TODO (Jacob) add image widget test
    editor.editContent().addWidget('Link', 'http://google.com/', true);
    editor.editContent().addWidget('Math', 'abc');
    editor.editContent().appendUnderlineText('underlined');
    editor.editContent().appendPlainText('extra');
    editor.editContent().addWidget(
      'Tabs', ['title 1', 'title 2'], ['contents 1', 'contents 2']);
    editor.editContent().addWidget('Video', 'ANeHmk22a6Q', 10, 100, false);
    editor.editContent().close();

    editor.saveChanges();

    general.moveToPlayer();
    player.expectComplexContentToMatch(function(checker) {
      checker.readPlainText('plainly');
      checker.readBoldText('bold');
      checker.readWidget('Collapsible', 'title', 'inner');
      checker.readWidget('Link', 'http://google.com/', true);
      checker.readWidget('Math', 'abc');
      checker.readUnderlineText('underlined');
      checker.readPlainText('extra');
      checker.readWidget(
        'Tabs', ['title 1', 'title 2'], ['contents 1', 'contents 2']);
      checker.readWidget('Video', 'ANeHmk22a6Q', 10, 100, false)
    });

    users.logout();
  });

  it('should allow nesting of widgets inside one another', function() {
    users.createUser('user12@example.com', 'user12');
    users.login('user12@example.com')
    
    workflow.createExploration('widgets', 'maths');

    editor.editContent().open();
    editor.editContent().clear();
    editor.editContent().appendItalicText('slanted');
    editor.editContent().addComplexWidget(
        'Collapsible', 'heading', function(handler) {
      handler.clear();
      // TODO (Jacob) add sub-widgets when issue 423 is fixed
      handler.addComplexWidget('Tabs', ['no1', 'no2'], [function(handler2) {
        handler2.setPlainText('boring');
      }, function(handler3) {
        handler3.clear();
        handler3.appendBoldText('fun!');
      }])
      handler.addWidget('Math', 'xyz');
    });
    editor.editContent().close();

    editor.saveChanges();

    general.moveToPlayer();
    player.expectComplexContentToMatch(function(checker) {
      checker.readItalicText('slanted');
      checker.readComplexWidget('Collapsible', 'heading', function(handler) {
        handler.readComplexWidget('Tabs', ['no1', 'no2'], [function(handler2) {
          handler2.readPlainText('boring');
        }, function(handler3) {
          handler3.readBoldText('fun!');
        }])
        handler.readWidget('Math', 'xyz');
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