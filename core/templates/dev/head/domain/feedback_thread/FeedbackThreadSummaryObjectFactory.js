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

oppia.factory('FeedbackThreadSummaryObjectFactory', [function() {
  var FeedbackThread = function(status, originalAuthorId, lastUpdated,
    lastMessageText, totalMessageCount, lastMessageRead,
    secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
    explorationTitle, explorationId, threadId) {
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

  FeedbackThread.prototype.markAllTheLastTwoMessagesAsRead = function() {
    if (this.authorSecondLastMessage) {
      this.secondLastMessageRead = true;
    }
    this.lastMessageRead = true;
  }

  FeedbackThread.prototype.updateThreadSummaryOnAdditionOfNewMessage = function(
    lastMessageText, authorLastMessage) {
    this.lastMessageText = lastMessageText;
    this.lastUpdated = new Date();
    this.authorSecondLastMessage = this.authorLastMessage;
    this.authorLastMessage = authorLastMessage;
    this.totalMessageCount += 1;
    this.lastMessageRead = true;
    this.secondLastMessageRead = true;
  };

  FeedbackThread.create = function(
    status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount,
    lastMessageRead, secondLastMessageRead, authorLastMessage,
    authorSecondLastMessage, explorationTitle, explorationId, threadId) {
    return new FeedbackThread(status, originalAuthorId, lastUpdated,
      lastMessageText, totalMessageCount, lastMessageRead,
      secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
      explorationTitle, explorationId, threadId);
  }

  FeedbackThread.createFromBackendDict = function(
    feedbackThreadBackendDict) {
    return new FeedbackThread(
      feedbackThreadBackendDict.status,
      feedbackThreadBackendDict.original_author_id,
      feedbackThreadBackendDict.last_updated,
      feedbackThreadBackendDict.last_message_text,
      feedbackThreadBackendDict.total_message_count,
      feedbackThreadBackendDict.last_message_read,
      feedbackThreadBackendDict.second_last_message_read,
      feedbackThreadBackendDict.author_last_message,
      feedbackThreadBackendDict.author_second_last_message,
      feedbackThreadBackendDict.exploration_title,
      feedbackThreadBackendDict.exploration_id,
      feedbackThreadBackendDict.thread_id);
  };

  return FeedbackThread;
}]);
