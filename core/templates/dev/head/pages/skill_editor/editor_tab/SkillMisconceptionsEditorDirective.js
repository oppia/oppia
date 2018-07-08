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
 * @fileoverview Directive for the skill misconceptions editor.
 */

oppia.directive('skillMisconceptionsEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function(
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_misconceptions_editor_directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'MisconceptionObjectFactory',
        function(
            $scope, $filter, $uibModal, $rootScope,
            MisconceptionObjectFactory) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.misconceptions = $scope.skill.getMisconceptions();

          $scope.isEditable = function() {
            return true;
          };

          $scope.changeActiveMisconceptionIndex = function(idx) {
            if (idx === $scope.activeMisconceptionIndex) {
              $scope.activeMisconceptionIndex = null;
            } else {
              $scope.activeMisconceptionIndex = idx;
            }
          };

          $scope.getMisconceptionSummary = function(misconception) {
            return misconception.getName();
          };

          $scope.openDeleteMisconceptionModal = function(index, evt) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/' +
                'delete_misconception_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.skill = SkillEditorStateService.getSkill();

                  $scope.confirm = function() {
                    $uibModalInstance.close({
                      id: $scope.skill.getMisconceptionAtIndex(index).getId()
                    });
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }]
            }).result.then(function(result) {
              SkillUpdateService.deleteMisconception($scope.skill, result.id);
              $scope.misconceptions = $scope.skill.getMisconceptions();
              $scope.activeMisconceptionIndex = null;
            });
          };

          $scope.openAddMisconceptionModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/' +
                'add_misconception_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.skill = SkillEditorStateService.getSkill();
                  $scope.MISCONCEPTION_PROPERTY_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.misconceptionName = '';
                  $scope.misconceptionNotes = '';
                  $scope.misconceptionFeedback = '';

                  $scope.saveMisconception = function() {
                    var newMisconceptionId =
                      $scope.skill.getNextMisconceptionId();
                    $uibModalInstance.close({
                      misconception: MisconceptionObjectFactory.create(
                        newMisconceptionId,
                        $scope.misconceptionName,
                        $scope.misconceptionNotes,
                        $scope.misconceptionFeedback)
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }]
            }).result.then(function(result) {
              SkillUpdateService.addMisconception(
                $scope.skill, result.misconception);
              $scope.misconceptions = $scope.skill.getMisconceptions();
            });
          };
        }]
    };
  }
]);
