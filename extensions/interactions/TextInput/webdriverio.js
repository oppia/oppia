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
 * @fileoverview End-to-end testing utilities for the Text interaction
 *  in webdriverio.
 */

var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);
var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');

var customizeInteraction = async function (elem, placeholderText, heightOfBox) {
  await objects
    .UnicodeStringEditor(await elem.$('<schema-based-unicode-editor>'))
    .setValue(placeholderText);
  await objects
    .IntEditor(await elem.$('<schema-based-int-editor>'))
    .setValue(heightOfBox);
};

var expectInteractionDetailsToMatch = async function (
  elem,
  placeholderText,
  heightOfBox
) {
  const textInputInteraction = $('<oppia-interactive-text-input>');
  // We use presenceOf here instead of visibilityOf because the container
  // has a height and width of 0.
  await waitFor.presenceOf(
    textInputInteraction,
    'TextInput interaction taking too long to appear'
  );
  if (placeholderText) {
    placeholderValue = await textInputInteraction.getAttribute(
      'placeholder-with-value'
    );
    placeholderValueUnicode = JSON.parse(
      placeholderValue.replace(/&quot;/g, '"')
    ).unicode_str;
    expect(placeholderValueUnicode).toEqual(placeholderText);
  }
  if (heightOfBox) {
    expect(await textInputInteraction.getAttribute('rows-with-value')).toEqual(
      heightOfBox.toString()
    );
  }
  expect(await elem.$('<oppia-interactive-text-input>').isExisting()).toBe(
    true
  );
};

// eslint-disable-next-line no-unused-vars
var submitAnswer = async function (elem, answer) {
  // Note: elem is not used here due to a ChainablePromiseElement resolution
  // bug in WebdriverIO 7 with Chrome 147+ when chaining off custom elements
  // inside iframes. We query from the document root instead.
  var textInputElem = await $('oppia-interactive-text-input');
  await textInputElem.waitForDisplayed({
    timeout: 10000,
    timeoutMsg: 'oppia-interactive-text-input took too long to appear.',
  });
  var textAreaElem = await textInputElem.$('textarea');
  if (await textAreaElem.isExisting()) {
    await action.setValue('Text Area Input', textAreaElem, answer);
    var submitAnswerBtn = $('.e2e-test-submit-answer-button');
    await submitAnswerBtn.scrollIntoView();
    await action.click('Submit Answer Button', submitAnswerBtn);
  } else {
    var inputElem = await textInputElem.$('input');
    if (await inputElem.isExisting()) {
      await action.clear('Text Input Element', inputElem);
      await action.setValue('Text Input Element', inputElem, answer);
      var submitAnswerBtn = $('.e2e-test-submit-answer-button');
      await submitAnswerBtn.scrollIntoView();
      await action.click('Submit Answer Button', submitAnswerBtn);
    }
  }
};

var answerObjectType = 'NormalizedString';

var testSuite = [
  {
    interactionArguments: ['placeholder', 4],
    ruleArguments: ['StartsWith', ['valid']],
    expectedInteractionDetails: ['placeholder', 4],
    wrongAnswers: ['invalid'],
    correctAnswers: ['valid'],
  },
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
