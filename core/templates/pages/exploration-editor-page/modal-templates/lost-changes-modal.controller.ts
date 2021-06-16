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
 * @fileoverview Controller for lost changes modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'pages/exploration-editor-page/changes-in-human-readable-form/' +
  'changes-in-human-readable-form.component.ts');

angular.module('oppia').controller('LostChangesModalController', [
  '$controller', '$log', '$scope', '$uibModalInstance',
  'LostChangeObjectFactory', 'lostChanges',
  function(
      $controller, $log, $scope, $uibModalInstance,
      LostChangeObjectFactory, lostChanges) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.lostChanges = lostChanges.map(
      LostChangeObjectFactory.createNew);
    $log.error('Lost changes: ' + JSON.stringify(lostChanges));
  }
]);
