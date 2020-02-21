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
  '$http', '$log', '$q', 'AlertsService', 'ExplorationDataService',
  'FeedbackThreadObjectFactory', 'SuggestionThreadObjectFactory',
  'ACTION_ACCEPT_SUGGESTION', 'STATUS_FIXED', 'STATUS_IGNORED',
  function(
      $http, $log, $q, AlertsService, ExplorationDataService,
      FeedbackThreadObjectFactory, SuggestionThreadObjectFactory,
      ACTION_ACCEPT_SUGGESTION, STATUS_FIXED, STATUS_IGNORED) {
    var _expId = ExplorationDataService.explorationId;
    var _FEEDBACK_STATS_HANDLER_URL = '/feedbackstatshandler/' + _expId;
    var _THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + _expId;
    var _SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler';
    var _SUGGESTION_ACTION_HANDLER_URL = '/suggestionactionhandler/' +
        'exploration/' + _expId + '/';
    var _THREAD_HANDLER_PREFIX = '/threadhandler/';
    var _FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event';
    var _THREAD_STATUS_OPEN = 'open';

    // All the threads for this exploration. This is a list whose entries are
    // objects, each representing threads. The 'messages' key of this object
    // is updated lazily.
    var _data = {
      feedbackThreads: [],
      suggestionThreads: []
    };

    // TODO(brianrodri@): Use a helper-object to give this function O(1)
    // complexity instead of O(N).
    var getThreadById = function(threadId) {
      var thread = null;
      var allThreads = _data.feedbackThreads.concat(_data.suggestionThreads);
      for (var i = 0; i < allThreads.length; i++) {
        if (allThreads[i].threadId === threadId) {
          thread = allThreads[i];
          break;
        }
      }
      return thread;
    };

    // Number of open threads that need action
    var _openThreadsCount = 0;

    var _fetchThreads = function() {
      var threadsPromise = $http.get(_THREAD_LIST_HANDLER_URL);
      var suggestionsPromise = $http.get(_SUGGESTION_LIST_HANDLER_URL, {
        params: {target_type: 'exploration', target_id: _expId}
      });

      return $q.all([threadsPromise, suggestionsPromise]).then(function(res) {
        let [threadsResponse, suggestionsResponse] = res.map(r => r.data);
        _data.feedbackThreads = threadsResponse.feedback_thread_dicts.map(
          FeedbackThreadObjectFactory.createFromBackendDict);

        _data.suggestionThreads = [];
        if (threadsResponse.suggestion_thread_dicts.length !==
            suggestionsResponse.suggestions.length) {
          $log.error('Number of suggestion threads doesn\'t match number of' +
                     'suggestion objects');
          return _data;
        }
        // TODO(brianrodri@): Move this pairing logic into the backend.
        for (let threadDict of threadsResponse.suggestion_thread_dicts) {
          for (let suggestionDict of suggestionsResponse.suggestions) {
            if (threadDict.thread_id === suggestionDict.suggestion_id) {
              _data.suggestionThreads.push(
                SuggestionThreadObjectFactory.createFromBackendDicts(
                  threadDict, suggestionDict));
              break;
            }
          }
        }
        return _data;
      });
    };

    var _fetchMessages = function(threadId) {
      return $http.get(_THREAD_HANDLER_PREFIX + threadId).then(function(res) {
        getThreadById(threadId).setMessages(res.data.messages);
      });
    };

    return {
      fetchThreads: function() {
        return _fetchThreads();
      },
      fetchMessages: function(threadId) {
        return _fetchMessages(threadId);
      },
      fetchFeedbackStats: function() {
        return $http.get(_FEEDBACK_STATS_HANDLER_URL).then(function(response) {
          _openThreadsCount = response.data.num_open_threads;
        });
      },
      getOpenThreadsCount: function() {
        return _openThreadsCount;
      },
      createNewThread: function(newSubject, newText, onSuccess) {
        return $http.post(_THREAD_LIST_HANDLER_URL, {
          state_name: null,
          subject: newSubject,
          text: newText
        }).then(function() {
          _openThreadsCount += 1;
          return _fetchThreads();
        }, function() {
          AlertsService.addWarning('Error creating new thread.');
        }).then(onSuccess);
      },
      markThreadAsSeen: function(threadId) {
        return $http.post(_FEEDBACK_THREAD_VIEW_EVENT_URL + '/' + threadId, {
          thread_id: threadId
        });
      },
      addNewMessage: function(
          threadId, newMessage, newStatus, onSuccess, onFailure) {
        var thread = getThreadById(threadId);
        if (thread === null) {
          return $q.reject('Can not add message to nonexistent thread.');
        }

        var oldStatus = thread.status;
        var updatedStatus = (oldStatus === newStatus) ? null : newStatus;

        return $http.post(_THREAD_HANDLER_PREFIX + threadId, {
          updated_status: updatedStatus,
          updated_subject: null,
          text: newMessage
        }).then(function() {
          thread.status = newStatus;
          if (updatedStatus) {
            if (oldStatus === _THREAD_STATUS_OPEN) {
              _openThreadsCount -= 1;
            } else if (newStatus === _THREAD_STATUS_OPEN) {
              _openThreadsCount += 1;
            }
          }
          return _fetchMessages(threadId);
        }).then(onSuccess, onFailure);
      },
      resolveSuggestion: function(
          threadId, action, commitMsg, reviewMsg, audioUpdateRequired,
          onSuccess, onFailure) {
        var thread = getThreadById(threadId);
        if (thread === null) {
          return $q.reject('Can not add message to nonexistent thread.');
        }

        return $http.put(_SUGGESTION_ACTION_HANDLER_URL + threadId, {
          action: action,
          review_message: reviewMsg,
          commit_message: action === ACTION_ACCEPT_SUGGESTION ? commitMsg : null
        }).then(function() {
          thread.status =
            action === ACTION_ACCEPT_SUGGESTION ? STATUS_FIXED : STATUS_IGNORED;
          _openThreadsCount -= 1;
          // TODO(#8678): Update the cache with the message
          // instead of fetching the messages everytime from the backend
          return _fetchMessages(threadId);
        }).then(onSuccess, onFailure);
      }
    };
  }
]);
