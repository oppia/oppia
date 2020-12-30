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

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorFeedbackTab = function() {
  /*
   * Interactive elements
   */
  var feedbackTabRow = element(
    by.css('.protractor-test-oppia-feedback-tab-row'));
  var explorationFeedback = element(
    by.css('.protractor-test-exploration-feedback'));
  var feedbackBackButton = element(
    by.css('.protractor-test-oppia-feedback-back-button'));
  var feedbackResponseTextArea = element(
    by.css('.protractor-test-feedback-response-textarea'));
  var suggestionRowClassName = '.protractor-test-oppia-feedback-tab-row';
  var feedbackSubjectClassName = (
    '.protractor-test-exploration-feedback-subject');
  var suggestionCommitMessageInput = element(
    by.css('.protractor-test-suggestion-commit-message'));
  var suggestionReviewMessageInput = element(
    by.css('.protractor-test-suggestion-review-message'));
  var feedbackStatusDropdown = element(
    by.css('.protractor-test-oppia-feedback-status-menu'));
  /*
   * Buttons
   */
  var acceptSuggestionButton = element(
    by.css('.protractor-test-exploration-accept-suggestion-btn'));
  var feedbackSendResponseButton = element(
    by.css('.protractor-test-oppia-feedback-response-send-btn'));
  var rejectSuggestionButton = element(
    by.css('.protractor-test-exploration-reject-suggestion-btn'));
  var viewSuggestionButton = element(
    by.css('.protractor-test-view-suggestion-btn'));

  /*
   * Workflows
   */
  this.acceptSuggestion = async function(suggestionDescription) {
    await waitFor.visibilityOf(
      element(by.css(suggestionRowClassName)),
      'Suggestion row takes too long to appear');
    var matchingRow = element(by.cssContainingText(
      `${suggestionRowClassName} ${feedbackSubjectClassName}`,
      suggestionDescription));
    await action.click('Matching Row', matchingRow);
    await action.click('View Suggestion Button', viewSuggestionButton);
    await action.sendKeys(
      'Suggestion Commit Message Input',
      suggestionCommitMessageInput, 'Commit message');
    await action.click('Accept Suggestion Button', acceptSuggestionButton);
    await waitFor.invisibilityOf(
      acceptSuggestionButton, 'Suggestion modal takes too long to disappear');
    await waitFor.pageToFullyLoad();
  };

  this.expectToHaveFeedbackThread = async function() {
    await waitFor.presenceOf(
      feedbackTabRow, 'Feedback Tab Row takes too long to appear');
  };

  this.getSuggestionThreads = async function() {
    var threads = [];
    await waitFor.visibilityOf(
      element.all(by.css(suggestionRowClassName)).first(),
      'No suggestion threads are visible');
    var rows = element.all(by.css(suggestionRowClassName));
    var rowCount = await rows.count();
    for (var i = 0; i < rowCount; i++) {
      var row = await rows.get(i);
      var subject = (
        await row.element(by.css(feedbackSubjectClassName)).getText());
      threads.push(subject);
    }
    return threads;
  };

  this.goBackToAllFeedbacks = async function() {
    await action.click('Feedback Back Button', feedbackBackButton);
  };

  this.readFeedbackMessages = async function() {
    var messages = [];
    await waitFor.visibilityOf(
      element.all(by.css(suggestionRowClassName)).first(),
      'No feedback messages are visible.');
    var rows = element.all(by.css(suggestionRowClassName));
    var rowCount = await rows.count();
    for (var i = 0; i < rowCount; i++) {
      var row = await rows.get(i);
      await action.click(`suggestionRow at row index ${i}`, row);
      await waitFor.visibilityOf(
        explorationFeedback, 'Feedback message text is not visible');
      var message = await explorationFeedback.getText();
      messages.push(message);
      await action.click('Feedback Back Button', feedbackBackButton);
    }
    return messages;
  };

  this.rejectSuggestion = async function(suggestionDescription) {
    await waitFor.visibilityOf(
      element(by.css(suggestionRowClassName)),
      'Suggestion row takes too long to appear');
    var matchingRow = element(by.cssContainingText(
      `${suggestionRowClassName} ${feedbackSubjectClassName}`,
      suggestionDescription));
    await action.click(
      'Matching Suggestion Row and feedback subject', matchingRow);
    await action.click('View Suggestion Button', viewSuggestionButton);
    await action.sendKeys(
      'Suggestion Review Message Input',
      suggestionReviewMessageInput, 'Review message');
    await action.click('Reject Suggestion Button', rejectSuggestionButton);
    await waitFor.invisibilityOf(
      acceptSuggestionButton, 'Suggestion modal takes too long to disappear');
    await waitFor.pageToFullyLoad();
  };

  this.selectLatestFeedbackThread = async function() {
    var suggestionRowFirst = (
      element.all(by.css(suggestionRowClassName)).first());
    await action.click(
      'Suggestion Row First', suggestionRowFirst);
  };

  this.sendResponseToLatestFeedback = async function(feedbackResponse) {
    await this.selectLatestFeedbackThread();
    await action.sendKeys(
      'Feedback Response Text Area',
      feedbackResponseTextArea, feedbackResponse);
    await action.click(
      'Feedback Send Response Button', feedbackSendResponseButton);
  };

  this.changeFeedbackStatus = async function(
      feedbackStatus, feedbackResponse) {
    await action.sendKeys(
      'Feedback Response Text Area',
      feedbackResponseTextArea, feedbackResponse);
    await action.click('Feedback Status Dropdow', feedbackStatusDropdown);
    var optionLabelFeedbackStatus = (
      element(by.css(`option[label="${feedbackStatus}"]`)));
    await action.click(
      'Option[label = "feedback status"', optionLabelFeedbackStatus);
    await action.click(
      'Feedback Send Response Button', feedbackSendResponseButton);
  };

  this.readFeedbackMessagesFromThread = async function() {
    var feedbackMessages = element.all(
      by.css('.protractor-test-exploration-feedback'));
    await waitFor.visibilityOf(
      feedbackMessages.first(), 'Feedback message text is not visible');
    return feedbackMessages;
  };

  this.expectFeedbackStatusNameToBe = async function(feedbackStatus) {
    var feedbackStatusElement = element(
      by.css('.protractor-test-oppia-feedback-status-name'));
    await waitFor.visibilityOf(
      feedbackStatusElement, 'Feedback status is not visible.');
    await waitFor.textToBePresentInElement(
      feedbackStatusElement,
      feedbackStatus,
      `Expected ${await feedbackStatusElement.getText()} ` +
      `to be ${feedbackStatus}`);
  };
};

exports.ExplorationEditorFeedbackTab = ExplorationEditorFeedbackTab;
