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
  'pages/community-dashboard-page/services/' +
  'question-suggestion.service.ts');
require('services/alerts.service.ts');
require('services/question-validation.service.ts');

angular.module('oppia').controller('QuestionSuggestionEditorModalController', [
  '$scope', '$uibModal', '$uibModalInstance', 'AlertsService',
  'QuestionSuggestionService', 'QuestionUndoRedoService',
  'QuestionValidationService', 'UrlInterpolationService',
  'question', 'questionId', 'questionStateData', 'skill', 'skillDifficulty',
  'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
  function(
      $scope, $uibModal, $uibModalInstance, AlertsService,
      QuestionSuggestionService, QuestionUndoRedoService,
      QuestionValidationService, UrlInterpolationService,
      question, questionId, questionStateData, skill, skillDifficulty,
      SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
    $scope.canEditQuestion = true;
    $scope.newQuestionIsBeingCreated = true;
    $scope.question = question;
    $scope.questionStateData = questionStateData;
    $scope.questionId = questionId;
    $scope.skill = skill;
    $scope.skillDifficulty = skillDifficulty;
    $scope.skillDifficultyString = Object.entries(
      SKILL_DIFFICULTY_LABEL_TO_FLOAT).find(
      entry => entry[1] === skillDifficulty)[0];
    $scope.misconceptionsBySkill = {};
    $scope.misconceptionsBySkill[$scope.skill.getId()] = (
      $scope.skill.getMisconceptions());
    $scope.done = function() {
      if (!$scope.isQuestionValid()) {
        return;
      }
      QuestionSuggestionService.submitSuggestion(
        $scope.question, $scope.skill, $scope.skillDifficulty, function() {
          AlertsService.addSuccessMessage('Submitted question for review.');
        });
      $uibModalInstance.close();
    };
    // Checking if Question contains all requirements to enable
    // Save and Publish Question.
    $scope.isQuestionValid = function() {
      return QuestionValidationService.isQuestionValid(
        $scope.question, $scope.misconceptionsBySkill);
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
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button
          // is clicked.
          // No further action is needed.
        });
      } else {
        $uibModalInstance.dismiss('cancel');
      }
    };
  }
]);
