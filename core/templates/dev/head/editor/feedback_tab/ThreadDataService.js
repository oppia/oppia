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

oppia.factory('threadDataService', [
    '$http', 'explorationData', function($http, explorationData) {
  var expId = explorationData.explorationId;
  var _THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;
  var _THREAD_HANDLER_PREFIX = '/threadhandler/' + expId + '/';

  // All the threads for this exploration. This is a list whose entries are
  // objects, each representing threads. The 'messages' key of this object
  // is updated lazily.
  var _data = {
    threadList: []
  };

  var _reloadFromBackend = function(successCallback) {
    $http.get(_THREAD_LIST_HANDLER_URL).success(function(data) {
      _data.threadList = data.threads;
      if (successCallback) {
        successCallback();
      }
    });
  };

  var _loadMessagesFromBackend = function(threadId) {
    $http.get(_THREAD_HANDLER_PREFIX + threadId).success(function(data) {
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
    reloadFromBackend: function(successCallback) {
      _reloadFromBackend(successCallback);
    },
    loadMessagesFromBackend: function(threadId) {
      _loadMessagesFromBackend(threadId);
    },
    createNewThread: function(newSubject, newText, successCallback) {
      $http.post(_THREAD_LIST_HANDLER_URL, {
        state_name: null,
        subject: newSubject,
        text: newText
      }).success(function() {
        _reloadFromBackend();
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
        _loadMessagesFromBackend(threadId);

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
