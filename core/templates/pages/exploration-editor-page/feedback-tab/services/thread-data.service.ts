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

require('domain/feedback_message/ThreadMessageObjectFactory.ts');
require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/exploration-editor-page/exploration-editor-page.constants.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/suggestions.service.ts');

import { FeedbackThread, FeedbackThreadBackendDict } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionThread } from
  'domain/suggestion/SuggestionThreadObjectFactory';
import { ThreadMessage } from
  'domain/feedback_message/ThreadMessageObjectFactory';
import { SuggestionBackendDict } from
  'domain/suggestion/SuggestionObjectFactory';

type AnyThread = FeedbackThread | SuggestionThread;

interface SuggestionAndFeedbackThreads {
  feedbackThreads: FeedbackThread[];
  suggestionThreads: SuggestionThread[];
}

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
    // Container for all of the threads related to this exploration.
    let threadsById = new Map<string, AnyThread>();

    // Cached number of open threads requiring action.
    let openThreadsCount: number = 0;

    let getFeedbackStatsHandlerUrl = function(): string {
      return UrlInterpolationService.interpolateUrl(
        '/feedbackstatshandler/<exploration_id>', {
          exploration_id: ContextService.getExplorationId()
        });
    };

    let getFeedbackThreadViewEventUrl = function(threadId: string): string {
      return UrlInterpolationService.interpolateUrl(
        '/feedbackhandler/thread_view_event/<thread_id>', {
          thread_id: threadId
        });
    };

    let getSuggestionActionHandlerUrl = function(threadId: string): string {
      return UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/exploration/<exploration_id>/<thread_id>', {
          exploration_id: ContextService.getExplorationId(),
          thread_id: threadId
        });
    };

    let getSuggestionListHandlerUrl = function(): string {
      return '/suggestionlisthandler';
    };

    let getThreadHandlerUrl = function(threadId: string): string {
      return UrlInterpolationService.interpolateUrl(
        '/threadhandler/<thread_id>', {
          thread_id: threadId
        });
    };

    let getThreadListHandlerUrl = function(): string {
      return UrlInterpolationService.interpolateUrl(
        '/threadlisthandler/<exploration_id>', {
          exploration_id: ContextService.getExplorationId()
        });
    };

    let setFeedbackThreadFromBackendDict = function(
        threadBackendDict: FeedbackThreadBackendDict): FeedbackThread {
      if (!threadBackendDict) {
        throw new Error('Missing input backend dict');
      }
      let thread = FeedbackThreadObjectFactory.createFromBackendDict(
        threadBackendDict);
      threadsById.set(thread.threadId, thread);
      return thread;
    };

    let setSuggestionThreadFromBackendDicts = function(
        threadBackendDict: FeedbackThreadBackendDict,
        suggestionBackendDict: SuggestionBackendDict): SuggestionThread {
      if (!threadBackendDict || !suggestionBackendDict) {
        throw new Error('Missing input backend dicts');
      }
      let thread = SuggestionThreadObjectFactory.createFromBackendDicts(
        threadBackendDict, suggestionBackendDict);
      threadsById.set(thread.threadId, thread);
      return thread;
    };

    return {
      getThread: function(threadId: string): AnyThread {
        return threadsById.get(threadId) || null;
      },

      getThreadsAsync: function(): Promise<SuggestionAndFeedbackThreads> {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        let suggestionsPromise = $http.get(getSuggestionListHandlerUrl(), {
          params: {
            target_type: 'exploration',
            target_id: ContextService.getExplorationId()
          }
        });
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        let threadsPromise = $http.get(getThreadListHandlerUrl());

        return $q.all([suggestionsPromise, threadsPromise]).then(response => {
          let [suggestionData, threadData] = response.map(r => r.data);
          let suggestionBackendDicts: SuggestionBackendDict[] = (
            suggestionData.suggestions);
          let feedbackThreadBackendDicts = threadData.feedback_thread_dicts;
          let suggestionThreadBackendDicts = threadData.suggestion_thread_dicts;

          let suggestionBackendDictsByThreadId = new Map(
            suggestionBackendDicts.map(dict => [
              SuggestionsService.getThreadIdFromSuggestionBackendDict(dict),
              dict
            ]));

          return {
            feedbackThreads: feedbackThreadBackendDicts.map(
              dict => setFeedbackThreadFromBackendDict(dict)),
            suggestionThreads: suggestionThreadBackendDicts.map(
              dict => setSuggestionThreadFromBackendDicts(
                dict, suggestionBackendDictsByThreadId.get(dict.thread_id)))
          };
        },
        () => $q.reject('Error on retrieving feedback threads.'));
      },

      getMessagesAsync: function(thread: AnyThread): Promise<ThreadMessage[]> {
        if (!thread) {
          throw new Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.get(getThreadHandlerUrl(threadId)).then(response => {
          let threadMessageBackendDicts = response.data.messages;
          thread.setMessages(threadMessageBackendDicts.map(
            m => ThreadMessageObjectFactory.createFromBackendDict(m)));
          return thread.getMessages();
        });
      },

      getOpenThreadsCountAsync: function(): Promise<number> {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.get(getFeedbackStatsHandlerUrl()).then(response => {
          return openThreadsCount = response.data.num_open_threads;
        });
      },

      getOpenThreadsCount: function(): number {
        return openThreadsCount;
      },

      createNewThreadAsync: function(
          newSubject: string, newText: string): Promise<void> {
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.post(getThreadListHandlerUrl(), {
          state_name: null,
          subject: newSubject,
          text: newText
        }).then(() => {
          openThreadsCount += 1;
          return this.getThreadsAsync();
        },
        error => {
          AlertsService.addWarning('Error creating new thread: ' + error + '.');
        });
      },

      markThreadAsSeenAsync: function(thread: AnyThread): Promise<void> {
        if (!thread) {
          throw new Error('Trying to update a non-existent thread');
        }
        let threadId = thread.threadId;
        // TODO(#8016): Move this $http call to a backend-api.service with unit
        // tests.
        return $http.post(getFeedbackThreadViewEventUrl(threadId), {
          thread_id: threadId
        });
      },

      addNewMessageAsync: function(
          thread: AnyThread, newMessage: string,
          newStatus: string): Promise<ThreadMessage[]> {
        if (!thread) {
          throw new Error('Trying to update a non-existent thread');
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
          if (updatedStatus) {
            openThreadsCount += (newStatus === STATUS_OPEN) ? 1 : -1;
          }
          thread.status = newStatus;
          return this.getMessagesAsync(thread);
        });
      },

      resolveSuggestionAsync: function(
          thread: AnyThread, action: string, commitMsg: string,
          reviewMsg: string): Promise<ThreadMessage[]> {
        if (!thread) {
          throw new Error('Trying to update a non-existent thread');
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
          // instead of fetching the messages every time from the backend.
          return this.getMessagesAsync(thread);
        });
      }
    };
  }
]);
