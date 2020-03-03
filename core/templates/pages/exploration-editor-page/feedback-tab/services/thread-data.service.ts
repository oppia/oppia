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
require('services/suggestions.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('ThreadDataService', [
  '$http', '$q', 'AlertsService', 'ContextService',
  'FeedbackThreadObjectFactory', 'SuggestionThreadObjectFactory',
  'SuggestionsService', 'ThreadMessageObjectFactory', 'UrlInterpolationService',
  'ACTION_ACCEPT_SUGGESTION', 'STATUS_FIXED', 'STATUS_IGNORED', 'STATUS_OPEN',
  function(
      $http, $q, AlertsService, ContextService,
      FeedbackThreadObjectFactory, SuggestionThreadObjectFactory,
      SuggestionsService, ThreadMessageObjectFactory, UrlInterpolationService,
      ACTION_ACCEPT_SUGGESTION, STATUS_FIXED, STATUS_IGNORED, STATUS_OPEN) {
    let getFeedbackStatsHandlerUrl = (
      () => UrlInterpolationService.interpolateUrl(
        '/feedbackstatshandler/<exploration_id>', {
          exploration_id: ContextService.getExplorationId()
        }));
    let getThreadListHandlerUrl = (
      () => UrlInterpolationService.interpolateUrl(
        '/threadlisthandler/<exploration_id>', {
          exploration_id: ContextService.getExplorationId()
        }));
    let getSuggestionActionHandlerUrl = (
      threadId => UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/exploration/<exploration_id>/<thread_id>', {
          exploration_id: ContextService.getExplorationId(),
          thread_id: threadId
        }));
    let getThreadHandlerUrl = (
      threadId => UrlInterpolationService.interpolateUrl(
        '/threadhandler/<thread_id>', {
          thread_id: threadId
        }));
    let getFeedbackThreadViewEventUrl = (
      threadId => UrlInterpolationService.interpolateUrl(
        '/feedbackhandler/thread_view_event/<thread_id>', {
          thread_id: threadId
        }));
    let getSuggestionListHandlerUrl = () => '/suggestionlisthandler';

    // Holds all the threads for this exploration. This is an object whose
    // values are objects, each representing threads, keyed by their IDs.
    //
    // The messages of the thread objects are updated lazily.
    let threadsById = {};

    let getThreadById = (threadId) => threadsById[threadId] || null;

    // Cached number of open threads requiring action.
    let openThreadsCount = 0;

    let setFeedbackThreadFromBackendDict = threadBackendDict => {
      if (!threadBackendDict) {
        throw Error('Missing input backend dict');
      }
      let thread =
        FeedbackThreadObjectFactory.createFromBackendDict(threadBackendDict);
      return threadsById[thread.threadId] = thread;
    };

    let setSuggestionThreadFromBackendDicts = (
        threadBackendDict, suggestionBackendDict) => {
      if (!threadBackendDict || !suggestionBackendDict) {
        throw Error('Missing input backend dicts');
      }
      let thread = SuggestionThreadObjectFactory.createFromBackendDicts(
        threadBackendDict, suggestionBackendDict);
      return threadsById[thread.threadId] = thread;
    };

    return {
      getThread: function(threadId) {
        return getThreadById(threadId);
      },

      fetchThreads: function() {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        let suggestionPromise = $http.get(getSuggestionListHandlerUrl(), {
          params: {
            target_type: 'exploration',
            target_id: ContextService.getExplorationId(),
          }
        });
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        let threadPromise = $http.get(getThreadListHandlerUrl());

        return $q.all([suggestionPromise, threadPromise]).then(response => {
          let [suggestionResponse, threadResponse] = response.map(r => r.data);

          let suggestionBackendDictsByThreadId = {};
          suggestionResponse.suggestions.forEach(backendDict => {
            let threadId =
              SuggestionsService.getThreadIdFromSuggestionBackendDict(
                backendDict);
            suggestionBackendDictsByThreadId[threadId] = backendDict;
          });

          return {
            feedbackThreads: threadResponse.feedback_thread_dicts.map(
              setFeedbackThreadFromBackendDict),
            suggestionThreads: threadResponse.suggestion_thread_dicts.map(
              threadBackendDict => setSuggestionThreadFromBackendDicts(
                threadBackendDict,
                suggestionBackendDictsByThreadId[threadBackendDict.thread_id]))
          };
        });
      },

      fetchMessages: function(thread) {
        if (!thread) {
          throw Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;

        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.get(getThreadHandlerUrl(threadId))
          .then(response => thread.setMessages(response.data.messages.map(
            ThreadMessageObjectFactory.createFromBackendDict)));
      },

      fetchFeedbackStats: function() {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.get(getFeedbackStatsHandlerUrl())
          .then(response => openThreadsCount = response.data.num_open_threads);
      },

      getOpenThreadsCount: function() {
        return openThreadsCount;
      },

      createNewThread: function(newSubject, newText) {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.post(getThreadListHandlerUrl(), {
          state_name: null,
          subject: newSubject,
          text: newText
        }).then(() => {
          openThreadsCount += 1;
          return this.fetchThreads();
        },
        err => {
          AlertsService.addWarning('Error creating new thread: ' + err + '.');
        });
      },

      markThreadAsSeen: function(thread) {
        if (!thread) {
          throw Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.post(getFeedbackThreadViewEventUrl(threadId), {
          thread_id: threadId
        });
      },

      addNewMessage: function(thread, newMessage, newStatus) {
        if (!thread) {
          throw Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;
        let oldStatus = thread.status;
        let updatedStatus = (oldStatus === newStatus) ? null : newStatus;

        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.post(getThreadHandlerUrl(threadId), {
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
        if (!thread) {
          throw Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;

        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.put(getSuggestionActionHandlerUrl(threadId), {
          action: action,
          review_message: reviewMsg,
          commit_message: action === ACTION_ACCEPT_SUGGESTION ? commitMsg : null
        }).then(() => {
          thread.status =
            action === ACTION_ACCEPT_SUGGESTION ? STATUS_FIXED : STATUS_IGNORED;
          openThreadsCount -= 1;
          // TODO(#8678): Update the cache with the message
          // instead of fetching the messages everytime from the backend
          return this.fetchMessages(thread);
        });
      }
    };
  }
]);
