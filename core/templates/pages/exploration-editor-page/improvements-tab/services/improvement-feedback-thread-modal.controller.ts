// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for ImprovementFeedbackThreadModal.
 */

angular.module('oppia').controller('ImprovementFeedbackThreadModalController', [
  '$scope', '$uibModalInstance', 'AlertsService', 'DateTimeFormatService',
  'EditabilityService', 'ThreadDataService', 'ThreadStatusDisplayService',
  'isUserLoggedIn', 'thread',
  function(
      $scope, $uibModalInstance, AlertsService, DateTimeFormatService,
      EditabilityService, ThreadDataService, ThreadStatusDisplayService,
      isUserLoggedIn, thread) {
    $scope.activeThread = thread;
    $scope.isUserLoggedIn = isUserLoggedIn;
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

    $scope.getTitle = function() {
      return $scope.activeThread.subject;
    };

    // TODO(Allan): Implement ability to edit suggestions before
    // applying.
    $scope.addNewMessage = function(tmpText, tmpStatus) {
      if ($scope.activeThread.threadId === null) {
        AlertsService.addWarning(
          'Cannot add message to thread with ID: null.');
        return;
      }
      if (!tmpStatus) {
        AlertsService.addWarning(
          'Invalid message status: ' + tmpStatus);
        return;
      }
      $scope.messageSendingInProgress = true;
      ThreadDataService.addNewMessageAsync(
        $scope.activeThread, tmpText, tmpStatus)
        .then(() => {
          $scope.tmpMessage.status = $scope.activeThread.status;
          $scope.messageSendingInProgress = false;
        }, () => {
          $scope.messageSendingInProgress = false;
        }).then($uibModalInstance.close);
    };
    $scope.close = function() {
      $uibModalInstance.close();
    };
  },
]);
