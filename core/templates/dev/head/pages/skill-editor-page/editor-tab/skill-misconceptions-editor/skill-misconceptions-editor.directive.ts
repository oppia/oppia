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

require(
  'components/state-directives/answer-group-editor/' +
  'summary-list-header.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
  'misconception-editor.directive.ts');

require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillMisconceptionsEditor', [
  'SkillEditorStateService', 'SkillUpdateService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
        'skill-misconceptions-editor.directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'MisconceptionObjectFactory', 'EVENT_SKILL_REINITIALIZED',
        'MISCONCEPTION_NAME_CHAR_LIMIT',
        function(
            $scope, $filter, $uibModal, $rootScope,
            MisconceptionObjectFactory, EVENT_SKILL_REINITIALIZED,
            MISCONCEPTION_NAME_CHAR_LIMIT) {
          var ctrl = this;
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
                '/pages/skill-editor-page/modal-templates/' +
                'delete-misconception-modal.directive.html'),
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
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.openAddMisconceptionModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'add-misconception-modal.directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance', 'MISCONCEPTION_NAME_CHAR_LIMIT',
                function(
                    $scope, $uibModalInstance, MISCONCEPTION_NAME_CHAR_LIMIT) {
                  $scope.skill = SkillEditorStateService.getSkill();
                  $scope.MISCONCEPTION_NAME_CHAR_LIMIT =
                    MISCONCEPTION_NAME_CHAR_LIMIT;
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
                    var newMisconceptionId =
                      $scope.skill.getNextMisconceptionId();
                    $uibModalInstance.close({
                      misconception: MisconceptionObjectFactory.create(
                        newMisconceptionId,
                        $scope.misconceptionName,
                        $scope.misconceptionNotes,
                        $scope.misconceptionFeedback,
                        $scope.misconceptionMustBeAddressed)
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
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };
          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.misconceptions = $scope.skill.getMisconceptions();
            $scope.$on(EVENT_SKILL_REINITIALIZED, function() {
              $scope.misconceptions = $scope.skill.getMisconceptions();
            });
          };
        }]
    };
  }
]);
