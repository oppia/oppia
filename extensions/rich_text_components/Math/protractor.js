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
 * @fileoverview Utilities for using the Math component during
 * end-to-end testing with Protractor.js
 */

var objects = require(process.cwd() + '/extensions/objects/protractor.js');

var customizeComponent = async function(modal, rawLatex) {
  await (objects.MathExpressionContentEditor(
    modal.element(by.tagName('math-expression-content-editor'))
  ).setValue(rawLatex));
};

// This function is used to convert the escaped Json to unescaped object.
// This is required because the customizationArg value which we get initially
// from the Math rich text component is in escaped format and we need to
// convert it to unescaped format.
var escapedJsonToObj = function(json) {
  return (JSON.parse((
    json.toString())
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')));
};

var expectComponentDetailsToMatch = async function(elem, rawLatex) {
  // TODO(Jacob): Check that the actual latex being displayed is correct.
  var mathComponent = await elem.getAttribute('math_content-with-value');
  expect(escapedJsonToObj(mathComponent).raw_latex).toBe(rawLatex);
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
