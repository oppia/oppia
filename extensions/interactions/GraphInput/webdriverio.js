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
 * @fileoverview End-to-end testing utilities for the GraphInput interaction
 * in webdriverio.
 */

var forms = require(process.cwd() + '/core/tests/webdriverio_utils/forms.js');
var action = require(
  process.cwd() + '/core/tests/webdriverio_utils/action.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');

var customizeInteraction = async function(interactionEditor, graphDict) {
  var graphInputContainer = interactionEditor.$(
    '.e2e-test-graph-input-viz-container');
  if (graphDict) {
    await forms.GraphEditor(graphInputContainer).clearDefaultGraph();
    await forms.GraphEditor(graphInputContainer).setValue(graphDict);
  }
};

var expectInteractionDetailsToMatch = async function(
    interactionEditor, graphDict) {
  var graphInputContainer = interactionEditor.$(
    '.e2e-test-graph-input-viz-container');
  if (graphDict) {
    await forms.GraphEditor(graphInputContainer)
      .expectCurrentGraphToBe(graphDict);
  }
};

var submitAnswer = async function(conversationInput, graphDict) {
  // Assuming graph container is empty or already has the necessary nodes to
  // draw edges on. Otherwise, should allow user to add nodes before creating
  // new nodes.
  var graphInputContainer = conversationInput.$(
    '.e2e-test-graph-input-viz-container');
  if (graphDict) {
    await forms.GraphEditor(graphInputContainer).setValue(graphDict);
  }
  var submitAnswerButton = $(
    '.e2e-test-submit-answer-button');
  await waitFor.elementToBeClickable(
    submitAnswerButton, 'Submit Answer button is not clickable');
  await action.click('Submit answer button', submitAnswerButton);
};

var answerObjectType = 'Graph';
var initialGraph = {
  vertices: [[-10, -50], [-39, 72], [118, 17]]
};
var responseGraphDict = {
  edges: [[0, 1], [1, 2], [0, 2]],
  vertices: [[-10, -50], [-39, 72], [118, 17]]
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
