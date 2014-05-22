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

function ExplorationFeedback($scope, $http,
    warningsData, oppiaRequestCreator, explorationData) {
  var expId = explorationData.explorationId;
  var getThreadList = function() {
    $http.get('/threadlist/' + expId).success(function(data) {
      $scope.threads = data.threads;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error getting thread list.');
    });
  };

  var getThread = function() {
    $http.get('/thread/' + $scope.currentThreadId).success(function(data) {
      $scope.messages = data.messages;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error getting thread messages.');
    });
  };

  $scope.createThread = function() {
    $http.post(
        '/threadlist/create/' + expId,
        oppiaRequestCreator.createRequest({
          state_id: $scope.newThreadStateId,
          original_author_id: $scope.newThreadAuthorId,
          subject: $scope.newThreadSubject,
          text: $scope.newThreadText,
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function() {
      getThreadList();
      $scope.unselectThread();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error creating a thread.');
    });
  };

  $scope.createMessage = function() {
    $http.post(
        '/thread/create/' + $scope.currentThreadId,
        oppiaRequestCreator.createRequest({
          exploration_id: expId,
          thread_id: $scope.currentThreadId,
          message_id: $scope.messages.length,
          author_id: $scope.newMessageUserId,
          updated_status: $scope.newMessageStatus,
          updated_subject: $scope.newMessageSubject,
          text: $scope.newMessageText,
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function() {
      getThreadList();
      getThread();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error creating a thread message.');
    });
  };

  $scope.selectThread = function(thread) {
    $scope.currentThreadId = thread.thread_id
    getThread();
    console.log(thread.thead_id);
  };

  $scope.unselectThread = function() {
    $scope.currentThreadId = null
    $scope.messages = undefined;
  };

  // Initial load of the thread list.
  $scope.currentThreadId = null;
  getThreadList();
}
ExplorationFeedback.$inject = ['$scope', '$http',
    'warningsData', 'oppiaRequestCreator', 'explorationData'];
