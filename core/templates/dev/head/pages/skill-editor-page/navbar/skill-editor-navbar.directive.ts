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
 * @fileoverview Directive for the navbar of the skill editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-routing.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/navbar/skill-editor-navbar.directive.html'),
      controller: [
        '$scope', '$uibModal', '$window', 'AlertsService',
        'UndoRedoService', 'SkillEditorStateService',
        'SkillEditorRoutingService',
        'EVENT_SKILL_INITIALIZED', 'EVENT_SKILL_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $uibModal, $window, AlertsService,
            UndoRedoService, SkillEditorStateService,
            SkillEditorRoutingService,
            EVENT_SKILL_INITIALIZED, EVENT_SKILL_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          var ctrl = this;
          $scope.getActiveTabName = function() {
            return SkillEditorRoutingService.getActiveTabName();
          };
          $scope.selectMainTab = function() {
            SkillEditorRoutingService.navigateToMainTab();
          };
          $scope.isLoadingSkill = function() {
            return SkillEditorStateService.isLoadingSkill();
          };
          $scope.isSaveInProgress = function() {
            return SkillEditorStateService.isSavingSkill();
          };

          $scope.getChangeListCount = function() {
            return UndoRedoService.getChangeCount();
          };

          $scope.selectQuestionsTab = function() {
            // This check is needed because if a skill has unsaved changes to
            // misconceptions, then these will be reflected in the questions
            // created at that time, but if page is refreshed/changes are
            // discarded, the misconceptions won't be saved, but there will be
            // some questions with these now non-existent misconceptions.
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/skill-editor-page/modal-templates/' +
                  'save-pending-changes-modal.directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance',
                  function($scope, $uibModalInstance) {
                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };
                  }
                ]
              }).result.then(null, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              SkillEditorRoutingService.navigateToQuestionsTab();
            }
          };

          var _validateSkill = function() {
            $scope.validationIssues = $scope.skill.getValidationIssues();
          };

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            SkillEditorStateService.loadSkill($scope.skill.getId());
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.isSkillSaveable = function() {
            return (
              $scope.getChangeListCount() > 0 &&
              $scope.validationIssues.length === 0);
          };

          $scope.saveChanges = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'skill-editor-save-modal.directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.save = function(commitMessage) {
                    $uibModalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(commitMessage) {
              SkillEditorStateService.saveSkill(commitMessage);
              AlertsService.addSuccessMessage('Changes Saved.');
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.validationIssues = [];
            $scope.$on(EVENT_SKILL_INITIALIZED, _validateSkill);
            $scope.$on(EVENT_SKILL_REINITIALIZED, _validateSkill);
            $scope.$on(
              EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateSkill);
          };
        }]
    };
  }
]);
