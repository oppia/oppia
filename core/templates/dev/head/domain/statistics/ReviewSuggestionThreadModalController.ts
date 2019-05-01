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
 * @fileoverview Controller for the review_suggestion_thread_modal_directive.
 */

oppia.controller('ReviewSuggestionThreadModalController', [
  '$scope', '$uibModalInstance', 'AlertsService', 'DateTimeFormatService',
  'EditabilityService', 'FeedbackDisplayService', 'ThreadDataService',
  'activeThread', 'isUserLoggedIn',
  function(
      $scope, $uibModalInstance, AlertsService, DateTimeFormatService,
      EditabilityService, FeedbackDisplayService, ThreadDataService,
      activeThread, isUserLoggedIn) {
    $scope.thread = activeThread;
    $scope.isUserLoggedIn = isUserLoggedIn;
    $scope.STATUS_CHOICES = FeedbackDisplayService.STATUS_CHOICES;
    $scope.getLabelClass = FeedbackDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      FeedbackDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
    $scope.EditabilityService = EditabilityService;

    // Initial load of the thread list on page load.
    $scope.tmpMessage = {
      status: $scope.thread.status,
      text: '',
    };

    $scope.getTitle = function() {
      return (
        'Suggestion for the "' + $scope.thread.getSuggestionStateName() +
        '" Card');
    };

    // TODO(Allan): Implement ability to edit suggestions before applying.
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
        $scope.tmpMessage.status = $scope.thread.status;
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
