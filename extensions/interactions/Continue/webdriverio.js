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
 * @fileoverview End-to-end testing utilities for the Continue Button
 * interaction in webdriverio.
 */

var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');
var action = require(
  process.cwd() + '/core/tests/webdriverio_utils/action.js');


var customizeInteraction = async function(elem, buttonText) {
  if (buttonText) {
    await objects.UnicodeStringEditor(
      elem.$('<schema-based-unicode-editor>')
    ).setValue(buttonText);
  }
};

var expectInteractionDetailsToMatch = async function(elem, buttonText) {
  var continueButton = $('.e2e-test-continue-button');
  expect(await continueButton.getText()).toBe(buttonText.toUpperCase());
};

var submitAnswer = async function() {
  var continueButton = $('.e2e-test-continue-button');
  await waitFor.elementToBeClickable(
    continueButton, 'Continue button is not clickable');
  await action.click('Continue Button', continueButton);
};

var testSuite = [];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.testSuite = testSuite;
