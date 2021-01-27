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
 * @fileoverview End-to-end testing utilities for Numeric Expression Input
 * interaction
 */

var objects = require(process.cwd() + '/extensions/objects/protractor.js');
var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');

var customizeInteraction = async function(elem, placeholderText) {
  await objects.UnicodeStringEditor(
    elem.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(placeholderText);
};

var expectInteractionDetailsToMatch = async function(elem, placeholderText) {
  await waitFor.presenceOf(
    elem.element(by.tagName('oppia-interactive-numeric-expression-input')),
    'The numeric expression input editor took too long to load.');
  if (placeholderText) {
    expect(
      await objects.MathEditor(elem.element(by.tagName(
        'oppia-interactive-numeric-expression-input'))).getValue()
    ).toBe(
      '\\color{grey}{\\text{\\small{' + placeholderText + '}}}');
  }
};

var submitAnswer = async function(elem, answer) {
  await objects.MathEditor(elem.element(by.tagName(
    'oppia-interactive-numeric-expression-input'))).setValue(answer);
  await element(by.css('.protractor-test-submit-answer-button')).click();
};

var answerObjectType = 'NumericExpression';

var testSuite = [{
  interactionArguments: ['Type an expression here, using only numbers.'],
  ruleArguments: ['MatchesExactlyWith', '6-(-4)'],
  expectedInteractionDetails: ['Type an expression here, using only numbers.'],
  wrongAnswers: ['10', '3*2-(-4)'],
  correctAnswers: ['6-(-4)', '-(-4)+6', '6+4']
}, {
  interactionArguments: [
    'Type an expression here, using numbers and the addition sign.'],
  ruleArguments: ['IsEquivalentTo', '3*10^(-5)'],
  expectedInteractionDetails: [
    'Type an expression here, using numbers and the addition sign.'],
  wrongAnswers: ['3*10^5', '2*10^(-5)', '5*10^(-3)'],
  correctAnswers: ['3*10^(-5)', '0.00003']
}, {
  interactionArguments: [
    'Type an expression here, using numbers and arithmetic signs.'],
  ruleArguments: ['ContainsSomeOf', '1000 + 200 + 30 + 4 + 0.5 + 0.06'],
  expectedInteractionDetails: [
    'Type an expression here, using numbers and arithmetic signs.'],
  wrongAnswers: ['1234.56', '123456/100'],
  correctAnswers: [
    '1000 + 200 + 30 + 4 + 0.5 + 0.06',
    '1000 + 200 + 4 + 0.5',
    '1000 + 234.56',
    '0.06']
}, {
  interactionArguments: ['Type an expression here, using only numbers.'],
  ruleArguments: ['OmitsSomeOf', '1000 + 200 + 30 + 4 + 0.5 + 0.06'],
  expectedInteractionDetails: ['Type an expression here, using only numbers.'],
  wrongAnswers: [
    '1000 + 200 + 30 + 4 + 0.5 + 0.06',
    '1000 + 200 + 30 + 4 + 0.5 + 0.06 + 0.07',
    '0.06 + 0.5 + 4 + 30 + 200 + 1000'],
  correctAnswers: ['1000 + 200 + 30 + 4 + 0.56', '1000 + 200 + 30 + 0.5 + 0.06']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
