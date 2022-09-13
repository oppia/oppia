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
 * @fileoverview End-to-end testing utilities for the End Exploration
 * interaction in webdriverio.
 */

var action = require(
  process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
/**
 * Add recommended exploration Id to End Exploration interaction.
 * @param {Object} elem - The Customize Exploration modal for End Exploration.
 * @param {string[]} recommendedExplorationIdArray - Exploration Id array.
 */
var customizeInteraction = async function(
    elem, recommendedExplorationIdArray) {
  if (recommendedExplorationIdArray) {
    if (Array.isArray(recommendedExplorationIdArray) === false) {
      throw new Error ('Please use array to add recommendation Ids');
    }
    for (var explorationId of recommendedExplorationIdArray) {
      var addExplorationIdButton = $('.e2e-test-add-list-entry');
      await action.click('Add Exploration Id Button', addExplorationIdButton);
      await objects.UnicodeStringEditor(
        elem.$('<schema-based-unicode-editor>')
      ).setValue(explorationId);
    }
  }
};

var expectInteractionDetailsToMatch = async function(elem) {
  await expect(
    await elem.$(
      '<oppia-interactive-end-exploration>').isExisting()
  ).toBe(true);
};

var testSuite = [];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.testSuite = testSuite;
