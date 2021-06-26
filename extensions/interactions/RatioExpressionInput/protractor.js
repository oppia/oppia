// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end testing utilities for the Ratio Expression
 * Interaction.
 */
var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');
var objects = require(process.cwd() + '/extensions/objects/protractor.js');

var customizeInteraction = async function(
    elem, placeholderText, minNumberOfTerms) {
  await objects.UnicodeStringEditor(
    elem.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(placeholderText);
  await objects.IntEditor(
    elem.element(by.tagName('schema-based-int-editor'))
  ).setValue(minNumberOfTerms);
};

var expectInteractionDetailsToMatch = async function(elem, placeholderText) {
  const ratioExpressionInputInteraction = (
    element(by.tagName('oppia-interactive-ratio-expression-input')));
  // We use presenceOf here instead of visibilityOf because the container
  // has a height and width of 0.
  await waitFor.presenceOf(
    ratioExpressionInputInteraction,
    'Ratio Expression Input interaction taking too long to appear');
  if (placeholderText) {
    placeholderValue = await ratioExpressionInputInteraction.getAttribute(
      'placeholder-with-value');
    placeholderValueUnicode = JSON.parse(
      placeholderValue.replace(/&quot;/g, '"')
    ).unicode_str;
    expect(placeholderValueUnicode).toEqual(placeholderText);
  }
  expect(
    await elem.element(
      by.tagName('oppia-interactive-ratio-expression-input')).isPresent()
  ).toBe(true);
};

var submitAnswer = async function(elem, answer) {
  await elem.element(by.tagName('oppia-interactive-ratio-expression-input')).
    element(by.tagName('input')).sendKeys(answer + '\n');
};

var answerObjectType = 'RatioExpression';

var testSuite = [{
  interactionArguments: ['placeholder', 0],
  ruleArguments: ['IsEquivalent', '1:2'],
  expectedInteractionDetails: ['placeholder'],
  wrongAnswers: ['2:5'],
  correctAnswers: ['2:4']
}, {
  interactionArguments: ['placeholder', 0],
  ruleArguments: ['HasSpecificTermEqualTo', 3, 2],
  expectedInteractionDetails: ['placeholder'],
  wrongAnswers: ['10:10:1'],
  correctAnswers: ['10:10:2']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
