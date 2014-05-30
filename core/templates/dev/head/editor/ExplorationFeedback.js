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
 * @fileoverview Controller for the exploration feedback tab.
 *
 * @author kashida@google.com (Koji Ashida)
 */

function ExplorationFeedback($scope, $http, $modal,
    warningsData, oppiaRequestCreator, explorationData) {
  var expId = explorationData.explorationId;
  var THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;
  var THREAD_HANDLER_PREFIX = '/threadhandler/' + expId + '/';

  $scope._getThreadById = function(threadId) {
    for (var i = 0; i < $scope.threads.length; i++) {
      if ($scope.threads[i].thread_id == threadId) {
        return $scope.threads[i];
      }
    }
    return null;
  };

  $scope._createThread = function(newThreadSubject, newThreadText) {
    $http.post(
      THREAD_LIST_HANDLER_URL,
      oppiaRequestCreator.createRequest({
        state_name: null,
        subject: newThreadSubject,
        text: newThreadText,
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function() {
      getThreadList();
      $scope.deselectThread();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error creating a thread.');
    });
  };

  $scope.setCurrentThread = function(threadId) {
    if (threadId === null) {
      $scope.currentThreadId = null;
      $scope.currentThreadData = null;
      $scope.currentThreadMessages = null;
      return;
    }

    $http.get(THREAD_HANDLER_PREFIX + threadId).success(function(data) {
      $scope.currentThreadId = threadId;
      $scope.currentThreadData = $scope._getThreadById(threadId);
      $scope.currentThreadMessages = data.messages;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error getting thread messages.');
    });
  };

  var getThreadList = function() {
    $http.get(THREAD_LIST_HANDLER_URL).success(function(data) {
      $scope.threads = data.threads;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error getting thread list.');
    });
  };

  $scope.showCreateThreadModal = function() {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/editorFeedbackCreateThread',
      backdrop: 'static',
      resolve: {},
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.create = function(newThreadSubject, newThreadText) {
          if (!newThreadSubject) {
            warningsData.addWarning('Please specify a thread subject.');
            return;
          }
          if (!newThreadText) {
            warningsData.addWarning('Please specify a message.');
            return;
          }

          // Clear the form variables so that they are empty on the next load
          // of the modal.
          $scope.newThreadSubject = '';
          $scope.newThreadText = '';

          $modalInstance.close({
            newThreadSubject: newThreadSubject,
            newThreadText: newThreadText
          });
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(result) {
      $scope._createThread(result.newThreadSubject, result.newThreadText);
    });
  };

  $scope.addMessage = function(threadId, newMessageText) {
    if (threadId === null) {
      warningsData.addWarning(
        'Current thread ID not set. Required to create a message');
      return;
    }
    $http.post(
      THREAD_HANDLER_PREFIX + threadId,
      oppiaRequestCreator.createRequest({
        updated_status: null,
        updated_subject: null,
        text: newMessageText,
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function() {
      $scope.setCurrentThread(threadId);
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error creating a thread message.');
    });
  };

  // Initial load of the thread list.
  $scope.currentThreadId = null;
  $scope.currentThreadData = null;
  $scope.currentThreadMessages = null;
  getThreadList();
}

ExplorationFeedback.$inject = [
  '$scope', '$http', '$modal', 'warningsData', 'oppiaRequestCreator',
  'explorationData'];
