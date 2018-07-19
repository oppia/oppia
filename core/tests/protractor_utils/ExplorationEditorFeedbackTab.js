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
 * @fileoverview Page object for the exploration editor's feedback tab, for
 * use in Protractor tests.
 */

var general = require('./general.js');
var until = protractor.ExpectedConditions;

var ExplorationEditorFeedbackTab = function () {
  /*
   * Interactive elements
   */
  var explorationFeedbackSubject = element(
    by.css('.protractor-test-exploration-feedback-subject'));
  var feedbackTabRow = element(
    by.css('.protractor-test-oppia-feedback-tab-row'));
  var explorationFeedback = element(
    by.css('.protractor-test-exploration-feedback'));
  var feedbackBackButton = element(
    by.css('.protractor-test-oppia-feedback-back-button'));
  var feedbackResponseTextArea = element(
    by.css('.protractor-test-feedback-response-textarea'));
  var suggestionRowClassName = '.protractor-test-oppia-feedback-tab-row';
  var suggestionCommitMessageInput = element(
    by.css('.protractor-test-suggestion-commit-message'));
  /*
   * Buttons
   */
  var acceptSuggestionButton = element(
    by.css('.protractor-test-exploration-accept-suggestion-btn'));
  var feedbackSendResponseButton = element(
    by.css('.protractor-test-oppia-feedback-response-send-btn'));
  var viewSuggestionButton = element(
    by.css('.protractor-test-view-suggestion-btn'));
  /*
   * Workflows
   */
  this.acceptSuggestion = function(suggestionDescription) {
    return element.all(by.css(suggestionRowClassName)).then(function(rows) {
      var matchingSuggestionRows = rows.filter(function() {
        return explorationFeedbackSubject.getText().then(function(subject) {
          return suggestionDescription.indexOf(subject) !== -1;
        });
      });
      expect(matchingSuggestionRows[0].isDisplayed()).toBe(true);
      matchingSuggestionRows[0].click();
      expect(viewSuggestionButton.isDisplayed()).toBe(true);
      viewSuggestionButton.click();
      expect(acceptSuggestionButton.isDisplayed()).toBe(true);
      suggestionCommitMessageInput.sendKeys('Commit message');
      acceptSuggestionButton.click();
      browser.wait(until.invisibilityOf(acceptSuggestionButton), 5000);
    });
  };

  this.expectToHaveFeedbackThread = function() {
    expect(feedbackTabRow.isPresent()).toBe(true);
  };

  this.getSuggestionThreads = function() {
    var threads = [];
    browser.wait(until.visibilityOf(
      element.all(by.css(suggestionRowClassName)).first()), 5000);
    return element.all(by.css(suggestionRowClassName)).then(function(rows) {
      rows.forEach(function() {
        explorationFeedbackSubject.getText().then(function(subject) {
          threads.push(subject);
        });
      });
      return threads;
    });
  };

  this.readFeedbackMessages = function() {
    var messages = [];
    browser.wait(until.visibilityOf(
      element.all(by.css(suggestionRowClassName)).first()), 5000);
    return element.all(by.css(suggestionRowClassName)).then(function(rows) {
      rows.forEach(function(row) {
        row.click();
        browser.wait(until.visibilityOf(explorationFeedback), 5000,
          'Exploration Feedback text is not visible');
        explorationFeedback.getText().then(function(message) {
          messages.push(message);
        });
        feedbackBackButton.click();
      });
      return messages;
    });
  };

  this.sendResponseToLatestFeedback = function(feedbackResponse) {
    element.all(by.css('.protractor-test-oppia-feedback-tab-row')).
      first().click();
    feedbackResponseTextArea.sendKeys(feedbackResponse);
    feedbackSendResponseButton.click();
  };
};

exports.ExplorationEditorFeedbackTab = ExplorationEditorFeedbackTab;
