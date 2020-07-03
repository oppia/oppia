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
 * @fileoverview Controller for flag exploration modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('pages/exploration-player-page/services/player-position.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').controller('FlagExplorationModalController', [
  '$controller', '$scope', '$uibModalInstance', 'FocusManagerService',
  'PlayerPositionService',
  function($controller, $scope, $uibModalInstance, FocusManagerService,
      PlayerPositionService) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.flagMessageTextareaIsShown = false;
    var stateName = PlayerPositionService.getCurrentStateName();

    $scope.showFlagMessageTextarea = function(value) {
      if (value) {
        $scope.flagMessageTextareaIsShown = true;
        FocusManagerService.setFocus('flagMessageTextarea');
      }
    };

    $scope.submitReport = function() {
      if ($scope.flagMessage) {
        $uibModalInstance.close({
          report_type: $scope.flag,
          report_text: $scope.flagMessage,
          state: stateName
        });
      }
    };
  }
]);
