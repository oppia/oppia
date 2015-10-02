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
 * @fileoverview Controller, services, and directives for the exploration
 * feedback tab.
 *
 * @author kashida@google.com (Koji Ashida)
 */

oppia.controller('ExplorationFeedback', [
    '$scope', '$http', '$modal', '$timeout', '$rootScope', 'warningsData',
    'oppiaDatetimeFormatter', 'threadStatusRepresentationService',
    'feedbackThreadDataService',
    function(
      $scope, $http, $modal, $timeout, $rootScope, warningsData,
      oppiaDatetimeFormatter, threadStatusRepresentationService,
      feedbackThreadDataService) {

  $scope.STATUS_CHOICES = threadStatusRepresentationService.STATUS_CHOICES;
  $scope.threadData = feedbackThreadDataService.data;
  $scope.getLabelClass = threadStatusRepresentationService.getLabelClass;
  $scope.getHumanReadableStatus = (
    threadStatusRepresentationService.getHumanReadableStatus);
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
      feedbackThreadDataService.createNewThread(
        result.newThreadSubject, result.newThreadText, function() {
          $scope.clearActiveThread();
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
    feedbackThreadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
      _resetTmpMessageFields();
      $scope.messageSendingInProgress = false;
    }, function() {
      $scope.messageSendingInProgress = false;
    });
  };

  $scope.setActiveThread = function(threadId) {
    feedbackThreadDataService.loadMessagesFromBackend(threadId);

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
  feedbackThreadDataService.reloadFromBackend(function() {
    $timeout(function() {
      $rootScope.loadingMessage = '';
    }, 500);
  });
}]);


oppia.factory('feedbackThreadDataService', [
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

oppia.factory('threadStatusRepresentationService', [function() {
  var _STATUS_CHOICES = [
    {id: 'open', text: 'Open'},
    {id: 'fixed', text: 'Fixed'},
    {id: 'ignored', text: 'Ignored'},
    {id: 'compliment', text: 'Compliment'},
    {id: 'not_actionable', text: 'Not Actionable'}
  ];

  return {
    STATUS_CHOICES: angular.copy(_STATUS_CHOICES),
    getLabelClass: function(status) {
      if (status === 'open') {
        return 'label label-info';
      } else {
        return 'label label-default';
      }
    },
    getHumanReadableStatus: function(status) {
      for (var i = 0; i < _STATUS_CHOICES.length; i++) {
        if (_STATUS_CHOICES[i].id === status) {
          return _STATUS_CHOICES[i].text;
        }
      }
      return '';
    }
  };
}]);

oppia.directive('threadSummaryTable', [function() {
  return {
    restrict: 'E',
    scope: {
      onClickRow: '=',
      threads: '&'
    },
    templateUrl: 'feedback/threadSummaryTable',
    controller: [
        '$scope', 'threadStatusRepresentationService', 'oppiaDatetimeFormatter',
        function($scope, threadStatusRepresentationService, oppiaDatetimeFormatter) {
      $scope.getLabelClass = threadStatusRepresentationService.getLabelClass;
      $scope.getHumanReadableStatus = (
        threadStatusRepresentationService.getHumanReadableStatus);
      $scope.getLocaleAbbreviatedDatetimeString = (
        oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);
    }]
  };
}]);
