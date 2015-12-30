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
    'threadDataService', 'explorationStatesService', 'explorationData',
    function(
      $scope, $http, $modal, $timeout, $rootScope, warningsData,
      oppiaDatetimeFormatter, threadStatusDisplayService,
      threadDataService, explorationStatesService, explorationData) {

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

  // TODO(Allan): Implement ability to edit suggestions before applying.
  $scope.showSuggestionModal = function() {
    $modal.open({
      templateUrl: 'modals/editorViewSuggestion',
      backdrop: true,
      size: 'lg',
      resolve: {
        activeThread: function() {
          return $scope.activeThread;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'activeThread', 'explorationData',
        function($scope, $modalInstance, activeThread, explorationData) {
        var suggestion = activeThread.suggestion;
        var states = explorationData.data.states;
        $scope.oldContent = states[suggestion.state_name].content[0].value;
        $scope.newContent = suggestion.state_content.value;
        $scope.commitMessage = '';

        $scope.acceptSuggestion = function() {
          $modalInstance.close({
            action: 'accept',
            commitMsg: $scope.commitMessage
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

        $scope.suggestionValid = function() {
          return (activeThread.status === 'open' &&
            explorationData.data.version === suggestion.exploration_version);
        }
      }]
    }).result.then(function(result) {
      threadDataService.resolveSuggestion(
        $scope.activeThread.thread_id, result.action, result.commitMsg,
        function(res) {
          threadDataService.fetchThreads(function() {
            $scope.setActiveThread($scope.activeThread.thread_id);
          });
          // Immediately update editor to reflect accepted suggestion.
          if(result.action === 'accept') {
            var suggestion = $scope.activeThread.suggestion;
            var stateName = suggestion.state_name;
            var state = angular.copy(explorationData.data.states[stateName]);
            state.content[0].value = suggestion.state_content.value;
            explorationStatesService.setState(stateName, state);
            $rootScope.$broadcast('refreshStateEditor');
          }
        }, function(res) {
          console.log("Error resolving suggestion");
        });
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

    var combined = [].concat(
      $scope.threadData.feedbackThreads, $scope.threadData.suggestionThreads);
    for (var i = 0; i < combined.length; i++) {
      if (combined[i].thread_id === threadId) {
        $scope.activeThread = combined[i];
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
