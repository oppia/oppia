// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * interaction in webdriverio.
 */

var forms = require(process.cwd() + '/core/tests/webdriverio_utils/forms.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);
var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');

// 'elem' is the HTML element containing the input elements that set the rules
// of the item selection interaction.
// 'richTextInstructionsArray' is an array of functions, one for each option,
// each of which will each be passed a 'handler' that they can use to edit the
// rich-text area of the option, for example by
//    handler.appendUnderlineText('emphasised');
// 'maxSelectionAllowed' is the maximum number of selections to be allowed in
// this item selection interaction.
var customizeInteraction = async function (
  elem,
  richTextInstructionsArray,
  maxSelectionAllowed
) {
  await objects
    .IntEditor(
      $$('.e2e-test-multiple-options').filter(async function (elem, index) {
        var text = await elem.getText();
        return text === 'Maximum number of selections permitted';
      })[0]
    )
    .setValue(maxSelectionAllowed);

  await forms.ListEditor(elem).setLength(richTextInstructionsArray.length);
  for (var i = 0; i < richTextInstructionsArray.length; i++) {
    var richTextEditor = await forms.ListEditor(elem).editItem(i, 'RichText');
    await richTextEditor.clear();
    await richTextInstructionsArray[i](richTextEditor);
  }
};

// 'richTextInstructionsArray' is an array of functions, each of which describe
// how to check the expected details of one of the options (an example member
// function would be readPlainText).
var expectInteractionDetailsToMatch = async function (
  elem,
  richTextInstructionsArray
) {
  var optionElements = await elem.$$(
    '.e2e-test-item-selection-input-container'
  );
  var optionsCount = optionElements.length;
  expect(optionsCount).toEqual(richTextInstructionsArray.length);
  for (var i = 0; i < optionsCount; i++) {
    await forms
      .expectRichText(optionElements[i].$('.e2e-test-item-selection-option'))
      .toMatch(richTextInstructionsArray[i]);
  }
};

// Type of object returned by interaction.
var answerObjectType = 'SetOfHtmlString';

// 'elem' is the HTML element containing the form to submit the answer to.
// 'answer' is the array of item selection answer options to submit.
var submitAnswer = async function (elem, answer) {
  var answerArray = Array.from(answer);

  for (var i = 0; i < answerArray.length; i++) {
    var desiredAnswer = answerArray[i];
    var selectionInputItem = await elem
      .$(`.e2e-test-item-selection-input-item*=${desiredAnswer}`)
      .$('.e2e-test-item-selection-input-checkbox');
    await action.click('Selection Input Item', selectionInputItem);
  }

  var submitAnswerButton = $('.e2e-test-submit-answer-button');
  await waitFor.elementToBeClickable(
    submitAnswerButton,
    'Submit Answer button is not clickable'
  );
  await action.click('Submit answer button', submitAnswerButton);
};

var interactionArgumentsArray = [
  [
    async function (editor) {
      await editor.appendBoldText('answer1');
    },
    async function (editor) {
      await editor.appendItalicText('answer2');
    },
    async function (editor) {
      await editor.appendPlainText('answer3');
    },
  ],
  3,
];

var interactionDetailsArray = [
  [
    async function (checker) {
      await checker.readBoldText('answer1');
    },
    async function (checker) {
      await checker.readItalicText('answer2');
    },
    async function (checker) {
      checker.readPlainText('answer3');
    },
  ],
];

var testSuite = [
  {
    interactionArguments: interactionArgumentsArray,
    ruleArguments: ['DoesNotContainAtLeastOneOf', ['answer1', 'answer2']],
    expectedInteractionDetails: interactionDetailsArray,
    wrongAnswers: [['answer1', 'answer2']],
    correctAnswers: [['answer3']],
  },
  {
    interactionArguments: interactionArgumentsArray,
    ruleArguments: ['Equals', ['answer1', 'answer2']],
    expectedInteractionDetails: interactionDetailsArray,
    wrongAnswers: [['answer1', 'answer3']],
    correctAnswers: [['answer1', 'answer2']],
  },
  {
    interactionArguments: interactionArgumentsArray,
    ruleArguments: ['IsProperSubsetOf', ['answer1', 'answer2']],
    expectedInteractionDetails: interactionDetailsArray,
    wrongAnswers: [['answer3'], ['answer1', 'answer2']],
    correctAnswers: [['answer1']],
  },
  {
    interactionArguments: interactionArgumentsArray,
    ruleArguments: ['ContainsAtLeastOneOf', ['answer1', 'answer2']],
    expectedInteractionDetails: interactionDetailsArray,
    wrongAnswers: [['answer3']],
    correctAnswers: [['answer2'], ['answer1', 'answer2']],
  },
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
