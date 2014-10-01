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
    editor.selectContinueWidget('click here');
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    expect(player.getCurrentQuestionText()).toBe('plain text');
    expect(player.getContinueButtonText()).toBe('click here');
    player.expectExplorationToNotBeOver();
    player.answerContinueWidget();
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should create content and working multiple choice widgets', function() {
    users.createUser('user2@example.com', 'user2');
    users.login('user2@example.com');

    workflow.createExploration('sums', 'maths');
    editor.editContent().open();
    editor.editContent().appendBoldText('bold text ');
    editor.editContent().appendItalicText('italic text ');
    editor.editContent().appendUnderlineText('underline text');
    editor.editContent().appendOrderedList(['entry 1', 'entry 2']);
    editor.editContent().appendUnorderedList(['an entry', 'another entry']);
    editor.editContent().close();

    editor.selectSimpleMultipleChoiceWidget(['option A', 'option B']);
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectExplorationToNotBeOver();
    expect(player.getMultipleChoiceOptions()).toEqual(['option A', 'option B']);
    player.answerMultipleChoiceWidget('option B');
    player.expectExplorationToBeOver();

    users.logout();
  });

  it('should respect numeric widget rules and display feedback', function() {
    users.createUser('user3@example.com', 'user3');
    users.login('user3@example.com');

    workflow.createExploration('sums', 'maths');
    editor.selectNumericWidget();
    editor.addNumericRule.IsInclusivelyBetween(3, 6);
    editor.editRule(0).setDestination('END');
    editor.editRule(0).editFeedback().editRichTextEntry(0).
      appendPlainText('correct');
    editor.editRule('default').editFeedback().editRichTextEntry(0).
      appendPlainText('out of bounds');
    editor.saveChanges();

    general.moveToPlayer();
    player.answerNumericWidget(7);
    expect(player.getLatestFeedbackText()).toBe('out of bounds');
    player.expectExplorationToNotBeOver();
    player.answerNumericWidget(4);
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
    editor.selectNumericWidget();
    editor.addNumericRule.Equals(21);
    editor.editRule(0).setDestination('state 2');

    editor.moveToState('state 2');
    editor.editContent().open();
    editor.editContent().setPlainText('this is state 2');
    editor.editContent().close();
    editor.selectSimpleMultipleChoiceWidget(['return', 'complete']);
    editor.addMultipleChoiceRule.Equals('return');
    editor.editRule(0).setDestination('state 1');
    editor.editRule('default').setDestination('END');
    editor.saveChanges();

    general.moveToPlayer();
    expect(player.getCurrentQuestionText()).toBe('this is state 1');
    player.answerNumericWidget(19);
    player.answerNumericWidget(21);
    expect(player.getCurrentQuestionText()).toBe('this is state 2');
    player.answerMultipleChoiceWidget('return');
    expect(player.getCurrentQuestionText()).toBe('this is state 1');
    player.answerNumericWidget(21);
    expect(player.getCurrentQuestionText()).toBe('this is state 2');
    player.expectExplorationToNotBeOver();
    player.answerMultipleChoiceWidget('complete');
    player.expectExplorationToBeOver();
  });
});