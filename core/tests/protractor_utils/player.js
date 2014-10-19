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

// Each widget should declare a checkExistence() function and a submitAnswer()
// function.
var widgetUtils = {
  Continue: require(
    '../../../extensions/widgets/interactive/Continue/protractor.js'),
  MultipleChoiceInput: require(
    '../../../extensions/widgets/interactive/MultipleChoiceInput/protractor.js'),
  NumericInput: require(
    '../../../extensions/widgets/interactive/NumericInput/protractor.js'),
};

// The get functions return promises rather than values.

var getExplorationName = function() {
  return element(by.css('.conversation-skin-exploration-header')).
    element(by.tagName('h3')).getText();
};

var getCurrentQuestionText = function() {
  return element.all(by.repeater('response in responseLog track by $index')).
    last().element(by.css('.protractor-test-conversation-content')).getText();
};

var getLatestFeedbackText = function() {
  return element.all(by.repeater('response in responseLog track by $index')).
    last().element(by.css('.protractor-test-conversation-feedback')).getText();
};


// 'widgetCustomizations' is a variable that is passed to the corresponding
// widget's protractor utilities. Its definition and type are widget-specific.
var expectInteractionToMatch = function(widgetName, widgetCustomizations) {
  if (widgetUtils.hasOwnProperty(widgetName)) {
    widgetUtils[widgetName].expectInteractionDetailsToMatch(widgetCustomizations);
  } else {
    throw 'Unknown widget: ' + widgetName;
  }
};

// `answerData` is a variable that is passed to the corresponding widget's
// protractor utilities. Its definition and type are widget-specific.
var submitAnswer = function(widgetName, answerData) {
  if (widgetUtils.hasOwnProperty(widgetName)) {
    widgetUtils[widgetName].submitAnswer(answerData);
  } else {
    throw 'Cannot submit answer to unknown widget: ' + widgetName;
  }
};


var expectExplorationToBeOver = function() {
  expect(element(by.css('.conversation-skin-response-finished')).
    isDisplayed()).toBe(true);
};

var expectExplorationToNotBeOver = function() {
  expect(element(by.css('.conversation-skin-response-finished')).
    isDisplayed()).toBe(false);
};

exports.getExplorationName = getExplorationName;
exports.getCurrentQuestionText = getCurrentQuestionText;
exports.getLatestFeedbackText = getLatestFeedbackText;

exports.expectInteractionToMatch = expectInteractionToMatch;
exports.submitAnswer = submitAnswer;

exports.expectExplorationToBeOver = expectExplorationToBeOver;
exports.expectExplorationToNotBeOver = expectExplorationToNotBeOver;