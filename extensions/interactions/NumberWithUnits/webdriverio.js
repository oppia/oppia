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
 * @fileoverview End-to-end testing utilities for the Number with Units
 * Interaction in webdriverio.
 */

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');

var customizeInteraction = function () {
  // There are no customizations.
};

var expectInteractionDetailsToMatch = async function (elem) {
  expect(
    await elem.$('<oppia-interactive-number-with-units>').isExisting()
  ).toBe(true);
};

var submitAnswer = async function (elem, answer) {
  var submitBtn = elem.$('<oppia-interactive-number-with-units>').$('<input>');
  await action.setValue('Submit Button', submitBtn, answer + '\n');
};

var answerObjectType = 'NumberWithUnits';

var testSuite = [
  {
    interactionArguments: [],
    ruleArguments: ['IsEquivalentTo', '2 km / hr'],
    expectedInteractionDetails: [],
    wrongAnswers: ['2 m / s'],
    correctAnswers: ['2000 m / hr'],
  },
];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
