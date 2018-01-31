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
 * @fileoverview End-to-end testing utilities for the LogicProof interaction.
 */

var objects = require('../../objects/protractor.js');

var customizeInteraction = function(elem, assumption, target, defaultText) {
  elem.element(by.id('logicQuestionAssumptions')).sendKeys(assumption);
  elem.element(by.id('logicQuestionTarget')).sendKeys(target);
  elem.element(by.id('logicQuestionProof')).sendKeys(defaultText);
};

var expectInteractionDetailsToMatch = function(elem) {
  expect(
    elem.element(by.tagName('oppia-interactive-logic-proof')).isPresent()
  ).toBe(true);
};

var submitAnswer = function() {
  // TODO(nithusha21): find a way to send keys to the code-mirror element.
  // Temporarily pass the answer as defaultText in the customization args.
  element(by.css('.oppia-learner-confirm-button')).click();
};

var answerObjectType = 'CheckedProof';


var testSuite = [{
  interactionArguments: ['', '', 'from p we have p'],
  ruleArguments: ['Correct'],
  expectedInteractionDetails: [],
  wrongAnswers: [],
  correctAnswers: []
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
