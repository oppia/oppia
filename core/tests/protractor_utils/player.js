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
 * @fileoverview Utilities for playing through an exploration and checking its
 * contents when carrying out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var interactions = require('../../../extensions/interactions/protractor.js');
var forms = require('./forms.js');
var general = require('./general.js');

var restartExploration = function() {
  element(by.css('.protractor-test-restart-exploration')).click();
};

var expectExplorationNameToBe = function(name) {
  expect(
    element(by.css('.protractor-test-exploration-header')).getText()
  ).toBe(name);
};

// This verifies the question just asked, including formatting and
// rich-text components. To do so the richTextInstructions function will be
// sent a handler (as given in forms.RichTextChecker) to which calls such as
//   handler.readItalicText('slanted');
// can then be sent.
var expectContentToMatch = function(richTextInstructions) {
  forms.expectRichText(
    element.all(by.css('.protractor-test-conversation-content')).last()
  ).toMatch(richTextInstructions);
};

// Note that the 'latest' feedback may be on either the current or a
// previous card.
var expectLatestFeedbackToMatch = function(richTextInstructions) {
  forms.expectRichText(
    element.all(by.css('.protractor-test-conversation-feedback')).last()
  ).toMatch(richTextInstructions);
};

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant interaction's detail checker.
var expectInteractionToMatch = function(interactionName) {
  // Convert additional arguments to an array to send on.
  var args = [element(by.css('.protractor-test-conversation-input'))];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  interactions.getInteraction(interactionName).
    expectInteractionDetailsToMatch.apply(null, args);
};

// `answerData` is a variable that is passed to the corresponding interaction's
// protractor utilities. Its definition and type are interaction-specific.
var submitAnswer = function(interactionName, answerData) {
  interactions.getInteraction(interactionName).submitAnswer(
    element.all(by.css('.protractor-test-conversation-input')).last(),
    answerData);
  general.waitForSystem();
};

var expectExplorationToBeOver = function() {
  expect(
    element.all(by.css('.protractor-test-conversation-content')).last().getText()
  ).toEqual('Congratulations, you have finished this exploration!');
};

var expectExplorationToNotBeOver = function() {
  expect(
    element.all(by.css('.protractor-test-conversation-content')).last().getText()
  ).not.toEqual('Congratulations, you have finished this exploration!');
};

exports.restartExploration = restartExploration;

exports.expectExplorationNameToBe = expectExplorationNameToBe;
exports.expectContentToMatch = expectContentToMatch;
exports.expectLatestFeedbackToMatch = expectLatestFeedbackToMatch;

exports.expectInteractionToMatch = expectInteractionToMatch;
exports.submitAnswer = submitAnswer;

exports.expectExplorationToBeOver = expectExplorationToBeOver;
exports.expectExplorationToNotBeOver = expectExplorationToNotBeOver;
