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
  '$http', '$q', 'ExplorationDataService', 'AlertsService',
  'ACTION_ACCEPT_SUGGESTION',
  function(
      $http, $q, ExplorationDataService, AlertsService,
      ACTION_ACCEPT_SUGGESTION) {
    var _expId = ExplorationDataService.explorationId;
    var _FEEDBACK_STATS_HANDLER_URL = '/feedbackstatshandler/' + _expId;
    var _THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + _expId;
    var _SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler/' + _expId;
    var _SUGGESTION_ACTION_HANDLER_URL = '/suggestionactionhandler/' +
      _expId + '/';
    var _THREAD_HANDLER_PREFIX = '/threadhandler/';
    var _FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event';
    var _THREAD_STATUS_OPEN = 'open';

    if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
      _SUGGESTION_LIST_HANDLER_URL = '/generalsuggestionlisthandler';
      _SUGGESTION_ACTION_HANDLER_URL = '/generalsuggestionactionhandler/' +
        'exploration/' + _expId + '/';
    }

    // All the threads for this exploration. This is a list whose entries are
    // objects, each representing threads. The 'messages' key of this object
    // is updated lazily.
    var _data = {
      feedbackThreads: [],
      suggestionThreads: []
    };

    // Number of open threads that need action
    var _openThreadsCount = 0;

    var _fetchThreads = function(successCallback) {
      var fPromise = $http.get(_THREAD_LIST_HANDLER_URL);
      var params = {
        list_type: 'all',
        has_suggestion: true
      };
      if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
        params = {
          list_type: 'target',
          target_type: 'exploration',
          target_id: _expId
        };
      }
      var sPromise = $http.get(_SUGGESTION_LIST_HANDLER_URL, {
        params: params
      });

      $q.all([fPromise, sPromise]).then(function(res) {
        _data.feedbackThreads = res[0].data.threads;
        _data.suggestionThreads = [];
        if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
          for (var i = 0; i < res[1].data.suggestions.length; i++) {
            suggestion = res[1].data.suggestions[i];
            suggestion.thread_id = suggestion.suggestion_id.slice(
              suggestion.suggestion_id.indexOf('.') + 1);
            _data.suggestionThreads.push(suggestion);
          }
          for (var i = 0; i < _data.suggestionThreads.length; i++) {
            for (var j = 0; j < _data.feedbackThreads.length; j++) {
              if (_data.suggestionThreads[i].thread_id ===
                  _data.feedbackThreads[j].thread_id) {
                _data.suggestionThreads[i].subject = (
                  _data.feedbackThreads[j].subject);
                _data.suggestionThreads[i].description = (
                  _data.feedbackThreads[j].description);
                _data.feedbackThreads.splice(j, 1);
                // As only one feedback thread can link to one suggestion thread
                // We can stop the inner loop when we find a match and move on
                // to the next suggestion thread.
                break;
              }
            }
          }
        } else {
          _data.suggestionThreads = res[1].data.threads;
        }
        if (successCallback) {
          successCallback();
        }
      });
    };

    var _fetchMessages = function(threadId) {
      $http.get(_THREAD_HANDLER_PREFIX + threadId).then(function(response) {
        var allThreads = _data.feedbackThreads.concat(_data.suggestionThreads);
        for (var i = 0; i < allThreads.length; i++) {
          if (allThreads[i].thread_id === threadId) {
            allThreads[i].messages = response.data.messages;
            allThreads[i].suggestion = response.data.suggestion;
            break;
          }
        }
      });
    };

    return {
      data: _data,
      fetchThreads: function(successCallback) {
        _fetchThreads(successCallback);
      },
      fetchMessages: function(threadId) {
        _fetchMessages(threadId);
      },
      fetchFeedbackStats: function() {
        $http.get(_FEEDBACK_STATS_HANDLER_URL).then(function(response) {
          _openThreadsCount = response.data.num_open_threads;
        });
      },
      getOpenThreadsCount: function() {
        return _openThreadsCount;
      },
      createNewThread: function(newSubject, newText, successCallback) {
        _openThreadsCount += 1;
        $http.post(_THREAD_LIST_HANDLER_URL, {
          state_name: null,
          subject: newSubject,
          text: newText
        }).then(function() {
          _fetchThreads();
          if (successCallback) {
            successCallback();
          }
        }, function() {
          _openThreadsCount -= 1;
          AlertsService.addWarning('Error creating new thread.');
        });
      },
      markThreadAsSeen: function(threadId) {
        var requestUrl = _FEEDBACK_THREAD_VIEW_EVENT_URL + '/' + threadId;
        $http.post(requestUrl, {
          thread_id: threadId
        });
      },
      addNewMessage: function(
          threadId, newMessage, newStatus, successCallback, errorCallback) {
        var url = _THREAD_HANDLER_PREFIX + threadId;
        var allThreads = _data.feedbackThreads.concat(_data.suggestionThreads);
        var thread = null;

        for (var i = 0; i < allThreads.length; i++) {
          if (allThreads[i].thread_id === threadId) {
            thread = allThreads[i];
            break;
          }
        }

        // This is only set if the status has changed.
        // Assume a successful POST, in case of an error
        // the changes are reverted in the error callback.
        var updatedStatus = null;
        var oldStatus = thread.status;
        if (newStatus !== oldStatus) {
          updatedStatus = newStatus;
          if (oldStatus === _THREAD_STATUS_OPEN) {
            _openThreadsCount -= 1;
          } else if (newStatus === _THREAD_STATUS_OPEN) {
            _openThreadsCount += 1;
          }
          thread.status = updatedStatus;
        }

        var payload = {
          updated_status: updatedStatus,
          updated_subject: null,
          text: newMessage
        };

        $http.post(url, payload).then(function() {
          _fetchMessages(threadId);

          if (successCallback) {
            successCallback();
          }
        }, function() {
          // Revert changes
          if (newStatus !== oldStatus) {
            if (oldStatus === _THREAD_STATUS_OPEN) {
              _openThreadsCount += 1;
            } else if (newStatus === _THREAD_STATUS_OPEN) {
              _openThreadsCount -= 1;
            }
            thread.status = oldStatus;
          }
          if (errorCallback) {
            errorCallback();
          }
        });
      },
      resolveSuggestion: function(
          threadId, action, commitMsg, reviewMsg, audioUpdateRequired,
          onSuccess, onFailure) {
        var payload = {
          action: action
        };

        if (constants.USE_NEW_SUGGESTION_FRAMEWORK) {
          // TODO(nithesh): Remove manual construction of suggestion ID once the
          // feedback threads are migrated and threadId matches suggestionId.
          suggestionId = 'exploration.' + threadId;
          payload.review_message = reviewMsg;
          if (action === ACTION_ACCEPT_SUGGESTION) {
            payload.commit_message = commitMsg;
          }
          _openThreadsCount -= 1;
          $http.put(
            _SUGGESTION_ACTION_HANDLER_URL + suggestionId, payload).then(
            onSuccess, function() {
              _openThreadsCount += 1;
              if (onFailure) {
                onFailure();
              }
            }
          );
        } else {
          if (action === ACTION_ACCEPT_SUGGESTION) {
            payload.commit_message = commitMsg;
            payload.audio_update_required = audioUpdateRequired;
          }
          _openThreadsCount -= 1;
          $http.put(_SUGGESTION_ACTION_HANDLER_URL + threadId, payload).then(
            onSuccess, function() {
              _openThreadsCount += 1;
              if (onFailure) {
                onFailure();
              }
            }
          );
        }
      }
    };
  }
]);
