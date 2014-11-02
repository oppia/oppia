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
 * @fileoverview End-to-end testing utilities for the Multiple Choice
 * interaction.
 */

var forms = require('../../../../core/tests/protractor_utils/forms.js');

var customizeInteraction = function(elem, options) {
  var listEditor = forms.ListEditor(elem);
  listEditor.setLength(options.length);
  for (var i = 0; i < options.length; i++) {
    listEditor.editEntry(i, 'RichText').setPlainText(options[i]);
  }
};

// The callbackFunctions each describe how to create one of the options using
// the rich text editor.
var customizeComplexInteraction = function(elem, callbackFunctions) {
  forms.ListEditor(elem).setLength(callbackFunctions.length);
  for (var i = 0; i < callbackFunctions.length; i++) {
    callbackFunctions[i](forms.ListEditor.editEntry(i, 'RichText'));
  }
};

// These callbackFunctions each describe how to check one of the options.
var expectComplexInteractionDetailsToMatch = function(callbackFunctions) {
  element.all(by.repeater('choice in choices track by $index')).
      then(function(optionElements) {
    expect(optionElements.length).toEqual(callbackFunctions.length);
    for (var i = 0; i < optionElements.length; i++) {
      forms.expectRichText(
        optionElements[i].element(by.xpath('./button/span'))
      ).toMatch(callbackFunctions[i]);
    }
  });
};

var expectInteractionDetailsToMatch = function(options) {
  expectComplexInteractionDetailsToMatch(options.map(function(text) {
    return function(checker) {
      checker.readPlainText(text);
    };
  }));
};

// 'answer' {String} is the text on the multiple-choice item to select.
var submitAnswer = function(answer) {
  element(by.tagName('oppia-interactive-multiple-choice-input')).
    element(by.buttonText(answer)).click();
};

exports.customizeInteraction = customizeInteraction;
exports.customizeComplexInteraction = customizeComplexInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.expectComplexInteractionDetailsToMatch = expectComplexInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
