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
 * @fileoverview Controller for create feedback thread modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('services/alerts.service.ts');

angular.module('oppia').controller('CreateFeedbackThreadModalController', [
  '$controller', '$scope', '$uibModalInstance', 'AlertsService',
  function($controller, $scope, $uibModalInstance, AlertsService) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.newThreadSubject = '';
    $scope.newThreadText = '';

    $scope.create = (newThreadSubject, newThreadText) => {
      if (!newThreadSubject) {
        AlertsService.addWarning(
          'Please specify a thread subject.');
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
  }
]);
