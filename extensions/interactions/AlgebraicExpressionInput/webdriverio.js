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
 * @fileoverview End-to-end testing utilities for Algebraic Expression Input
 * interaction in webdriverio.
 */

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);

var customizeInteraction = async function (elem, customLetters) {
  await waitFor.presenceOf(
    elem.$('.e2e-test-custom-letters-div'),
    'The custom letters div took too long to load.'
  );
  for (let letter of customLetters) {
    if (letter.match(/[a-z]/)) {
      await action.click('Math OSK Tab', elem.$('button=abc'));
    } else {
      await action.click('Math OSK Tab', elem.$('button=αβγ'));
    }
    await action.click('Math OSK Letter', elem.$(`button=${letter}`));
  }
};

var expectInteractionDetailsToMatch = async function (elem) {
  expect(
    await elem.$('<oppia-interactive-algebraic-expression-input>').isExisting()
  ).toBe(true);
  // Testing editor's value in default state.
  expect(
    await objects
      .MathEditor(elem.$('<oppia-interactive-algebraic-expression-input>'))
      .getValue()
  ).toBe('\\color{grey}{\\text{\\small{Type an expression here.}}}');
};

var submitAnswer = async function (elem, answer) {
  await objects
    .MathEditor(elem.$('<oppia-interactive-algebraic-expression-input>'))
    .setValue(answer);
  var submitBtn = $('.e2e-test-submit-answer-button');
  await action.click('Submit Buttom', submitBtn);
};

var answerObjectType = 'AlgebraicExpression';

var testSuite = [
  {
    interactionArguments: [['a', 'b']],
    ruleArguments: ['MatchesExactlyWith', '(a+b)^2'],
    expectedInteractionDetails: [],
    wrongAnswers: ['(a-b)^2', '(a-b)^3', 'a^2+2*a*b+b^2'],
    correctAnswers: ['(a+b)^2'],
  },
  {
    interactionArguments: [['x', 'z']],
    ruleArguments: ['MatchesExactlyWith', '((x^2)-x)/z'],
    expectedInteractionDetails: [],
    wrongAnswers: [
      '((x^3)-x)/z',
      'x(x-1)/z',
      '((x^2)/z)-x/z',
      '((x*x)-x)*z^(-1)',
    ],
    correctAnswers: ['((x^2)-x)/z'],
  },
  {
    interactionArguments: [['π', 'r']],
    ruleArguments: ['IsEquivalentTo', 'pi*r^2'],
    expectedInteractionDetails: [],
    wrongAnswers: ['pi*r', 'pi*r*2', 'pi', 'pi/r^2'],
    correctAnswers: ['pi*r^2', 'pi*r*r', '(pi*r^3)/(2*r-r)'],
  },
  {
    interactionArguments: [['x']],
    ruleArguments: ['IsEquivalentTo', '(9*x^2)-6*x+1'],
    expectedInteractionDetails: [],
    wrongAnswers: ['sqrt(3x-1)^(2)', '9*(x)^(2)-6*x-1', '(3*x-1)^(4)'],
    correctAnswers: ['(9*x^2)-6*x+1', '(1-3x)^2'],
  },
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
