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

oppia.controller('ExplorationFeedback', [
    '$scope', '$http', '$modal', 'warningsData', 'explorationData', 'oppiaDatetimeFormatter',
    function($scope, $http, $modal, warningsData, explorationData, oppiaDatetimeFormatter) {
  var expId = explorationData.explorationId;
  var THREAD_LIST_HANDLER_URL = '/threadlisthandler/' + expId;
  var THREAD_HANDLER_PREFIX = '/threadhandler/' + expId + '/';

  $scope.getLocaleStringForDateWithoutSeconds = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch);
  };

  $scope._getThreadById = function(threadId) {
    for (var i = 0; i < $scope.threads.length; i++) {
      if ($scope.threads[i].thread_id == threadId) {
        return $scope.threads[i];
      }
    }
    return null;
  };

  $scope._getThreadList = function() {
    $http.get(THREAD_LIST_HANDLER_URL).success(function(data) {
      $scope.threads = data.threads;
    });
  };

  $scope._createThread = function(newThreadSubject, newThreadText) {
    $http.post(THREAD_LIST_HANDLER_URL, {
      state_name: null,
      subject: newThreadSubject,
      text: newThreadText
    }).success(function() {
      $scope._getThreadList();
      $scope.setCurrentThread(null);
      $scope.$parent.refreshFeedbackTabHeader();
    });
  };

  $scope.setCurrentThread = function(threadId) {
    if (threadId === null) {
      $scope.currentThreadId = null;
      $scope.currentThreadData = null;
      $scope.currentThreadMessages = null;
      $scope.updatedStatus = null;
      return;
    }

    $http.get(THREAD_HANDLER_PREFIX + threadId).success(function(data) {
      $scope.currentThreadId = threadId;
      $scope.currentThreadData = $scope._getThreadById(threadId);
      $scope.currentThreadMessages = data.messages;
      $scope.updatedStatus = $scope.currentThreadData.status;
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

  $scope.getLabelClass = function(status) {
    if (status === 'open') {
      return 'label label-info';
    } else {
      return 'label label-default';
    }
  };

  $scope.addMessage = function(threadId, newMessageText, updatedStatus) {
    if (threadId === null) {
      warningsData.addWarning(
        'Current thread ID not set. Required to create a message');
      return;
    }
    $scope.messageSendingInProgress = true;
    $http.post(THREAD_HANDLER_PREFIX + threadId, {
      updated_status: (
        updatedStatus !== $scope.currentThreadData.status ? updatedStatus : null),
      updated_subject: null,
      text: newMessageText
    }).success(function() {
      $scope.currentThreadData.status = updatedStatus;
      $scope.setCurrentThread(threadId);
      $scope.messageSendingInProgress = false;
      $scope.$parent.refreshFeedbackTabHeader();
    }).error(function(data) {
      $scope.messageSendingInProgress = false;
    });
  };

  // We do not permit 'Duplicate' as a valid status for now, since it should
  // require the id of the duplicated thread to be specified.
  $scope.STATUS_CHOICES = [
    {id: 'open', text: 'Open'},
    {id: 'fixed', text: 'Fixed'},
    {id: 'ignored', text: 'Ignored'},
    {id: 'compliment', text: 'Compliment'},
    {id: 'not_actionable', text: 'Not Actionable'}
  ];

  $scope.getHumanReadableStatus = function(status) {
    for (var i = 0; i < $scope.STATUS_CHOICES.length; i++) {
      if ($scope.STATUS_CHOICES[i].id === status) {
        return $scope.STATUS_CHOICES[i].text;
      }
    }
    return '';
  };

  // Initial load of the thread list.
  $scope.currentThreadId = null;
  $scope.currentThreadData = null;
  $scope.currentThreadMessages = null;
  $scope.updatedStatus = null;
  $scope._getThreadList();
}]);
