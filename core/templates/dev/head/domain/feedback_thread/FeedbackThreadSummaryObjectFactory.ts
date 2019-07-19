// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of feedback thread
   domain objects.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('FeedbackThreadSummaryObjectFactory', [function() {
  var FeedbackThreadSummary = function(
      status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount,
      lastMessageRead, secondLastMessageRead, authorLastMessage,
      authorSecondLastMessage, explorationTitle, explorationId, threadId) {
    this.status = status;
    this.originalAuthorId = originalAuthorId;
    this.lastUpdated = lastUpdated;
    this.lastMessageText = lastMessageText;
    this.totalMessageCount = totalMessageCount;
    this.lastMessageRead = lastMessageRead;
    this.secondLastMessageRead = secondLastMessageRead;
    this.authorLastMessage = authorLastMessage;
    this.authorSecondLastMessage = authorSecondLastMessage;
    this.explorationTitle = explorationTitle;
    this.explorationId = explorationId;
    this.threadId = threadId;
  };

  FeedbackThreadSummary.prototype.markTheLastTwoMessagesAsRead = function() {
    if (this.authorSecondLastMessage) {
      this.secondLastMessageRead = true;
    }
    this.lastMessageRead = true;
  };

  FeedbackThreadSummary.prototype.appendNewMessage = function(
      lastMessageText, authorLastMessage) {
    this.lastMessageText = lastMessageText;
    this.lastUpdated = new Date();
    this.authorSecondLastMessage = this.authorLastMessage;
    this.authorLastMessage = authorLastMessage;
    this.totalMessageCount += 1;
    this.lastMessageRead = true;
    this.secondLastMessageRead = true;
  };

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  FeedbackThreadSummary['create'] = function(
  /* eslint-enable dot-notation */
      status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount,
      lastMessageRead, secondLastMessageRead, authorLastMessage,
      authorSecondLastMessage, explorationTitle, explorationId, threadId) {
    return new FeedbackThreadSummary(status, originalAuthorId, lastUpdated,
      lastMessageText, totalMessageCount, lastMessageRead,
      secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
      explorationTitle, explorationId, threadId);
  };

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  FeedbackThreadSummary['createFromBackendDict'] = function(
  /* eslint-enable dot-notation */
      feedbackThreadSummaryBackendDict) {
    return new FeedbackThreadSummary(
      feedbackThreadSummaryBackendDict.status,
      feedbackThreadSummaryBackendDict.original_author_id,
      feedbackThreadSummaryBackendDict.last_updated,
      feedbackThreadSummaryBackendDict.last_message_text,
      feedbackThreadSummaryBackendDict.total_message_count,
      feedbackThreadSummaryBackendDict.last_message_is_read,
      feedbackThreadSummaryBackendDict.second_last_message_is_read,
      feedbackThreadSummaryBackendDict.author_last_message,
      feedbackThreadSummaryBackendDict.author_second_last_message,
      feedbackThreadSummaryBackendDict.exploration_title,
      feedbackThreadSummaryBackendDict.exploration_id,
      feedbackThreadSummaryBackendDict.thread_id);
  };

  return FeedbackThreadSummary;
}]);
