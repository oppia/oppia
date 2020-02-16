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
 * @fileoverview Service for getting thread data from the backend for the
 * feedback tab of the exploration editor.
 */

require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('pages/exploration-editor-page/exploration-editor-page.constants.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('ThreadDataService', [
  '$http', '$q', 'AlertsService', 'ExplorationDataService',
  'FeedbackThreadObjectFactory', 'SuggestionThreadObjectFactory',
  'ThreadMessageObjectFactory', 'ACTION_ACCEPT_SUGGESTION', 'STATUS_FIXED',
  'STATUS_IGNORED', 'STATUS_OPEN',
  function(
      $http, $q, AlertsService, ExplorationDataService,
      FeedbackThreadObjectFactory, SuggestionThreadObjectFactory,
      ThreadMessageObjectFactory, ACTION_ACCEPT_SUGGESTION, STATUS_FIXED,
      STATUS_IGNORED, STATUS_OPEN) {
    let expId = ExplorationDataService.explorationId;
    let FEEDBACK_STATS_HANDLER_URL = '/feedbackstatshandler/' + expId;
    let FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event';
    let SUGGESTION_ACTION_HANDLER_URL = '/suggestionactionhandler/' + expId;
    let SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler';
    let THREAD_HANDLER_URL = '/threadhandler';
    let THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;

    // Holds all the threads for this exploration. This is an object whose
    // values are objects, each representing threads, keyed by their IDs.
    //
    // The messages of the thread objects are updated lazily.
    let threadsById = {};

    // Cached number of open threads requiring action.
    let openThreadsCount = 0;

    let getThreadById = function(threadId) {
      return threadsById[threadId] || null;
    };

    let setFeedbackThreadFromBackendDict = function(threadBackendDict) {
      let threadId = threadBackendDict.thread_id;
      return threadsById[threadId] =
        FeedbackThreadObjectFactory.createFromBackendDict(threadBackendDict);
    };

    let setSuggestionThreadFromBackendDicts = function(
        threadBackendDict, suggestionBackendDictsByThreadId) {
      let threadId = threadBackendDict.thread_id;
      if (!suggestionBackendDictsByThreadId.hasOwnProperty(threadId)) {
        throw Error(
          'Suggestion thread (id: "' + threadId + '") has no suggestion');
      }
      return threadsById[threadId] =
        SuggestionThreadObjectFactory.createFromBackendDicts(
          threadBackendDict, suggestionBackendDictsByThreadId[threadId]);
    };

    let getThreadIdFromSuggestionBackendDict = function(suggestionBackendDict) {
      return suggestionBackendDict.suggestion_id;
    };

    return {
      getThread: function(threadId) {
        return getThreadById(threadId);
      },

      fetchThreads: function() {
        let suggestionPromise = $http.get(
          SUGGESTION_LIST_HANDLER_URL +
          '?target_type=exploration&target_id=' + expId);
        let threadPromise = $http.get(THREAD_LIST_HANDLER_URL);

        return $q.all([suggestionPromise, threadPromise]).then(response => {
          let [suggestionResponse, threadResponse] = response.map(r => r.data);
          let suggestionBackendDictsByThreadId = suggestionResponse.suggestions
            .reduce((backendDictsByThreadId, backendDict) => {
              let threadId = getThreadIdFromSuggestionBackendDict(backendDict);
              backendDictsByThreadId[threadId] = backendDict;
              return backendDictsByThreadId;
            }, {});

          return {
            feedbackThreads: threadResponse.feedback_thread_dicts.map(
              setFeedbackThreadFromBackendDict),
            suggestionThreads: threadResponse.suggestion_thread_dicts.map(
              threadBackendDict => setSuggestionThreadFromBackendDicts(
                threadBackendDict, suggestionBackendDictsByThreadId))
          };
        });
      },

      fetchMessages: function(thread) {
        let threadId = thread.threadId;

        return $http.get(THREAD_HANDLER_URL + '/' + threadId).then(response => {
          thread.setMessages(response.data.messages.map(
            ThreadMessageObjectFactory.createFromBackendDict));
        });
      },

      fetchFeedbackStats: function() {
        return $http.get(FEEDBACK_STATS_HANDLER_URL).then(response => {
          openThreadsCount = response.data.num_open_threads;
        });
      },

      getOpenThreadsCount: function() {
        return openThreadsCount;
      },

      createNewThread: function(newSubject, newText) {
        return $http.post(THREAD_LIST_HANDLER_URL, {
          state_name: null,
          subject: newSubject,
          text: newText
        }).then(() => {
          openThreadsCount += 1;
          return this.fetchThreads();
        }, err => {
          AlertsService.addWarning('Error creating new thread: ' + err + '.');
        });
      },

      markThreadAsSeen: function(thread) {
        let threadId = thread.threadId;

        return $http.post(FEEDBACK_THREAD_VIEW_EVENT_URL + '/' + threadId, {
          thread_id: threadId
        });
      },

      addNewMessage: function(thread, newMessage, newStatus) {
        let threadId = thread.threadId;
        let oldStatus = thread.status;
        let updatedStatus = (oldStatus === newStatus) ? null : newStatus;

        return $http.post(THREAD_HANDLER_URL + '/' + threadId, {
          updated_status: updatedStatus,
          updated_subject: null,
          text: newMessage
        }).then(() => {
          if (updatedStatus && oldStatus === STATUS_OPEN) {
            openThreadsCount -= 1;
          } else if (updatedStatus && newStatus === STATUS_OPEN) {
            openThreadsCount += 1;
          }
          thread.status = newStatus;
          return this.fetchMessages(thread);
        });
      },

      resolveSuggestion: function(
          thread, action, commitMsg, reviewMsg, audioUpdateRequired) {
        let threadId = thread.threadId;

        return $http.put(SUGGESTION_ACTION_HANDLER_URL + '/' + threadId, {
          action: action,
          review_message: reviewMsg,
          commit_message: action === ACTION_ACCEPT_SUGGESTION ? commitMsg : null
        }).then(() => {
          thread.status =
            action === ACTION_ACCEPT_SUGGESTION ? STATUS_FIXED : STATUS_IGNORED;
          openThreadsCount -= 1;
        });
      }
    };
  }
]);
