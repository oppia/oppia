// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for tag misconception modal.
 *
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

angular.module('oppia').controller('TagMisconceptionModalController', [
  '$controller', '$scope', '$uibModalInstance', 'StateEditorService',
  'taggedSkillMisconceptionId',
  function(
      $controller, $scope, $uibModalInstance, StateEditorService,
      taggedSkillMisconceptionId) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.misconceptionsBySkill = (
      StateEditorService.getMisconceptionsBySkill());
    $scope.tempSelectedMisconception = null;
    $scope.tempSelectedMisconceptionSkillId = null;
    $scope.tempMisconceptionFeedbackIsUsed = true;
    $scope.taggedSkillMisconceptionId = (
      taggedSkillMisconceptionId);

    $scope.done = function() {
      $uibModalInstance.close({
        misconception: $scope.tempSelectedMisconception,
        misconceptionSkillId: $scope.tempSelectedMisconceptionSkillId,
        feedbackIsUsed: $scope.tempMisconceptionFeedbackIsUsed
      });
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
