// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the review_feedback_thread_modal_directive.
 */

oppia.controller('ReviewFeedbackThreadModalController', [
  '$scope', '$uibModalInstance', 'AlertsService', 'ChangeListService',
  'DateTimeFormatService', 'EditabilityService', 'ExplorationStatesService',
  'ShowSuggestionModalForEditorViewService', 'ThreadDataService',
  'ThreadStatusDisplayService', 'activeThread', 'userIsLoggedIn',
  function(
      $scope, $uibModalInstance, AlertsService, ChangeListService,
      DateTimeFormatService, EditabilityService, ExplorationStatesService,
      ShowSuggestionModalForEditorViewService, ThreadDataService,
      ThreadStatusDisplayService, activeThread, userIsLoggedIn) {
    $scope.activeThread = activeThread;
    $scope.userIsLoggedIn = userIsLoggedIn;
    $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
    $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
    $scope.EditabilityService = EditabilityService;

    // Initial load of the thread list on page load.
    $scope.tmpMessage = {
      status: $scope.activeThread.status,
      text: ''
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
      $scope.messageSendingInProgress = true;
      ThreadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
        $scope.tmpMessage.status = $scope.activeThread.status;
        $scope.messageSendingInProgress = false;
      }, function() {
        $scope.messageSendingInProgress = false;
      });
    };
    $scope.close = function() {
      $uibModalInstance.close();
    };
  }
]);
