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
 * @fileoverview Component for the skill editor page.
 */

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-editor-main-tab.directive.ts');
require('pages/skill-editor-page/navbar/skill-editor-navbar.directive.ts');
require(
  'pages/skill-editor-page/skill-preview-tab/skill-preview-tab.component.ts');
require(
  'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.directive.ts');
require(
  'pages/skill-editor-page/questions-tab/skill-questions-tab.directive.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/bottom-navbar-status.service.ts');

angular.module('oppia').component('skillEditorPage', {
  template: require('./skill-editor-page.component.html'),
  controller: [
    '$uibModal', 'BottomNavbarStatusService',
    'SkillEditorRoutingService', 'SkillEditorStateService',
    'UndoRedoService', 'UrlInterpolationService', 'UrlService',
    function(
        $uibModal, BottomNavbarStatusService,
        SkillEditorRoutingService, SkillEditorStateService,
        UndoRedoService, UrlInterpolationService, UrlService) {
      var ctrl = this;
      ctrl.getActiveTabName = function() {
        return SkillEditorRoutingService.getActiveTabName();
      };
      ctrl.selectMainTab = function() {
        SkillEditorRoutingService.navigateToMainTab();
      };
      ctrl.selectPreviewTab = function() {
        SkillEditorRoutingService.navigateToPreviewTab();
      };
      ctrl.selectQuestionsTab = function() {
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
            controller: 'ConfirmOrCancelModalController'
          }).result.then(null, function() {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });
        } else {
          SkillEditorRoutingService.navigateToQuestionsTab();
        }
      };
      ctrl.getWarningsCount = function() {
        return ctrl.skill.getValidationIssues().length;
      };
      ctrl.$onInit = function() {
        BottomNavbarStatusService.markBottomNavbarStatus(true);
        SkillEditorStateService.loadSkill(UrlService.getSkillIdFromUrl());
        ctrl.skill = SkillEditorStateService.getSkill();
      };
    }
  ]
});
