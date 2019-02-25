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
 */

oppia.controller('FeedbackTab', [
  '$log', '$q', '$rootScope', '$scope', '$uibModal',
  'AlertsService', 'ChangeListService', 'DateTimeFormatService',
  'ExplorationDataService', 'ExplorationStatesService',
  'ShowSuggestionModalForEditorViewService',
  'StateObjectFactory',
  'ThreadDataService', 'ThreadStatusDisplayService',
  'UrlInterpolationService', 'UserService',
  'ACTION_ACCEPT_SUGGESTION', 'ACTION_REJECT_SUGGESTION',
  function(
      $log, $q, $rootScope, $scope, $uibModal,
      AlertsService, ChangeListService, DateTimeFormatService,
      ExplorationDataService, ExplorationStatesService,
      ShowSuggestionModalForEditorViewService,
      StateObjectFactory,
      ThreadDataService, ThreadStatusDisplayService,
      UrlInterpolationService, UserService,
      ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION) {
    $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
    $scope.threadData = ThreadDataService.data;
    $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

    $scope.activeThread = null;
    $scope.userIsLoggedIn = null;
    $scope.threadIsUpdated = false;
    $rootScope.loadingMessage = 'Loading';
    var userInfoPromise = UserService.getUserInfoAsync();
    userInfoPromise.then(function(userInfo) {
      $scope.userIsLoggedIn = userInfo.isLoggedIn();
    });

    // Initial load of the thread list on page load.
    $scope.tmpMessage = {
      status: null,
      text: ''
    };
    var _resetTmpMessageFields = function() {
      $scope.tmpMessage.status = $scope.activeThread ?
        $scope.activeThread.status : null;
      $scope.tmpMessage.text = '';
    };
    $scope.clearActiveThread = function() {
      $scope.activeThread = null;
      _resetTmpMessageFields();
    };
    $scope.clearActiveThread();
    ThreadDataService.fetchFeedbackStats();
    var threadPromise = ThreadDataService.fetchThreads();
    $q.all([userInfoPromise, threadPromise]).then(function() {
      $rootScope.loadingMessage = '';
    });
    // Fetches the threads again if any thread is updated.
    $scope.fetchUpdatedThreads = function() {
      ThreadDataService.fetchThreads();
      $scope.threadData = ThreadDataService.data;
      $scope.threadIsUpdated = false;
    };
    $scope.onBackButtonClicked = function() {
      $scope.clearActiveThread();
      if ($scope.threadIsUpdated) {
        $scope.fetchUpdatedThreads();
      }
    };

    $scope.showCreateThreadModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/feedback_tab/' +
          'editor_create_feedback_thread_modal_directive.html'),
        backdrop: true,
        resolve: {},
        controller: ['$scope', '$uibModalInstance', function(
            $scope, $uibModalInstance) {
          $scope.newThreadSubject = '';
          $scope.newThreadText = '';

          $scope.create = function(newThreadSubject, newThreadText) {
            if (!newThreadSubject) {
              AlertsService.addWarning('Please specify a thread subject.');
              return;
            }
            if (!newThreadText) {
              AlertsService.addWarning('Please specify a message.');
              return;
            }

            $uibModalInstance.close({
              newThreadSubject: newThreadSubject,
              newThreadText: newThreadText
            });
          };

          $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
          };
        }]
      }).result.then(function(result) {
        ThreadDataService.createNewThread(
          result.newThreadSubject, result.newThreadText, function() {
            $scope.clearActiveThread();
            AlertsService.addSuccessMessage('Feedback thread created.');
          });
      });
    };

    var _isSuggestionHandled = function() {
      return $scope.activeThread.isSuggestionHandled();
    };

    var _isSuggestionValid = function() {
      return ExplorationStatesService.hasState(
        $scope.activeThread.getSuggestionStateName());
    };

    var _hasUnsavedChanges = function() {
      return (ChangeListService.getChangeList().length > 0);
    };

    $scope.getSuggestionButtonType = function() {
      return (!_isSuggestionHandled() && _isSuggestionValid() &&
              !_hasUnsavedChanges() ? 'primary' : 'default');
    };

    // TODO(Allan): Implement ability to edit suggestions before applying.
    $scope.showSuggestionModal = function() {
      ShowSuggestionModalForEditorViewService.showSuggestionModal(
        $scope.activeThread.suggestion.suggestionType,
        {
          activeThread: $scope.activeThread,
          setActiveThread: $scope.setActiveThread,
          isSuggestionHandled: _isSuggestionHandled,
          hasUnsavedChanges: _hasUnsavedChanges,
          isSuggestionValid: _isSuggestionValid
        }
      );
    };

    $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
      if (threadId === null) {
        AlertsService.addWarning('Cannot add message to thread with ID: null.');
        return;
      }
      if (!tmpStatus) {
        AlertsService.addWarning('Invalid message status: ' + tmpStatus);
        return;
      }
      $scope.threadIsUpdated = true;
      $scope.messageSendingInProgress = true;
      ThreadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
        _resetTmpMessageFields();
        $scope.messageSendingInProgress = false;
      }, function() {
        $scope.messageSendingInProgress = false;
      });
    };

    $scope.setActiveThread = function(threadId) {
      ThreadDataService.fetchMessages(threadId);
      ThreadDataService.markThreadAsSeen(threadId);
      var allThreads = [].concat(
        $scope.threadData.feedbackThreads, $scope.threadData.suggestionThreads);
      for (var i = 0; i < allThreads.length; i++) {
        if (allThreads[i].threadId === threadId) {
          $scope.activeThread = allThreads[i];
          break;
        }
      }
      $scope.tmpMessage.status = $scope.activeThread.status;
    };
  }
]);
