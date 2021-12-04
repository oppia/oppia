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
 * @fileoverview Controller for question suggestion editor modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/contributor-dashboard-page/services/' +
  'question-suggestion-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').controller('QuestionSuggestionEditorModalController', [
  '$rootScope', '$scope', '$uibModal', '$uibModalInstance', 'AlertsService',
  'ContextService', 'ContributionAndReviewService', 'ImageLocalStorageService',
  'QuestionSuggestionBackendApiService', 'QuestionUndoRedoService',
  'QuestionValidationService', 'SiteAnalyticsService',
  'UrlInterpolationService', 'question', 'questionId', 'questionStateData',
  'skill', 'skillDifficulty', 'suggestionId', 'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
  'IMAGE_CONTEXT',
  function(
      $rootScope, $scope, $uibModal, $uibModalInstance, AlertsService,
      ContextService, ContributionAndReviewService, ImageLocalStorageService,
      QuestionSuggestionBackendApiService, QuestionUndoRedoService,
      QuestionValidationService, SiteAnalyticsService,
      UrlInterpolationService, question, questionId, questionStateData,
      skill, skillDifficulty, suggestionId, SKILL_DIFFICULTY_LABEL_TO_FLOAT,
      IMAGE_CONTEXT) {
    $scope.canEditQuestion = true;
    $scope.newQuestionIsBeingCreated = true;
    $scope.question = question;
    $scope.questionStateData = questionStateData;
    $scope.questionId = questionId;
    $scope.skill = skill;
    $scope.skillDifficulty = skillDifficulty;
    $scope.isEditing = suggestionId !== '' ? true : false;
    $scope.misconceptionsBySkill = {};
    $scope.misconceptionsBySkill[$scope.skill.getId()] = (
      $scope.skill.getMisconceptions());
    ContextService.setCustomEntityContext(
      IMAGE_CONTEXT.QUESTION_SUGGESTIONS,
      $scope.skill.getId()
    );
    $scope.setDifficultyString = function(skillDifficulty) {
      $scope.skillDifficultyString = Object.entries(
        SKILL_DIFFICULTY_LABEL_TO_FLOAT).find(
        entry => entry[1] === skillDifficulty)[0];
    };
    $scope.setDifficultyString(skillDifficulty);
    $scope.done = function() {
      if (!$scope.isQuestionValid()) {
        return;
      }
      SiteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent(
        'Question');
      var imagesData = ImageLocalStorageService.getStoredImagesData();
      ImageLocalStorageService.flushStoredImagesData();
      ContextService.resetImageSaveDestination();
      if ($scope.isEditing) {
        const questionDict = $scope.question.toBackendDict(false);
        ContributionAndReviewService.updateQuestionSuggestionAsync(
          suggestionId,
          $scope.skillDifficulty,
          questionDict.question_state_data,
          imagesData,
          () => {
            AlertsService.addSuccessMessage('Updated question.');

            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });
      } else {
        QuestionSuggestionBackendApiService.submitSuggestionAsync(
          $scope.question, $scope.skill, $scope.skillDifficulty,
          imagesData).then(
          () => {
            AlertsService.addSuccessMessage('Submitted question for review.');

            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });
      }
      $uibModalInstance.close();
    };
    // Checking if Question contains all requirements to enable
    // Save and Publish Question.
    $scope.isQuestionValid = function() {
      return QuestionValidationService.isQuestionValid(
        $scope.question, $scope.misconceptionsBySkill);
    };
    $scope.skillId = $scope.skill.getId();
    $scope.onClickChangeDifficulty = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/topic-editor-page/modal-templates/' +
          'select-skill-and-difficulty-modal.template.html'),
        backdrop: true,
        resolve: {
          skillId: () => $scope.skillId
        },
        controller: (
          'QuestionsOpportunitiesSelectSkillAndDifficultyModalController')
      }).result.then(function(result) {
        if (AlertsService.warnings.length === 0) {
          $scope.skillDifficulty = result.skillDifficulty;
          $scope.setDifficultyString($scope.skillDifficulty);
        }
      }, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };
    $scope.cancel = function() {
      if (QuestionUndoRedoService.hasChanges()) {
        $uibModal.open({
          templateUrl:
            UrlInterpolationService.getDirectiveTemplateUrl(
              '/components/question-directives/modal-templates/' +
              'confirm-question-modal-exit-modal.directive.html'),
          backdrop: true,
          controller: 'ConfirmOrCancelModalController'
        }).result.then(function() {
          $uibModalInstance.dismiss('cancel');
          ImageLocalStorageService.flushStoredImagesData();
          ContextService.resetImageSaveDestination();
        }, function() {
          // Note to developers:
          // This callback is triggered when the cancel button is clicked.
          // No further action is needed.
        });
      } else {
        ImageLocalStorageService.flushStoredImagesData();
        ContextService.resetImageSaveDestination();
        $uibModalInstance.dismiss('cancel');
      }
    };
  }
]);
