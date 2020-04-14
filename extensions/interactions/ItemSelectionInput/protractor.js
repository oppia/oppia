// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end testing utilities for the Item Selection
 * interaction.
 */

var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');
var objects = require(process.cwd() + '/extensions/objects/protractor.js');
var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');

// 'elem' is the HTML element containing the input elements that set the rules
// of the item selection interaction.
// 'richTextInstructionsArray' is an array of functions, one for each option,
// each of which will each be passed a 'handler' that they can use to edit the
// rich-text area of the option, for example by
//    handler.appendUnderlineText('emphasised');
// 'maxSelectionAllowed' is the maximum number of selections to be allowed in
// this item selection interaction.
var customizeInteraction = function(
    elem, richTextInstructionsArray, maxSelectionAllowed) {
  objects.IntEditor(
    elem.all(by.repeater(
      'customizationArgSpec in customizationArgSpecs track by $index'))
      .filter(function(elem, index) {
        return elem.getText().then(function(text) {
          return text === 'Maximum number of selections permitted';
        });
      }).first()
  ).setValue(maxSelectionAllowed);

  forms.ListEditor(elem).setLength(richTextInstructionsArray.length);
  for (var i = 0; i < richTextInstructionsArray.length; i++) {
    var richTextEditor = forms.ListEditor(elem).editItem(i, 'RichText');
    richTextEditor.clear();
    richTextInstructionsArray[i](richTextEditor);
  }
};

// 'richTextInstructionsArray' is an array of functions, each of which describe
// how to check the expected details of one of the options (an example member
// function would be readPlainText).
var expectInteractionDetailsToMatch = function(
    elem, richTextInstructionsArray) {
  elem.all(by.repeater('choice in $ctrl.choices track by $index'))
    .then(function(optionElements) {
      expect(optionElements.length).toEqual(richTextInstructionsArray.length);
      for (var i = 0; i < optionElements.length; i++) {
        forms.expectRichText(optionElements[i].element(by.css(
          '.protractor-test-item-selection-option'
        ))).toMatch(richTextInstructionsArray[i]);
      }
    });
};

// type of object returned by interaction
var answerObjectType = 'SetOfHtmlString';

// 'elem' is the HTML element containing the form to submit the answer to.
// 'answer' is the array of item selection answer options to submit.
var submitAnswer = function(elem, answer) {
  var answerArray = Array.from(answer);

  for (var i = 0; i < answerArray.length; i++) {
    var desiredAnswer = answerArray[i];
    elem.element(by.cssContainingText(
      '.protractor-test-item-selection-input-item', desiredAnswer))
      .element(by.css(
        '.protractor-test-item-selection-input-checkbox')).click();
  }

  var submitAnswerButton = element(by.css(
    '.protractor-test-submit-answer-button'));
  waitFor.elementToBeClickable(submitAnswerButton,
    'Submit Answer button is not clickable');
  submitAnswerButton.click();
};

var interactionArgumentsArray = [
  [
    function(editor) {
      editor.appendBoldText('answer1');
    },
    function(editor) {
      editor.appendItalicText('answer2');
    },
    function(editor) {
      editor.appendPlainText('answer3');
    }
  ], 3];

var interactionDetailsArray = [
  [
    function(checker) {
      checker.readBoldText('answer1');
    },
    function(checker) {
      checker.readItalicText('answer2');
    },
    function(checker) {
      checker.readPlainText('answer3');
    }
  ]
];

var testSuite = [{
  interactionArguments: interactionArgumentsArray,
  ruleArguments: ['DoesNotContainAtLeastOneOf', ['answer1', 'answer2']],
  expectedInteractionDetails: interactionDetailsArray,
  wrongAnswers: [['answer1', 'answer2']],
  correctAnswers: [['answer3']]
}, {
  interactionArguments: interactionArgumentsArray,
  ruleArguments: ['Equals', ['answer1', 'answer2']],
  expectedInteractionDetails: interactionDetailsArray,
  wrongAnswers: [['answer1', 'answer3']],
  correctAnswers: [['answer1', 'answer2']]
}, {
  interactionArguments: interactionArgumentsArray,
  ruleArguments: ['IsProperSubsetOf', ['answer1', 'answer2']],
  expectedInteractionDetails: interactionDetailsArray,
  wrongAnswers: [['answer3'], ['answer1', 'answer2']],
  correctAnswers: [['answer1']]
}, {
  interactionArguments: interactionArgumentsArray,
  ruleArguments: ['ContainsAtLeastOneOf', ['answer1', 'answer2']],
  expectedInteractionDetails: interactionDetailsArray,
  wrongAnswers: [['answer3']],
  correctAnswers: [['answer2'], ['answer1', 'answer2']]
}
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
