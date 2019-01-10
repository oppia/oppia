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

oppia.directive('skillEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/skill_editor_navbar_directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService',
        'UndoRedoService', 'SkillEditorStateService',
        'SkillRightsBackendApiService', 'SkillEditorRoutingService',
        'EVENT_SKILL_INITIALIZED', 'EVENT_SKILL_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $uibModal, AlertsService,
            UndoRedoService, SkillEditorStateService,
            SkillRightsBackendApiService, SkillEditorRoutingService,
            EVENT_SKILL_INITIALIZED, EVENT_SKILL_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.skillRights = (
            SkillEditorStateService.getSkillRights());
          $scope.getActiveTabName = SkillEditorRoutingService.getActiveTabName;
          $scope.selectMainTab = SkillEditorRoutingService.navigateToMainTab;
          $scope.isLoadingSkill = SkillEditorStateService.isLoadingSkill;
          $scope.validationIssues = [];
          $scope.isSaveInProgress = SkillEditorStateService.isSavingSkill;

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
                  '/pages/skill_editor/editor_tab/' +
                  'save_pending_changes_modal_directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance',
                  function($scope, $uibModalInstance) {
                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };
                  }
                ]
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

          $scope.$on(EVENT_SKILL_INITIALIZED, _validateSkill);
          $scope.$on(EVENT_SKILL_REINITIALIZED, _validateSkill);
          $scope.$on(
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateSkill);

          $scope.isSkillSaveable = function() {
            return (
              $scope.getChangeListCount() > 0 &&
              $scope.validationIssues.length === 0);
          };

          $scope.isSkillPublishable = function() {
            return (
              $scope.skillRights.isPrivate() &&
              $scope.validationIssues.length === 0 &&
              $scope.getChangeListCount() === 0);
          };

          var _publishSkill = function() {
            SkillRightsBackendApiService.setSkillPublic(
              $scope.skill.getId(), $scope.skill.getVersion()).then(
              function() {
                $scope.skillRights.setPublic();
                SkillEditorStateService.setSkillRights(
                  $scope.skillRights);
                AlertsService.addSuccessMessage('Skill Published.');
              });
          };

          $scope.saveChanges = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/' +
                'skill_editor_save_modal_directive.html'),
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
            });
          };

          $scope.publishSkill = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/' +
                'skill_editor_pre_publish_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function(
                    $scope, $uibModalInstance) {
                  $scope.save = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }]
            }).result.then(function() {
              _publishSkill();
            });
          };
        }]
    };
  }
]);
