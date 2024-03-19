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
 * end-to-end testing with WebdriverIO.js
 */

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var forms = require(process.cwd() + '/core/tests/webdriverio_utils/forms.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);

var customizeComponent = async function (modal, text, skillDescription) {
  await objects
    .SkillSelector(modal.$('<skill-selector-editor>'))
    .setValue(skillDescription);

  var textEditor = objects.UnicodeStringEditor(
    modal.$('<schema-based-unicode-editor>')
  );
  // Change the text only if is specified as an argument, as this component
  // sometimes relies on highlights.
  if (text === null || text === textEditor.getValue()) {
    return;
  }
  await textEditor.setValue(text);
};

var expectComponentDetailsToMatch = async function (
  elem,
  text,
  reviewMaterial
) {
  var link = elem.$('<a>');
  expect(await link.getText()).toBe(text);
  await link.click();
  await waitFor.visibilityOf(
    $('.e2e-test-concept-card-explanation'),
    'concept-card-explanation taking too long to show up'
  );
  await forms
    .expectRichText($('.e2e-test-concept-card-explanation'))
    .toMatch(reviewMaterial);
  await action.click(
    'Concept Card close button',
    $('.e2e-test-close-concept-card')
  );
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
