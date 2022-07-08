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
 * @fileoverview Utilities for using the Skillreview component during
 * end-to-end testing with Protractor.js
 */

var objects = require(process.cwd() + '/extensions/objects/protractor.js');
var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');
var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');

var customizeComponent = async function(modal, text, skillDescription) {
  await objects.UnicodeStringEditor(
    modal.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(text);
  await objects.SkillSelector(
    modal.element(by.tagName('skill-selector-editor'))
  ).setValue(skillDescription);
};

var expectComponentDetailsToMatch = async function(elem, text, reviewMaterial) {
  var link = elem.element(by.tagName('a'));
  expect(await link.getText()).toBe(text);
  await link.click();
  await waitFor.visibilityOf(
    element(by.css('.e2e-test-concept-card-explanation')),
    'concept-card-explanation taking too long to show up'
  );
  await forms.expectRichText(
    element(by.css('.e2e-test-concept-card-explanation'))
  ).toMatch(reviewMaterial);
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
