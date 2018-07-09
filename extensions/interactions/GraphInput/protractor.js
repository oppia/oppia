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
 * @fileoverview End-to-end testing utilities for the GraphInput interaction.
 */

var forms = require('../../../core/tests/protractor_utils/forms.js');
var objects = require('../../objects/protractor.js');
var until = protractor.ExpectedConditions;

var customizeInteraction = function(interactionEditor, graphDict) {
  var graphInputContainer = interactionEditor.element(by.css(
    '.protractor-test-graph-input-viz-container'));
  if (graphDict) {
    forms.GraphEditor(graphInputContainer).clearDefaultGraph();
    forms.GraphEditor(graphInputContainer).setValue(graphDict);
  }
};

var expectInteractionDetailsToMatch = function(interactionEditor, graphDict) {
  var graphInputContainer = interactionEditor.element(by.css(
    '.protractor-test-graph-input-viz-container'));
  if (graphDict) {
    forms.GraphEditor(graphInputContainer)
      .expectCurrentGraphToBe(graphDict);
  }
};

var submitAnswer = function(conversationInput, graphDict) {
  // Assuming graph container is empty or already has the necessary nodes to
  // draw edges on. Otherwise, should allow user to add nodes before creating
  // new nodes.
  var graphInputContainer = conversationInput.element(by.css(
    '.protractor-test-graph-input-viz-container'));
  if (graphDict) {
    forms.GraphEditor(graphInputContainer).setValue(graphDict);
  }
  var submitAnswerButton = element(by.css(
    '.protractor-test-submit-answer-button'));
  browser.wait(until.elementToBeClickable(submitAnswerButton), 10000,
    'Submit Answer button is not clickable')
    .then(function(isClickable) {
      if (isClickable) {
        submitAnswerButton.click();
      }
    });
};

var answerObjectType = 'Graph';
var initialGraph = {
  vertices: [[277, 77], [248, 179], [405, 144]]
};
var responseGraphDict = {
  edges: [[0, 1], [1, 2], [0, 2]],
  vertices: [[277, 77], [248, 179], [405, 144]]
};
var wrongAnswerGraph = {
  edges: [[0, 1], [1, 2]]
};
var correctAnswerGraph = {
  edges: [[0, 1], [1, 2], [0, 2]]
};
var testSuite = [{
  interactionArguments: [initialGraph],
  ruleArguments: ['IsIsomorphicTo', responseGraphDict],
  expectedInteractionDetails: [initialGraph],
  wrongAnswers: [wrongAnswerGraph],
  correctAnswers: [correctAnswerGraph]
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
