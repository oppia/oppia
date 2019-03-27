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
 * @fileoverview Utilities for using the Collapsible component during
 * end-to-end testing with Protractor.js
 */

var forms = require('../../../core/tests/protractor_utils/forms.js');
var general = require('../../../core/tests/protractor_utils/general.js');

var customizeComponent = function(modal, heading, contentInstructions) {
  forms.UnicodeEditor(
    modal.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(heading);
  var richTextEditor = forms.RichTextEditor(
    modal.element(by.tagName('schema-based-html-editor')));
  richTextEditor.clear();
  contentInstructions(richTextEditor);
};

var expectComponentDetailsToMatch = function(
    elem, heading, contentInstructions) {
  var headerElement = elem.element(by.css(
    '.protractor-test-collapsible-heading'));
  expect(headerElement.getText()).toMatch(heading);
  // Open the collapsible block so we can examine it.
  headerElement.click();
  forms.expectRichText(
    elem.element(by.css('.panel-body')).element(by.css(
      '.protractor-test-collapsible-content'))
  ).toMatch(contentInstructions);
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
