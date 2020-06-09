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
 * @fileoverview Controller for add misconception modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/skill/MisconceptionObjectFactory.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

angular.module('oppia').controller('AddMisconceptionModalController', [
  '$controller', '$scope', '$uibModalInstance', 'MisconceptionObjectFactory',
  'SkillEditorStateService', 'MAX_CHARS_IN_MISCONCEPTION_NAME',
  function(
      $controller, $scope, $uibModalInstance, MisconceptionObjectFactory,
      SkillEditorStateService, MAX_CHARS_IN_MISCONCEPTION_NAME) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.skill = SkillEditorStateService.getSkill();
    $scope.MAX_CHARS_IN_MISCONCEPTION_NAME =
      MAX_CHARS_IN_MISCONCEPTION_NAME;
    $scope.MISCONCEPTION_PROPERTY_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        startupFocusEnabled: false
      }
    };

    $scope.MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true,
        startupFocusEnabled: false
      }
    };

    $scope.misconceptionName = '';
    $scope.misconceptionNotes = '';
    $scope.misconceptionFeedback = '';
    $scope.misconceptionMustBeAddressed = true;

    $scope.saveMisconception = function() {
      var newMisconceptionId = $scope.skill.getNextMisconceptionId();
      $uibModalInstance.close({
        misconception: MisconceptionObjectFactory.create(
          newMisconceptionId,
          $scope.misconceptionName,
          $scope.misconceptionNotes,
          $scope.misconceptionFeedback,
          $scope.misconceptionMustBeAddressed)
      });
    };
  }
]);
