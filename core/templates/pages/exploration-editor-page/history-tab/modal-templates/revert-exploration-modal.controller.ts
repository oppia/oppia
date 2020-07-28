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
 * @fileoverview Controller for revert exploration modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('pages/exploration-editor-page/services/exploration-data.service.ts');

angular.module('oppia').controller('RevertExplorationModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'ExplorationDataService', 'version',
  function(
      $controller, $scope, $uibModalInstance,
      ExplorationDataService, version) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.version = version;
    $scope.getExplorationUrl = function(version) {
      return (
        '/explore/' + ExplorationDataService.explorationId +
        '?v=' + version);
    };
  }
]);
