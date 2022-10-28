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
 * interaction in webdriverio.
 */

var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');
var action = require(
  process.cwd() + '/core/tests/webdriverio_utils/action.js');

var customizeInteraction = async function(elem, placeholderText) {
  await objects.UnicodeStringEditor(
    elem.$('<schema-based-unicode-editor>')
  ).setValue(placeholderText);
};

var expectInteractionDetailsToMatch = async function(elem, placeholderText) {
  await waitFor.presenceOf(
    elem.$('<oppia-interactive-numeric-expression-input>'),
    'The numeric expression input editor took too long to load.');
  if (placeholderText) {
    expect(
      await objects.MathEditor(elem.$(
        '<oppia-interactive-numeric-expression-input>')).getValue()
    ).toBe(
      '\\color{grey}{\\text{\\small{' + placeholderText + '}}}');
  }
};

var submitAnswer = async function(elem, answer) {
  await objects.MathEditor(elem.$(
    '<oppia-interactive-numeric-expression-input>')).setValue(answer);
  var submitAnswerBtn = $('.e2e-test-submit-answer-button');
  await action.click('Submit Answer Button', submitAnswerBtn);
};

var answerObjectType = 'NumericExpression';

var testSuite = [{
  interactionArguments: ['Type an expression here, using only numbers.'],
  ruleArguments: ['MatchesExactlyWith', '6-(-4)'],
  expectedInteractionDetails: ['Type an expression here, using only numbers.'],
  wrongAnswers: ['10', '3*2-(-4)', '-(-4)+6', '6+4'],
  correctAnswers: ['6-(-4)']
}, {
  interactionArguments: [
    'Type an expression here, using numbers and the addition sign.'],
  ruleArguments: ['IsEquivalentTo', '3*10^(-5)'],
  expectedInteractionDetails: [
    'Type an expression here, using numbers and the addition sign.'],
  wrongAnswers: ['3*10^5', '2*10^(-5)', '5*10^(-3)'],
  correctAnswers: ['3*10^(-5)', '0.00003']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
