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
 * @fileoverview Page object for the exploration editor's feedback tab, for
 * use in Protractor tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorFeedbackTab = function () {
  /*
   * Interactive elements
   */
  var feedbackTabRow = $('.e2e-test-oppia-feedback-tab-row');
  var explorationFeedback = $('.e2e-test-exploration-feedback');
  var feedbackBackButton = $('.e2e-test-oppia-feedback-back-button');
  var feedbackResponseTextArea = $('.e2e-test-feedback-response-textarea');
  var suggestionRowClassName = '.e2e-test-oppia-feedback-tab-row';
  var suggestionRowElement = $('.e2e-test-oppia-feedback-tab-row');
  var feedbackSubjectClassName = '.e2e-test-exploration-feedback-subject';
  var suggestionCommitMessageInput = $('.e2e-test-suggestion-commit-message');
  var suggestionReviewMessageInput = $('.e2e-test-suggestion-review-message');
  var feedbackStatusDropdown = $('.e2e-test-oppia-feedback-status-menu');
  var feedbackMessage = $('.e2e-test-exploration-feedback');
  var feedbackMessageLocator = '.e2e-test-exploration-feedback';
  var feedbackMessagesSelector = function () {
    return $$('.e2e-test-exploration-feedback');
  };
  var feedbackStatusElement = $('.e2e-test-oppia-feedback-status-name');
  /*
   * Buttons
   */
  var acceptSuggestionButton = $('.e2e-test-exploration-accept-suggestion-btn');
  var feedbackSendResponseButton = $(
    '.e2e-test-oppia-feedback-response-send-btn'
  );
  var rejectSuggestionButton = $('.e2e-test-exploration-reject-suggestion-btn');
  var viewSuggestionButton = $('.e2e-test-view-suggestion-btn');

  /*
   * Workflows
   */
  this.acceptSuggestion = async function (suggestionDescription) {
    await waitFor.visibilityOf(
      $(suggestionRowClassName),
      'Suggestion row takes too long to appear'
    );
    var matchingRow = $(
      `.e2e-test-exploration-feedback-subject=${suggestionDescription}`
    );
    await action.click('Matching Row', matchingRow);
    await action.click('View Suggestion Button', viewSuggestionButton);
    await action.setValue(
      'Suggestion Commit Message Input',
      suggestionCommitMessageInput,
      'Commit message'
    );
    await action.click('Accept Suggestion Button', acceptSuggestionButton);
    await waitFor.invisibilityOf(
      acceptSuggestionButton,
      'Suggestion modal takes too long to disappear'
    );
    await waitFor.pageToFullyLoad();
  };

  this.expectToHaveFeedbackThread = async function () {
    await waitFor.presenceOf(
      feedbackTabRow,
      'Feedback Tab Row takes too long to appear'
    );
  };

  this.getSuggestionThreads = async function () {
    var threads = [];
    await waitFor.visibilityOf(
      suggestionRowElement,
      'No suggestion threads are visible'
    );
    var rows = await $$(suggestionRowClassName);
    var rowCount = rows.length;
    for (var i = 0; i < rowCount; i++) {
      var row = rows[i];
      var subject = await row.$(feedbackSubjectClassName).getText();
      threads.push(subject);
    }
    return threads;
  };

  this.goBackToAllFeedbacks = async function () {
    await action.click('Feedback Back Button', feedbackBackButton);
  };

  this.readFeedbackMessages = async function () {
    var messages = [];
    await waitFor.visibilityOf(
      suggestionRowElement,
      'No feedback messages are visible.'
    );
    var rows = await $$(suggestionRowClassName);
    var rowCount = rows.length;
    for (var i = 0; i < rowCount; i++) {
      var row = rows[i];
      await action.click(`suggestionRow at row index ${i}`, row);
      await waitFor.visibilityOf(
        explorationFeedback,
        'Feedback message text is not visible'
      );
      var message = await explorationFeedback.getText();
      messages.push(message);
      await action.click('Feedback Back Button', feedbackBackButton);
    }
    return messages;
  };

  this.rejectSuggestion = async function (suggestionDescription) {
    await waitFor.visibilityOf(
      $(suggestionRowClassName),
      'Suggestion row takes too long to appear'
    );
    var matchingRow = $(
      `.e2e-test-exploration-feedback-subject=${suggestionDescription}`
    );
    await action.click(
      'Matching Suggestion Row and feedback subject',
      matchingRow
    );
    await action.click('View Suggestion Button', viewSuggestionButton);
    await action.setValue(
      'Suggestion Review Message Input',
      suggestionReviewMessageInput,
      'Review message'
    );
    await action.click('Reject Suggestion Button', rejectSuggestionButton);
    await waitFor.invisibilityOf(
      acceptSuggestionButton,
      'Suggestion modal takes too long to disappear'
    );
    await waitFor.pageToFullyLoad();
  };

  this.selectLatestFeedbackThread = async function () {
    await waitFor.visibilityOf(
      suggestionRowElement,
      'Suggestion row is taking too long to appear'
    );
    var suggestionRowFirst = await $$(suggestionRowClassName)[0];
    await action.click('Suggestion Row First', suggestionRowFirst);
  };

  this.sendResponseToLatestFeedback = async function (feedbackResponse) {
    await this.selectLatestFeedbackThread();
    await action.setValue(
      'Feedback Response Text Area',
      feedbackResponseTextArea,
      feedbackResponse
    );
    await action.click(
      'Feedback Send Response Button',
      feedbackSendResponseButton
    );
  };

  this.changeFeedbackStatus = async function (
    feedbackStatus,
    feedbackResponse
  ) {
    await action.setValue(
      'Feedback Response Text Area',
      feedbackResponseTextArea,
      feedbackResponse
    );

    await waitFor.visibilityOf(
      feedbackStatusDropdown,
      'Feedback Status Dropdown is not visible'
    );
    await action.select(
      'Option feedback status',
      feedbackStatusDropdown,
      feedbackStatus
    );

    await action.click(
      'Feedback Send Response Button',
      feedbackSendResponseButton
    );
  };

  this.expectNumberOfFeedbackMessagesToBe = async function (number) {
    await waitFor.numberOfElementsToBe(
      feedbackMessageLocator,
      'Feedback message',
      number
    );
  };

  this.readFeedbackMessagesFromThread = async function () {
    await waitFor.visibilityOf(
      feedbackMessage,
      'Feedback message text is not visible'
    );
    var feedbackMessages = await feedbackMessagesSelector();
    return feedbackMessages;
  };

  this.expectFeedbackStatusNameToBe = async function (feedbackStatus) {
    await waitFor.visibilityOf(
      feedbackStatusElement,
      'Feedback status is not visible.'
    );
    await waitFor.textToBePresentInElement(
      feedbackStatusElement,
      feedbackStatus,
      `Expected ${await feedbackStatusElement.getText()} ` +
        `to be ${feedbackStatus}`
    );
  };
};

exports.ExplorationEditorFeedbackTab = ExplorationEditorFeedbackTab;
