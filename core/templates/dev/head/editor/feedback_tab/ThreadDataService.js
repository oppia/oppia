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
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('threadDataService', [
    '$http', '$q', 'explorationData', function($http, $q, explorationData) {
  var _expId = explorationData.explorationId;
  var _THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + _expId;
  var _SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler/' + _expId;
  var _THREAD_HANDLER_PREFIX = '/threadhandler/' + _expId + '/';

  // All the threads for this exploration. This is a list whose entries are
  // objects, each representing threads. The 'messages' key of this object
  // is updated lazily.
  var _data = {
    threadList: []
  };

  var _fetchThreads = function(successCallback) {
    // UI test code: http://pastebin.com/DhL4fGnm
    var fPromise = $http.get(_THREAD_LIST_HANDLER_URL);
    var sPromise = $http.get(_SUGGESTION_LIST_HANDLER_URL, {
      params: {type: 'open'}
    });

    $q.all([fPromise, sPromise]).then(function(res) {
      _data.threadList = [].concat(res[0].data.threads, res[1].data.threads);
      if (successCallback) {
        successCallback();
      }
    });
  };

  var _fetchMessages = function(threadId) {
    $http.get(_THREAD_HANDLER_PREFIX 
        + threadId.split(".")[1]).success(function(data) {
      for (var i = 0; i < _data.threadList.length; i++) {
        if (_data.threadList[i].thread_id === threadId) {
          _data.threadList[i].messages = data.messages;
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
    createNewThread: function(newSubject, newText, successCallback) {
      $http.post(_THREAD_LIST_HANDLER_URL, {
        state_name: null,
        subject: newSubject,
        text: newText
      }).success(function() {
        _fetchThreads();
        if (successCallback) {
          successCallback();
        }
      });
    },
    addNewMessage: function(threadId, newMessage, newStatus, successCallback, errorCallback) {
      var url = _THREAD_HANDLER_PREFIX + threadId;
      var thread = null;

      for (var i = 0; i < _data.threadList.length; i++) {
        if (_data.threadList[i].thread_id === threadId) {
          thread = _data.threadList[i];
          thread.status = newStatus;
          break;
        }
      }

      // This is only set if the status has changed.
      var updatedStatus = null;
      if (newStatus !== thread.status) {
        updatedStatus = newStatus;
      }

      var payload = {
        updated_status: newStatus,
        updated_subject: null,
        text: newMessage
      };

      $http.post(url, payload).success(function(data) {
        _fetchMessages(threadId);

        if (successCallback) {
          successCallback();
        }
      }).error(function(data) {
        if (errorCallback) {
          errorCallback();
        }
      });
    }
  };
}]);
