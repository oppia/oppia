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
 * @fileoverview Controller for skill mastery modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('SkillMasteryModalController', [
  '$controller', '$scope', '$uibModalInstance', 'masteryPerSkillMapping',
  'openConceptCardModal', 'skillId', 'userIsLoggedIn',
  function(
      $controller, $scope, $uibModalInstance, masteryPerSkillMapping,
      openConceptCardModal, skillId, userIsLoggedIn) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.skillId = skillId;
    $scope.userIsLoggedIn = userIsLoggedIn;
    if ($scope.userIsLoggedIn) {
      $scope.masteryChange = masteryPerSkillMapping[skillId];
    }

    $scope.openConceptCardModal = function() {
      openConceptCardModal([skillId]);
    };
  }
]);
