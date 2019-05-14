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

oppia.factory('ThreadDataService', [
  '$http', '$log', '$q', 'AlertsService', 'ExplorationDataService',
  'FeedbackThreadObjectFactory', 'SuggestionObjectFactory',
  'SuggestionThreadObjectFactory', 'ACTION_ACCEPT_SUGGESTION',
  function(
      $http, $log, $q, AlertsService, ExplorationDataService,
      FeedbackThreadObjectFactory, SuggestionObjectFactory,
      SuggestionThreadObjectFactory, ACTION_ACCEPT_SUGGESTION) {
    var expId = ExplorationDataService.explorationId;
    var FEEDBACK_STATS_HANDLER_URL = '/feedbackstatshandler/' + expId;
    var FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event';
    var SUGGESTION_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/exploration/' + expId + '/');
    var SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler';
    var THREAD_HANDLER_PREFIX = '/threadhandler/';
    var THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;
    var THREAD_STATUS_OPEN = 'open';

    // All the threads for this exploration. This is a list whose entries are
    // objects, each representing threads. The 'messages' key of this object
    // are updated lazily.
    var data = {
      feedbackThreads: [],
      suggestionThreads: [],
    };

    // Helper object to efficiently remember which thread objects are associated
    // to which id.
    var threadsById = {};

    // Number of open threads that need action
    var openThreadsCount = 0;

    // Helper which creates a function which compares two objects by a property.
    var compareBy = function(propertyName) {
      return function(lhs, rhs) {
        var lhsKey = lhs[propertyName];
        var rhsKey = rhs[propertyName];
        return (lhsKey === rhsKey) ? 0 : (lhsKey < rhsKey) ? -1 : 1;
      };
    };

    // Removes invalid elements from the arrays while logging helpful errors.
    var sanitizeSuggestionBackendDicts = function(
        suggestionThreadBackendDicts, suggestionObjectBackendDicts) {
      suggestionThreadBackendDicts.sort(compareBy('thread_id'));
      suggestionObjectBackendDicts.sort(compareBy('suggestion_id'));

      for (var i = 0; i < suggestionThreadBackendDicts.length; ++i) {
        var suggestionThreadBackendDict = suggestionThreadBackendDicts[i];
        var suggestionObjectBackendDict = suggestionObjectBackendDicts[i];

        var hasSuggestionThread = (suggestionThreadBackendDict !== undefined);
        var hasSuggestionObject = (suggestionObjectBackendDict !== undefined);

        if (hasSuggestionThread && hasSuggestionObject) {
          var threadId = suggestionThreadBackendDict.thread_id;
          var suggestionId = suggestionObjectBackendDict.suggestion_id;
          if (threadId < suggestionId) {
            $log.error(
              'Suggestion Thread with id "' + threadId + '" has no ' +
              'associated Suggestion Object in the backend.');
            suggestionThreadBackendDicts.splice(i, 1);
            --i; // Try this index again.
          } else if (suggestionId < threadId) {
            $log.error(
              'Suggestion Object with id "' + suggestionId + '" has no ' +
              'associated Suggestion Thread in the backend.');
            suggestionObjectBackendDicts.splice(i, 1);
            --i; // Try this index again.
          }
        } else if (hasSuggestionThread && !hasSuggestionObject) {
          $log.error(
            'Suggestion Thread with id "' +
            suggestionThreadBackendDict.thread_id + '" has no associated ' +
            'Suggestion Object in the backend.');
          // Remove all remaining elements.
          suggestionThreadBackendDicts.length = i;
        } else if (!hasSuggestionThread && hasSuggestionObject) {
          $log.error(
            'Suggestion Object with id "' +
            suggestionObjectBackendDict.suggestion_id + '" has no ' +
            'associated Suggestion Thread in the backend.');
          // Remove all remaining elements.
          suggestionObjectBackendDicts.length = i;
        }
      }
    };

    return {
      data: data,
      fetchThreads: function(successCallback) {
        return $q.all([
          $http.get(THREAD_LIST_HANDLER_URL),
          $http.get(SUGGESTION_LIST_HANDLER_URL, {
            params: {target_type: 'exploration', target_id: expId},
          }),
        ]).then(function(responses) {
          var threads = responses[0].data;
          var suggestions = responses[1].data;
          var feedbackThreadBackendDicts = threads.feedback_thread_dicts;
          var suggestionThreadBackendDicts = threads.suggestion_thread_dicts;
          var suggestionObjectBackendDicts = suggestions.suggestions;

          threadsById = {};

          data.feedbackThreads = [];
          feedbackThreadBackendDicts.forEach(function(backendDict) {
            var feedbackThread =
              FeedbackThreadObjectFactory.createFromBackendDict(backendDict);
            threadsById[feedbackThread.threadId] = feedbackThread;
            data.feedbackThreads.push(feedbackThread);
          });

          data.suggestionThreads = [];
          sanitizeSuggestionBackendDicts(
            suggestionThreadBackendDicts, suggestionObjectBackendDicts);
          for (var i = 0; i < suggestionThreadBackendDicts.length; ++i) {
            var suggestionThread =
              SuggestionThreadObjectFactory.createFromBackendDicts(
                suggestionThreadBackendDicts[i],
                suggestionObjectBackendDicts[i]);
            threadsById[suggestionThread.threadId] = suggestionThread;
            data.suggestionThreads.push(suggestionThread);
          }
        }).then(successCallback);
      },
      fetchMessages: function(threadId) {
        return $http.get(THREAD_HANDLER_PREFIX + threadId).then(function(res) {
          threadsById[threadId].setMessages(res.data.messages);
        });
      },
      fetchFeedbackStats: function() {
        $http.get(FEEDBACK_STATS_HANDLER_URL).then(function(response) {
          openThreadsCount = response.data.num_open_threads;
        });
      },
      getOpenThreadsCount: function() {
        return openThreadsCount;
      },
      createNewThread: function(newSubject, newText, successCallback) {
        var thisService = this;

        return $http.post(THREAD_LIST_HANDLER_URL, {
          state_name: null,
          subject: newSubject,
          text: newText,
        }).then(function() {
          openThreadsCount += 1;
          return thisService.fetchThreads();
        }).then(successCallback, function(rejectionReason) {
          AlertsService.addWarning('Error creating new thread.');
          return $q.reject(rejectionReason);
        });
      },
      markThreadAsSeen: function(threadId) {
        return $http.post(FEEDBACK_THREAD_VIEW_EVENT_URL + '/' + threadId, {
          thread_id: threadId
        });
      },
      addNewMessage: function(
          threadId, newMessage, newStatus, onSuccess, onFailure) {
        var thisService = this;
        var thread = threadsById[threadId];
        var oldStatus = thread.status;

        return $http.post(THREAD_HANDLER_PREFIX + threadId, {
          updated_status: (newStatus === oldStatus) ? null : newStatus,
          updated_subject: null,
          text: newMessage,
        }).then(function() {
          thread.status = newStatus;
          if (oldStatus === THREAD_STATUS_OPEN) {
            openThreadsCount -= 1;
          } else if (newStatus === THREAD_STATUS_OPEN) {
            openThreadsCount += 1;
          }
          return thisService.fetchMessages(threadId);
        }).then(onSuccess, onFailure);
      },
      resolveSuggestion: function(
          threadId, action, commitMsg, reviewMsg, audioUpdateRequired,
          onSuccess, onFailure) {
        return $http.put(SUGGESTION_ACTION_HANDLER_URL + threadId, {
          action: action,
          review_message: reviewMsg,
          commit_message: (
            action === ACTION_ACCEPT_SUGGESTION) ? commitMsg : null,
        }).then(function() {
          openThreadsCount -= 1;
        }).then(onSuccess, onFailure);
      }
    };
  }
]);
