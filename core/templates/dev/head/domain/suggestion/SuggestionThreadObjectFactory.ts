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
 * @fileoverview Factory for creating new frontend instances of suggestion
   thread domain objects.
 */

require('domain/suggestion/SuggestionObjectFactory.ts');

angular.module('oppia').factory('SuggestionThreadObjectFactory', [
  'SuggestionObjectFactory', function(SuggestionObjectFactory) {
    var SuggestionThread = function(
        status, subject, summary, originalAuthorName, lastUpdated, messageCount,
        threadId, lastMessageText, lastMessageAuthor, secondLastMessageText,
        secondLastMessageAuthor, suggestion) {
      this.status = status;
      this.subject = subject;
      this.summary = summary;
      this.originalAuthorName = originalAuthorName;
      this.lastUpdated = lastUpdated;
      this.messageCount = messageCount;
      this.threadId = threadId;
      this.suggestion = suggestion;
      this.messages = [];
      this.lastMessageText = lastMessageText;
      this.lastMessageAuthor = lastMessageAuthor;
      this.secondLastMessageText = secondLastMessageText;
      this.secondLastMessageAuthor = secondLastMessageAuthor;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    SuggestionThread['createFromBackendDicts'] = function(
    /* eslint-enable dot-notation */
        suggestionThreadBackendDict, suggestionBackendDict) {
      var suggestion;
      if (suggestionBackendDict.suggestion_type ===
          'edit_exploration_state_content') {
        suggestion = SuggestionObjectFactory.createFromBackendDict(
          suggestionBackendDict);
      }
      suggestionThreadBackendDict.last_message_text;
      return new SuggestionThread(
        suggestionThreadBackendDict.status, suggestionThreadBackendDict.subject,
        suggestionThreadBackendDict.summary,
        suggestionThreadBackendDict.original_author_username,
        suggestionThreadBackendDict.last_updated,
        suggestionThreadBackendDict.message_count,
        suggestionThreadBackendDict.thread_id,
        suggestionThreadBackendDict.last_message_text,
        suggestionThreadBackendDict.last_message_author,
        suggestionThreadBackendDict.second_last_message_text,
        suggestionThreadBackendDict.second_last_message_author,
        suggestion);
    };

    SuggestionThread.prototype.setMessages = function(messages) {
      this.messages = messages;
      this.messageCount = messages.length;
      this.secondLastMessageText = null;
      this.secondLastMessageAuthor = null;
      this.lastMessageText = null;
      this.lastMessageAuthor = null;
      for (let message of messages.slice(-2)) {
        this.secondLastMessageText = this.lastMessageText;
        this.secondLastMessageAuthor = this.lastMessageAuthor;
        this.lastMessageText = message.text;
        this.lastMessageAuthor = message.author_username;
      }
    };

    SuggestionThread.prototype.isSuggestionHandled = function() {
      return this.suggestion.status !== 'review';
    };

    SuggestionThread.prototype.getSuggestionStateName = function() {
      return this.suggestion.stateName;
    };

    SuggestionThread.prototype.getSuggestionStatus = function() {
      return this.suggestion.status;
    };

    SuggestionThread.prototype.getReplacementHtmlFromSuggestion = function() {
      return this.suggestion.newValue.html;
    };

    SuggestionThread.prototype.isSuggestionThread = function() {
      return true;
    };

    SuggestionThread.prototype.getSuggestion = function() {
      return this.suggestion;
    };

    return SuggestionThread;
  }
]);
