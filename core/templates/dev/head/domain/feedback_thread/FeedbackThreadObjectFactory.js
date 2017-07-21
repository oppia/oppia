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

oppia.factory('FeedbackThreadObjectFactory', [function() {
  var FeedbackThread = function(status, originalAuthorId, lastUpdated,
    lastMessageText, totalNoOfMessages, lastMessageRead,
    secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
    explorationTitle, explorationId, threadId) {
    this.status = status;
    this.originalAuthorId = originalAuthorId;
    this.lastUpdated = lastUpdated;
    this.lastMessageText = lastMessageText;
    this.totalNoOfMessages = totalNoOfMessages;
    this.lastMessageRead = lastMessageRead;
    this.secondLastMessageRead = secondLastMessageRead;
    this.authorLastMessage = authorLastMessage;
    this.authorSecondLastMessage = authorSecondLastMessage;
    this.explorationTitle = explorationTitle;
    this.explorationId = explorationId;
    this.threadId = threadId;
  };

  FeedbackThread.prototype.updateSummaryOnNewMessage = function(
    lastMessageText, authorLastMessage) {
    this.lastMessageText = lastMessageText;
    this.lastUpdated = new Date();
    this.authorSecondLastMessage = this.authorLastMessage;
    this.authorLastMessage = authorLastMessage;
    this.totalNoOfMessages += 1;
    this.lastMessageRead = true;
    this.secondLastMessageRead = true;
  };

  FeedbackThread.create = function(
    status, originalAuthorId, lastUpdated, lastMessageText, totalNoOfMessages,
    lastMessageRead, secondLastMessageRead, authorLastMessage,
    authorSecondLastMessage, explorationTitle, explorationId, threadId) {
    return new FeedbackThread(status, originalAuthorId, lastUpdated,
      lastMessageText, totalNoOfMessages, lastMessageRead,
      secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
      explorationTitle, explorationId, threadId);
  }

  FeedbackThread.createFromBackendDicts = function(
    feedbackThreadBackendDicts) {
    var FeedbackThreads = [];
    for (index = 0; index < feedbackThreadBackendDicts.length; index++) {
      FeedbackThreads.push(new FeedbackThread(
        feedbackThreadBackendDicts[index].status,
        feedbackThreadBackendDicts[index].original_author_id,
        feedbackThreadBackendDicts[index].last_updated,
        feedbackThreadBackendDicts[index].last_message_text,
        feedbackThreadBackendDicts[index].total_no_of_messages,
        feedbackThreadBackendDicts[index].last_message_read,
        feedbackThreadBackendDicts[index].second_last_message_read,
        feedbackThreadBackendDicts[index].author_last_message,
        feedbackThreadBackendDicts[index].author_second_last_message,
        feedbackThreadBackendDicts[index].exploration_title,
        feedbackThreadBackendDicts[index].exploration_id,
        feedbackThreadBackendDicts[index].thread_id
      ));
    }

    return FeedbackThreads;
  };

  return FeedbackThread;
}]);
