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
 * @fileoverview End-to-end testing utilities for Math Equation Input
 * interaction in webdriverio.
 */

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');

var customizeInteraction = async function(elem, customLetters) {
  await waitFor.presenceOf(elem.$(
    '.e2e-test-custom-letters-div'),
  'The custom letters div took too long to load.');
  for (let letter of customLetters) {
    if (letter.match(/[a-z]/)) {
      await action.click('Math OSK Tab', elem.$('button=abc'));
    } else {
      await action.click('Math OSK Tab', elem.$('button=αβγ'));
    }
    await action.click('Math OSK Letter', elem.$(`button=${letter}`));
  }
};

var expectInteractionDetailsToMatch = async function(elem) {
  expect(
    await elem.$(
      '<oppia-interactive-math-equation-input>').isExisting()
  ).toBe(true);
  // Testing editor's value in default state.
  expect(
    await objects.MathEditor(elem.$(
      '<oppia-interactive-math-equation-input>')).getValue()
  ).toBe('\\color{grey}{\\text{\\small{Type an equation here.}}}');
};

var submitAnswer = async function(elem, answer) {
  await objects.MathEditor(elem.$(
    '<oppia-interactive-math-equation-input>')).setValue(answer);
  var submitAnswerBtn = $('.e2e-test-submit-answer-button');
  await action.click('Submit Answer Button', submitAnswerBtn);
};

var answerObjectType = 'MathEquation';

var testSuite = [{
  interactionArguments: [['y', 'm', 'x', 'c', 'b']],
  ruleArguments: ['IsEquivalentTo', 'y=m*x+c'],
  expectedInteractionDetails: [],
  wrongAnswers: ['x=m*y+c', 'y+m*x+c=0', 'y=m*x+b', 'y=m*x'],
  correctAnswers: ['y=m*x+c', 'y=c+m*x', 'm*x+c=y', 'y-m*x=c', 'y-m*x-c=0']
}, {
  interactionArguments: [['x', 'y']],
  ruleArguments: ['IsEquivalentTo', '(2*x+1)*(x-3)=0'],
  expectedInteractionDetails: [],
  wrongAnswers: ['x-y=x-y', 'x=3', '2*x+1=0', 'x=-1/2'],
  correctAnswers: [
    '(2*x+1)*(x-3)=0', '0=(2*x+1)*(x-3)', '2*x*x-6*x=3-x', '-2*x*x+5*x+3=0',
    '(2*x+1)*(-x+3)=0']
}, {
  interactionArguments: [['y', 'm', 'x', 'c']],
  ruleArguments: ['MatchesExactlyWith', 'y=m*x+c', 'on Left Hand Side'],
  expectedInteractionDetails: [],
  wrongAnswers: ['y-m*x=c', 'm*x+c=y', 'x=m*y+c'],
  correctAnswers: ['y=m*x+c', 'y=m*x^2+c', 'y=0', 'y=m*x-c']
}, {
  interactionArguments: [['y', 'm', 'x', 'c']],
  ruleArguments: ['MatchesExactlyWith', 'y=m*x+c', 'on both sides'],
  expectedInteractionDetails: [],
  wrongAnswers: ['y-m*x=c', 'm*x+c=y', 'x=m*y+c', 'y=c+m*x'],
  correctAnswers: ['y=m*x+c']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
