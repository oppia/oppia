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
 * @fileoverview End-to-end testing utilities for the Pencil Code
 * Editor.
 */

var waitFor = require('../../../core/tests/protractor_utils/waitFor.js');

var customizeInteraction = function(interactionEditor,a) {
    console.log("this is testing")
    console.log(interactionEditor)
    console.log("this is testing")
    console.log(a)
    // var temp = interactionEditor.element(by.css(".protractor-test-interaction-editor"));
    // console.log(temp)
    // alert("this is testing")
};

var submitAnswer = function(conversationInput, answerCode) {
    var test = conversationInput.element(by.css(
      '.CodeMirror'));
    browser.executeScript("var editor = $('.CodeMirror')[0].CodeMirror;editor.setValue('"+answerCode+"');");
    var submitAnswerButton = element(by.css(
      '.protractor-test-submit-answer-button'));
    waitFor.elementToBeClickable(
      submitAnswerButton, 'Submit Answer button is not clickable');
    submitAnswerButton.click();
  };

exports.customizeInteraction = customizeInteraction;
exports.submitAnswer = submitAnswer;

