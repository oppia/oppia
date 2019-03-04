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

oppia.factory('SuggestionThreadObjectFactory', [
  'QuestionSuggestionObjectFactory', 'SuggestionObjectFactory',
  function(QuestionSuggestionObjectFactory, SuggestionObjectFactory) {
    var SuggestionThread = function(
        status, subject, summary, originalAuthorName, lastUpdated, messageCount,
        threadId, suggestion) {
      this.status = status;
      this.subject = subject;
      this.summary = summary;
      this.originalAuthorName = originalAuthorName;
      this.lastUpdated = lastUpdated;
      this.messageCount = messageCount;
      this.threadId = threadId;
      this.suggestion = suggestion;
      this.messages = [];
    };

    SuggestionThread.createFromBackendDicts = function(
        suggestionThreadBackendDict, suggestionBackendDict) {
      var suggestion;
      if (suggestionBackendDict.suggestion_type === 'add_question') {
        suggestion = QuestionSuggestionObjectFactory.createFromBackendDict(
          suggestionBackendDict);
      } else if (suggestionBackendDict.suggestion_type ===
          'edit_exploration_state_content') {
        suggestion = SuggestionObjectFactory.createFromBackendDict(
          suggestionBackendDict);
      }
      return new SuggestionThread(
        suggestionThreadBackendDict.status, suggestionThreadBackendDict.subject,
        suggestionThreadBackendDict.summary,
        suggestionThreadBackendDict.original_author_username,
        suggestionThreadBackendDict.last_updated,
        suggestionThreadBackendDict.message_count,
        suggestionThreadBackendDict.thread_id, suggestion);
    };

    SuggestionThread.prototype.setMessages = function(messages) {
      this.messages = messages;
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
