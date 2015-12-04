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
 * @fileoverview Controller for the exploration editor feedback tab.
 *
 * @author kashida@google.com (Koji Ashida)
 */

oppia.controller('FeedbackTab', [
    '$scope', '$http', '$modal', '$timeout', '$rootScope', 'warningsData',
    'oppiaDatetimeFormatter', 'threadStatusDisplayService',
    'threadDataService',
    function(
      $scope, $http, $modal, $timeout, $rootScope, warningsData,
      oppiaDatetimeFormatter, threadStatusDisplayService,
      threadDataService) {

  $scope.STATUS_CHOICES = threadStatusDisplayService.STATUS_CHOICES;
  $scope.threadData = threadDataService.data;
  $scope.getLabelClass = threadStatusDisplayService.getLabelClass;
  $scope.getHumanReadableStatus = (
    threadStatusDisplayService.getHumanReadableStatus);
  $scope.getLocaleAbbreviatedDatetimeString = (
    oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);

  $scope.activeThread = null;
  $rootScope.loadingMessage = 'Loading';
  $scope.tmpMessage = {
    status: null,
    text: ''
  };

  var _resetTmpMessageFields = function() {
    $scope.tmpMessage.status = $scope.activeThread ? $scope.activeThread.status : null;
    $scope.tmpMessage.text = '';
  };

  $scope.clearActiveThread = function() {
    $scope.activeThread = null;
    _resetTmpMessageFields();
  };

  $scope.showCreateThreadModal = function() {
    $modal.open({
      templateUrl: 'modals/editorFeedbackCreateThread',
      backdrop: true,
      resolve: {},
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.newThreadSubject = '';
        $scope.newThreadText = '';

        $scope.create = function(newThreadSubject, newThreadText) {
          if (!newThreadSubject) {
            warningsData.addWarning('Please specify a thread subject.');
            return;
          }
          if (!newThreadText) {
            warningsData.addWarning('Please specify a message.');
            return;
          }

          $modalInstance.close({
            newThreadSubject: newThreadSubject,
            newThreadText: newThreadText
          });
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      }]
    }).result.then(function(result) {
      threadDataService.createNewThread(
        result.newThreadSubject, result.newThreadText, function() {
          $scope.clearActiveThread();
        });
    });
  };

  $scope.showSuggestionModal = function() {
    $modal.open({
      templateUrl: 'modals/editorViewSuggestion',
      backdrop: true,
      size: 'lg',
      resolve: {
        suggestion: function() {
          return $scope.activeThread.suggestion;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'suggestion',
        function($scope, $modalInstance, suggestion) {
        $scope.oldContent = suggestion.state_content.old_content;
        $scope.newContent = suggestion.state_content.new_content;

        $scope.acceptSuggestion = function() {
          $modalInstance.close({
            action: 'accept'
          });
        };

        $scope.rejectSuggestion = function() {
          $modalInstance.close({
            action: 'reject'
          });
        };

        $scope.cancelReview = function() {
          $modalInstance.dismiss('cancel');
        };
      }]
    }).result.then(function(result) {
      threadDataService.resolveSuggestion($scope.activeThread.suggestion.suggestion.id, result.action);
      // Update the status of the feedback thread.
      var msg, status;
      if (result.action === 'accept') {
        msg = 'Suggestion accepted.';
        status = 'fixed';
      } else {
        msg = 'Suggestion rejected.';
        status = 'not_actionable';
      }
      $scope.addNewMessage($scope.activeThread.thread_id, msg, status);
    });
  };

  $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
    if (threadId === null) {
      warningsData.addWarning('Cannot add message to thread with ID: null.');
      return;
    }
    if (!tmpStatus) {
      warningsData.addWarning('Invalid message status: ' + tmpStatus);
      return;
    }

    $scope.messageSendingInProgress = true;
    threadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
      _resetTmpMessageFields();
      $scope.messageSendingInProgress = false;
    }, function() {
      $scope.messageSendingInProgress = false;
    });
  };

  $scope.setActiveThread = function(threadId) {
    threadDataService.fetchMessages(threadId);

    for (var i = 0; i < $scope.threadData.threadList.length; i++) {
      if ($scope.threadData.threadList[i].thread_id === threadId) {
        $scope.activeThread = $scope.threadData.threadList[i];
        break;
      }
    }

    $scope.tmpMessage.status = $scope.activeThread.status;
  };

  // Initial load of the thread list on page load.
  $scope.clearActiveThread();
  threadDataService.fetchThreads(function() {
    $timeout(function() {
      $rootScope.loadingMessage = '';
    }, 500);
  });
}]);
