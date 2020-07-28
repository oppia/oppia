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

var customizeInteraction = function() {
  // There are no customizations.
};

var expectInteractionDetailsToMatch = async function(elem) {
  expect(
    await elem.element(by.tagName(
      'oppia-interactive-numeric-expression-input')).isPresent()
  ).toBe(true);
  // Testing editor's value in default state.
  expect(
    await objects.MathEditor(elem.element(by.tagName(
      'oppia-interactive-numeric-expression-input'))).getValue()
  ).toBe(
    '\\color{grey}{\\text{\\small{Type an expression here, using only ' +
    'numbers.}}}');
};

var submitAnswer = async function(elem, answer) {
  await objects.MathEditor(elem.element(by.tagName(
    'oppia-interactive-numeric-expression-input'))).setValue(answer);
  await element(by.css('.protractor-test-submit-answer-button')).click();
};

var answerObjectType = 'NumericExpression';

var testSuite = [{
  interactionArguments: [],
  ruleArguments: ['MatchesExactlyWith', '6-(-4)'],
  expectedInteractionDetails: [],
  wrongAnswers: ['10', '3*2-(-4)'],
  correctAnswers: ['6-(-4)', '-(-4)+6', '6+4']
}, {
  interactionArguments: [],
  ruleArguments: ['IsEquivalentTo', '3*10^(-5)'],
  expectedInteractionDetails: [],
  wrongAnswers: ['3*10^5', '2*10^(-5)', '5*10^(-3)'],
  correctAnswers: ['3*10^(-5)', '0.00003']
}, {
  interactionArguments: [],
  ruleArguments: ['ContainsSomeOf', '1000 + 200 + 30 + 4 + 0.5 + 0.06'],
  expectedInteractionDetails: [],
  wrongAnswers: ['1234.56', '123456/100'],
  correctAnswers: [
    '1000 + 200 + 30 + 4 + 0.5 + 0.06',
    '1000 + 200 + 4 + 0.5',
    '1000 + 234.56',
    '0.06']
}, {
  interactionArguments: [],
  ruleArguments: ['OmitsSomeOf', '1000 + 200 + 30 + 4 + 0.5 + 0.06'],
  expectedInteractionDetails: [],
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
