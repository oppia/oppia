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
 * @fileoverview Controller for the main tab of the skill editor.
 */
require('services/stateful/focus-manager.service.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-description-editor/' +
  'skill-description-editor.component.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
  'skill-concept-card-editor.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
  'skill-misconceptions-editor.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-prerequisite-skills-editor/' +
  'skill-prerequisite-skills-editor.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-rubrics-editor/' +
  'skill-rubrics-editor.directive.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/question-creation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
angular.module('oppia').directive('skillEditorMainTab', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/' +
        'skill-editor-main-tab.directive.html'),
      controller: [
        '$scope', '$timeout', '$uibModal', 'FocusManagerService',
        'PageTitleService',
        'SkillEditorRoutingService', 'SkillEditorStateService',
        'UndoRedoService',
        function(
            $scope, $timeout, $uibModal, FocusManagerService,
            PageTitleService,
            SkillEditorRoutingService, SkillEditorStateService,
            UndoRedoService) {
          var ctrl = this;
          $scope.createQuestion = function() {
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
              SkillEditorRoutingService.creatingNewQuestion(true);
            }
          };

          $scope.getSubtopicName = function() {
            return $scope.subtopicName;
          };

          $scope.getAssignedSkillTopicData = function() {
            if (!$scope.topicName && $scope.assignedSkillTopicData) {
              $scope.topicName = Object.keys($scope.assignedSkillTopicData)[0];
              $scope.changeSelectedTopic($scope.topicName);
              return $scope.assignedSkillTopicData;
            }
            $scope.assignedSkillTopicData = (
              SkillEditorStateService.getAssignedSkillTopicData());
            return $scope.assignedSkillTopicData;
          };

          $scope.isTopicDropdownEnabled = function() {
            return Boolean(
              $scope.assignedSkillTopicData &&
                Object.keys($scope.assignedSkillTopicData).length);
          };

          $scope.changeSelectedTopic = function(topicName) {
            $scope.subtopicName = (
              $scope.assignedSkillTopicData[topicName]);
          };

          $scope.hasLoadedSkill = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            return SkillEditorStateService.hasLoadedSkill();
          };

          ctrl.$onInit = function() {
            $scope.selectedTopic = null;
            $scope.assignedSkillTopicData = null;
            $scope.topicName = null;
            $scope.subtopicName = null;
            PageTitleService.setPageTitleForMobileView('Skill Editor');
            // To ensure that the focus event function executes only after
            // all the functions in the main thread have executed,
            // $timeout is required.
            $timeout(function() {
              FocusManagerService.setFocus('newQuestionBtn');
            }, 0);
          };
        }
      ]
    };
  }
]);
