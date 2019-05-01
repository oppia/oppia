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
    var THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;
    var SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler';
    var SUGGESTION_ACTION_HANDLER_URL = '/suggestionactionhandler/' +
        'exploration/' + expId + '/';
    var THREAD_HANDLER_PREFIX = '/threadhandler/';
    var FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event';
    var THREAD_STATUS_OPEN = 'open';

    // All the threads for this exploration. This is a list whose entries are
    // objects, each representing threads. The 'messages' key of this object
    // are updated lazily.
    var data = {
      feedbackThreads: [],
      suggestionThreads: []
    };

    // Helper to remember which thread objects are associated to an id.
    var threadsById = {};

    // Number of open threads that need action
    var openThreadsCount = 0;

    // Helper which creates a function which compares two objects by a property.
    var compareBy = function(propertyName) {
      return function(lhs, rhs) {
        var lhsProp = lhs[propertyName];
        var rhsProp = rhs[propertyName];
        return (lhsProp === rhsProp) ? 0 : (lhsProp < rhsProp) ? -1 : 1;
      };
    };

    var fetchThreads = function(successCallback = function() {}) {
      var threadsPromise = $http.get(THREAD_LIST_HANDLER_URL);
      var suggestionsPromise = $http.get(SUGGESTION_LIST_HANDLER_URL, {
        params: {target_type: 'exploration', target_id: expId},
      });

      return $q.all([threadsPromise, suggestionsPromise]).then(function(res) {
        var threadsData = res[0].data;
        var suggestionsData = res[1].data;

        var feedbackThreadBackendDicts = threadsData.feedback_thread_dicts;
        var suggestionThreadBackendDicts = threadsData.suggestion_thread_dicts;
        var suggestionObjectBackendDicts = suggestionsData.suggestions;

        threadsById = {};

        data.feedbackThreads = [];
        feedbackThreadBackendDicts.forEach(function(backendDict) {
          var feedbackThread =
            FeedbackThreadObjectFactory.createFromBackendDict(backendDict);
          threadsById[feedbackThread.threadId] = feedbackThread;
          data.feedbackThreads.push(feedbackThread);
        });

        data.suggestionThreads = [];
        suggestionObjectBackendDicts.sort(compareBy('suggestion_id'));
        suggestionThreadBackendDicts.sort(compareBy('thread_id'));
        for (var i = 0; i < suggestionThreadBackendDicts.length; ++i) {
          var suggestionObjectBackendDict = suggestionObjectBackendDicts[i];
          var suggestionThreadBackendDict = suggestionThreadBackendDicts[i];

          // Error-handling for any missing data. Both dicts are sorted by id,
          // so we check here that each pair of dicts refers to the same id,
          // otherwise, we skip to another pair after logging an error.
          var hasSuggestionObject = (suggestionObjectBackendDict !== undefined);
          var hasSuggestionThread = (suggestionThreadBackendDict !== undefined);

          if (hasSuggestionObject && !hasSuggestionThread) {
            $log.error(
              'Suggestion Object with id "' +
              suggestionObjectBackendDict.suggestion_id + '" has no ' +
              'associated Suggestion Thread in the backend.');
            break;
          } else if (!hasSuggestionObject && hasSuggestionThread) {
            $log.error(
              'Suggestion Thread with id "' +
              suggestionThreadBackendDict.thread_id + '" has no associated ' +
              'Suggestion Object in the backend.');
            break;
          } else if (hasSuggestionObject && hasSuggestionThread) {
            var suggestionId = suggestionObjectBackendDict.suggestion_id;
            var threadId = suggestionThreadBackendDict.thread_id;

            if (suggestionId !== threadId) {
              if (suggestionId < threadId) {
                $log.error(
                  'Suggestion Object with id "' + suggestionId + '" has no ' +
                  'associated Suggestion Thread in the backend.');
                suggestionObjectBackendDicts.splice(i, 1);
              } else {
                $log.error(
                  'Suggestion Thread with id "' + threadId + '" has no ' +
                  'associated Suggestion Object in the backend.');
                suggestionThreadBackendDicts.splice(i, 1);
              }
              // Try again after removing the mismatched element since there
              // still might be valid suggestion data left.
              --i;
              continue;
            }
          }
          // Error handling done; the dicts are safe to use.

          var suggestionThread =
            SuggestionThreadObjectFactory.createFromBackendDicts(
              suggestionThreadBackendDict, suggestionObjectBackendDict);
          threadsById[suggestionThread.threadId] = suggestionThread;
          data.suggestionThreads.push(suggestionThread);
        }

        if (successCallback) {
          successCallback();
        }
      });
    };

    var fetchMessages = function(threadId) {
      return $http.get(THREAD_HANDLER_PREFIX + threadId).then(function(res) {
        threadsById[threadId].setMessages(res.data.messages);
      });
    };

    return {
      data: data,
      fetchThreads: function(successCallback) {
        return fetchThreads(successCallback);
      },
      fetchMessages: function(threadId) {
        return fetchMessages(threadId);
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
        $http.post(THREAD_LIST_HANDLER_URL, {
          state_name: null,
          subject: newSubject,
          text: newText,
        }).then(function() {
          openThreadsCount += 1;
          fetchThreads();
          if (successCallback) {
            successCallback();
          }
        }, function() {
          AlertsService.addWarning('Error creating new thread.');
        });
      },
      markThreadAsSeen: function(threadId) {
        $http.post(FEEDBACK_THREAD_VIEW_EVENT_URL + '/' + threadId, {
          thread_id: threadId
        });
      },
      addNewMessage: function(
          threadId, newMessage, newStatus, onSuccess, onFailure) {
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
          fetchMessages(threadId);

          if (onSuccess) {
            onSuccess();
          }
        }, function() {
          if (onFailure) {
            onFailure();
          }
        });
      },
      resolveSuggestion: function(
          threadId, action, commitMsg, reviewMsg, audioUpdateRequired,
          onSuccess, onFailure) {
        if (action !== ACTION_ACCEPT_SUGGESTION) {
          commitMsg = null;
        }
        return $http.put(SUGGESTION_ACTION_HANDLER_URL + threadId, {
          action: action,
          review_message: reviewMsg,
          commit_message: commitMsg,
        }).then(function() {
          openThreadsCount -= 1;
          if (onSuccess) {
            onSuccess();
          }
        }, function() {
          if (onFailure) {
            onFailure();
          }
        });
      }
    };
  }
]);
