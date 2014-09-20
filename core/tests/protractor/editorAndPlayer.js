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
 * @fileoverview End-to-end tests of the interaction between the player and editor
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Editing content', function() {
  it('should display plain text content', function() {
    users.createUser('user1@example.com', 'user1');
    users.login('user1@example.com');
    workflow.createExploration('sums', 'maths');

    editor.editContent().open();
    editor.editContent().appendPlainText('plain text');
    editor.editContent().close();
    editor.selectContinueWidget('click here');
    editor.editRule('default').setDestination('END');

    editor.saveChanges().then(function() {
      workflow.moveToPlayer();
      expect(player.getCurrentQuestionText()).toBe('plain text');
      player.expectExplorationToNotBeOver();
      player.answerContinueWidget();
      player.expectExplorationToBeOver();
    });

    users.logout();
  });

  it('should create content and functioning multiple choice widgets', function() {
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

    editor.editRule('default').editFeedback().editRichTextEntry(0).
      appendPlainText('wrong');

    editor.editRule('default').setDestination('END');

    editor.saveChanges().then(function() {
      workflow.moveToPlayer();
      player.expectExplorationToNotBeOver();
      player.answerMultipleChoiceWidget('option B');
      player.expectExplorationToBeOver();
    });

    users.logout();
  });
});