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
 * @fileoverview End-to-end testing utilities for the Fraction interaction
 * in webdriverio.
 */

var action = require(
  process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');

var customizeInteraction = async function(elem, requireSimplestForm) {
  await objects.BooleanEditor(elem.$(
    '<schema-based-bool-editor>')).setValue(requireSimplestForm);
};

var expectInteractionDetailsToMatch = async function(elem) {
  expect(
    await elem.$(
      '<oppia-interactive-fraction-input>').isExisting()
  ).toBe(true);
};

var submitAnswer = async function(elem, answer) {
  var interactiveFractionInput = elem.$('<oppia-interactive-fraction-input>')
    .$('<input>');
  await action.setValue(
    'Interactive Fraction Input', interactiveFractionInput, answer + '\n');
};

var answerObjectType = 'Fraction';


var testSuite = [{
  interactionArguments: [false],
  ruleArguments: ['IsExactlyEqualTo', '1/2'],
  expectedInteractionDetails: [],
  wrongAnswers: ['4/8'],
  correctAnswers: ['1/2']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
