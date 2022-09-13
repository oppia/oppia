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

import { Subscription } from 'rxjs';
import { SkillEditorSaveModalComponent } from '../modal-templates/skill-editor-save-modal.component';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-routing.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/ngb-modal.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/navbar/skill-editor-navbar.component.html'),
      controller: [
        '$rootScope', '$scope', 'AlertsService', 'NgbModal',
        'SkillEditorRoutingService', 'SkillEditorStateService',
        'SkillUpdateService', 'UndoRedoService', 'UrlService',
        function(
            $rootScope, $scope, AlertsService, NgbModal,
            SkillEditorRoutingService, SkillEditorStateService,
            SkillUpdateService, UndoRedoService, UrlService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var ACTIVE_TAB_EDITOR = 'Editor';
          var ACTIVE_TAB_QUESTIONS = 'Questions';
          var ACTIVE_TAB_PREVIEW = 'Preview';
          $scope.getActiveTabName = function() {
            return SkillEditorRoutingService.getActiveTabName();
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

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            SkillEditorStateService.loadSkill(UrlService.getSkillIdFromUrl());
          };

          $scope.getWarningsCount = function() {
            return SkillEditorStateService.getSkillValidationIssues().length;
          };

          $scope.isSkillSaveable = function() {
            return (
              $scope.getChangeListCount() > 0 &&
              $scope.getWarningsCount() === 0
            );
          };

          $scope.saveChanges = function() {
            NgbModal.open(SkillEditorSaveModalComponent, {
              backdrop: 'static',
            }).result.then(function(commitMessage) {
              SkillEditorStateService.saveSkill(commitMessage, () => {
                AlertsService.addSuccessMessage('Changes Saved.');
                $rootScope.$applyAsync();
              });
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.toggleNavigationOptions = function() {
            $scope.showNavigationOptions = !$scope.showNavigationOptions;
          };
          $scope.selectMainTab = function() {
            $scope.activeTab = ACTIVE_TAB_EDITOR;
            SkillEditorRoutingService.navigateToMainTab();
          };
          $scope.selectPreviewTab = function() {
            $scope.activeTab = ACTIVE_TAB_PREVIEW;
            SkillEditorRoutingService.navigateToPreviewTab();
          };
          $scope.toggleSkillEditOptions = function() {
            $scope.showSkillEditOptions = !$scope.showSkillEditOptions;
          };
          $scope.selectQuestionsTab = function() {
            // This check is needed because if a skill has unsaved changes to
            // misconceptions, then these will be reflected in the questions
            // created at that time, but if page is refreshed/changes are
            // discarded, the misconceptions won't be saved, but there will be
            // some questions with these now non-existent misconceptions.
            if (UndoRedoService.getChangeCount() > 0) {
              const modalRef = NgbModal.open(
                SavePendingChangesModalComponent, {
                  backdrop: true
                });

              modalRef.componentInstance.body = (
                'Please save all pending ' +
                'changes before viewing the questions list.');

              modalRef.result.then(null, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              $scope.activeTab = ACTIVE_TAB_QUESTIONS;
              SkillEditorRoutingService.navigateToQuestionsTab();
            }
          };

          ctrl.$onInit = function() {
            $scope.activeTab = ACTIVE_TAB_EDITOR;
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => {
                  ctrl.skill = SkillEditorStateService.getSkill();
                  $rootScope.$applyAsync();
                }),
              SkillUpdateService.onPrerequisiteSkillChange.subscribe(
                () => {
                  $scope.$applyAsync();
                }
              ),
              UndoRedoService._undoRedoChangeEventEmitter.subscribe(() => {
                $scope.$applyAsync();
              })
            );
          };
        }]
    };
  }
]);
