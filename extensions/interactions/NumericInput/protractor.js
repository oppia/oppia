// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end testing utilities for the Numeric
 * interaction.
 */

var objects = require('../../objects/protractor.js');

var customizeInteraction = function() {
  // There are no customizations.
};

var expectInteractionDetailsToMatch = function(elem) {
  expect(
    elem.element(by.tagName('oppia-interactive-numeric-input')).isPresent()
  ).toBe(true);
};

var submitAnswer = function(elem, answer) {
  elem.element(by.tagName('oppia-interactive-numeric-input')).
    element(by.tagName('input')).sendKeys(answer);
  element(by.css('.protractor-test-submit-answer-button')).click();
};

var answerObjectType = 'Real';

var testSuite = [{
  interactionArguments: [],
  ruleArguments: ['IsWithinTolerance', 2, 143],
  expectedInteractionDetails: [],
  wrongAnswers: [146, 130],
  correctAnswers: [142]
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
