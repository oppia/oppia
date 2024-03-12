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
 * @fileoverview End-to-end testing utilities for the Pencil Code
 * Editor in webdriverio..
 */

var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);
var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');

var customizeInteraction = async function (interactionEditor, placeHolderText) {
  await browser.execute(
    "var editor = $('schema-based-editor .CodeMirror')[0].CodeMirror;" +
      "editor.setValue('" +
      placeHolderText +
      "');"
  );
};

var expectInteractionDetailsToMatch = async function (elem, placeHolderText) {
  expect(await elem.$('.CodeMirror').isExisting()).toBe(true);
  // The \n must be included in the check because the editor inserts a newline.
  // For testing purposes it is required that the order of
  // the quotes is single-quotes within double-quotes.
  var testValue = await browser.execute(
    "var elem = $('.e2e-test-preview-tab .CodeMirror')[0]" +
      '.CodeMirror;return elem.getValue()'
  );
  expect(testValue).toEqual(placeHolderText + '\n');
};

var submitAnswer = async function (conversationInput, answerCode) {
  if (answerCode) {
    await browser.execute(
      "var elem = $('.e2e-test-preview-tab .CodeMirror')[0]" +
        ".CodeMirror;elem.setValue('" +
        answerCode +
        "');"
    );
  }
  await browser.execute('window.scrollTo(0,500);');
  var submitAnswerButton = $('.e2e-test-submit-answer-button');
  await waitFor.elementToBeClickable(
    submitAnswerButton,
    'Submit Answer button is not clickable'
  );
  await action.click('Submit Answer Button', submitAnswerButton);
};

var answerObjectType = 'CodeString';

var testSuite = [
  {
    interactionArguments: ['# You can enter the Code below'],
    ruleArguments: ['CodeEquals', 'print("Hello World")'],
    expectedInteractionDetails: ['# You can enter the Code below'],
    // For testing purposes it is required that the order of
    // the quotes is double-quotes within single-quotes.
    wrongAnswers: ['print("Hello")'],
    correctAnswers: ['print("Hello World")'],
  },
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
