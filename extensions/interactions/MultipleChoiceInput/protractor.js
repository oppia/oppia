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
 * @fileoverview End-to-end testing utilities for the Multiple Choice
 * interaction.
 */

var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');


// The members of richTextInstructionsArray are functions, one for each option,
// which will each be passed a 'handler' that they can use to edit the
// rich-text area of the option, for example by
//   handler.appendUnderlineText('emphasised');
// The second arguement(optional) editInstructions is used to edit the
// interaction after its creation. The editInstructions contains two elements,
// the first is a command('edit', 'delete', 'add') and second element is the
// index of the object to be edited or deleted. In the case of 'add',
// the editInstructions has only one element.
var customizeInteraction = function(
    elem, richTextInstructionsArray, editInstructions) {
  if (editInstructions === undefined) {
    forms.ListEditor(elem).setLength(richTextInstructionsArray.length);
    for (var i = 0; i < richTextInstructionsArray.length; i++) {
      var richTextEditor = forms.ListEditor(elem).editItem(i, 'RichText');
      richTextEditor.clear();
      richTextInstructionsArray[i](richTextEditor);
    }
  } else {
    if (editInstructions[0] === 'delete') {
      if (richTextInstructionsArray === null) {
        elem.all(by.repeater('item in localValue track by $index')).count().
          then(
            function(length) {
              if (editInstructions[1] < length) {
                forms.ListEditor(elem).deleteItem(editInstructions[1]);
              } else {
                throw Error('The given index is invalid.');
              }
            });
      } else {
        throw Error('richTextInstructionsArray should be null.');
      }
    } else if (editInstructions[0] === 'add') {
      if (richTextInstructionsArray !== null &&
            richTextInstructionsArray.length === 1) {
        var richTextEditor = forms.ListEditor(elem).addItem('RichText');
        richTextEditor.clear();
        richTextInstructionsArray[0](richTextEditor);
      } else {
        throw Error(
          'richTextInstructionsArray should have only one element.');
      }
    } else if (editInstructions[0] === 'edit') {
      if (
        richTextInstructionsArray !== null &&
          richTextInstructionsArray.length === 1) {
        elem.all(by.repeater('item in localValue track by $index')).count().
          then(
            function(length) {
              if (editInstructions[1] < length) {
                var richTextEditor = forms.ListEditor(elem).editItem(
                  editInstructions[1], 'RichText');
                richTextEditor.clear();
                richTextInstructionsArray[0](richTextEditor);
              } else {
                throw Error('The given index is invalid.');
              }
            });
      } else {
        throw Error(
          'richTextInstructionsArray should have only one element.');
      }
    }
  }
};

// These members of richTextInstructionsArray each describe how to check one of
// the options.
var expectInteractionDetailsToMatch = function(
    elem, richTextInstructionsArray) {
  elem.all(by.repeater('choice in $ctrl.choices track by $index'))
    .then(function(optionElements) {
      expect(optionElements.length).toEqual(richTextInstructionsArray.length);
      for (var i = 0; i < optionElements.length; i++) {
        forms.expectRichText(optionElements[i].element(by.css(
          '.protractor-test-multiple-choice-option'
        ))).toMatch(richTextInstructionsArray[i]);
      }
    });
};

// 'elem' is the HTML element containing the form to submit the answer to.
// 'answer' {String} is the text on the multiple-choice item to select.
var submitAnswer = function(elem, answer) {
  elem.element(by.tagName('oppia-interactive-multiple-choice-input')).
    element(by.buttonText(answer)).click();
};

var answerObjectType = 'NonnegativeInt';

var testSuite = [{
  interactionArguments: [[function(editor) {
    editor.appendBoldText('right');
  }, function(editor) {
    editor.appendItalicText('wrong');
  }]],
  ruleArguments: ['Equals', ['right']],
  expectedInteractionDetails: [[function(checker) {
    checker.readBoldText('right');
  }, function(checker) {
    checker.readItalicText('wrong');
  }]],
  wrongAnswers: ['wrong'],
  correctAnswers: ['right']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
