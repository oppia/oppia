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
  'SuggestionObjectFactory', function(SuggestionObjectFactory) {
    var SuggestionThread = function(
        status, subject, summary, originalAuthorName, lastUpdated, messageCount,
        stateName, threadId, suggestion) {
      this.status = status;
      this.subject = subject;
      this.summary = summary;
      this.originalAuthorName = originalAuthorName;
      this.last_updated = lastUpdated;
      this.messageCount = messageCount;
      this.stateName = stateName;
      this.thread_id = threadId;
      this.suggestion = suggestion;
    };

    SuggestionThread.createFromBackendDict = function(
        SuggestionThreadBackendDict, SuggestionBackendDict) {
      var suggestion = SuggestionObjectFactory.createFromBackendDict(
        SuggestionBackendDict);
      return new SuggestionThread(
        SuggestionThreadBackendDict.status, SuggestionThreadBackendDict.subject,
        SuggestionThreadBackendDict.summary,
        SuggestionThreadBackendDict.original_author_username,
        SuggestionThreadBackendDict.last_updated,
        SuggestionThreadBackendDict.message_count,
        SuggestionThreadBackendDict.state_name,
        SuggestionThreadBackendDict.thread_id, suggestion);
    };

    return SuggestionThread;
  }
]);
