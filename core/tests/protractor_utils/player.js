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

var widgets = require('./widgets.js');
var forms = require('./forms.js');

var restartExploration = function() {
  element(by.css('.protractor-test-restart-exploration')).click();
};

// The get functions return promises rather than values.

var getExplorationName = function() {
  return element(by.css('.conversation-skin-exploration-header')).
    element(by.tagName('h3')).getText();
};

var expectContentToMatch = function(text) {
  expect(
    element.all(by.repeater('response in responseLog track by $index')).
      last().element(by.css('.protractor-test-conversation-content')).getText()
  ).toBe(text);
};

var expectComplexContentToMatch = function(callbackFunction) {
  forms.expectRichText(
    element.all(by.repeater('response in responseLog track by $index')).
      last().element(by.css('.protractor-test-conversation-content')).element(by.xpath('./div'))
  ).toMatch(callbackFunction);
};

var getLatestFeedbackText = function() {
  return element.all(by.repeater('response in responseLog track by $index')).
    last().element(by.css('.protractor-test-conversation-feedback')).getText();
};

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant widget's detail checker.
var expectInteractionToMatch = function(widgetName) {
  // Convert additional arguments to an array to send on.
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  widgets.getInteractive(widgetName).
    expectInteractionDetailsToMatch.apply(null, args);
};

// Likewise additional arguments can be sent to this function
var expectComplexInteractionToMatch = function(widgetName) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  widgets.getInteractive(widgetName).
    expectComplexInteractionDetailsToMatch.apply(null, args);
};

// `answerData` is a variable that is passed to the corresponding widget's
// protractor utilities. Its definition and type are widget-specific.
var submitAnswer = function(widgetName, answerData) {
  widgets.getInteractive(widgetName).submitAnswer(answerData);
};


var expectExplorationToBeOver = function() {
  expect(element(by.css('.conversation-skin-response-finished')).
    isDisplayed()).toBe(true);
};

var expectExplorationToNotBeOver = function() {
  expect(element(by.css('.conversation-skin-response-finished')).
    isDisplayed()).toBe(false);
};

exports.restartExploration = restartExploration;

exports.getExplorationName = getExplorationName;
exports.expectContentToMatch = expectContentToMatch;
exports.expectComplexContentToMatch = expectComplexContentToMatch;
exports.getLatestFeedbackText = getLatestFeedbackText;

exports.expectInteractionToMatch = expectInteractionToMatch;
exports.expectComplexInteractionToMatch = expectComplexInteractionToMatch;
exports.submitAnswer = submitAnswer;

exports.expectExplorationToBeOver = expectExplorationToBeOver;
exports.expectExplorationToNotBeOver = expectExplorationToNotBeOver;