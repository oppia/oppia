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
 * @fileoverview End-to-end testing utilities for Math Input Expression
 * interaction
 */

var objects = require('../../objects/protractor.js');

var mathExpressionInputTag = function(parentElement) {
  return parentElement.element(by.tagName(
    'oppia-interactive-math-expression-input'));
};

var customizeInteraction = function(elem) {
  // There is no customization option.
};

var expectInteractionDetailsToMatch = function(elem) {
  expect(
    mathExpressionInputTag(elem).isPresent()
  ).toBe(true);
};

var submitAnswer = function(elem, answer) {
  mathExpressionInputTag(elem).click();
  var mathInputElem = element(by.css('.guppy_active'));
  var submitAnswerButon = element(by.css(
    '.protractor-test-submit-answer-button'));
  // Input box is always empty.
  mathInputElem.isPresent().then(function(present) {
    if (present) {
      mathInputElem.sendKeys(answer);
      submitAnswerButon.click();
    }
  });
};

var answerObjectType = 'UnicodeString';

var testSuite = [{
  interactionArguments: [],
  ruleArguments: ['IsMathematicallyEquivalentTo', 'e = mc^2'],
  expectedInteractionDetails: [],
  wrongAnswers: ['y=2/x'],
  correctAnswers: ['e = mc^2']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
