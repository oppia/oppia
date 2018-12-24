
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
 * @fileoverview Controller for the questions tab.
 */
oppia.directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/questions_tab/questions_tab_directive.html'),
      controller: [
        '$scope', '$http', '$q', '$uibModal', '$window', 'AlertsService',
        'SkillEditorStateService', 'QuestionCreationService', 'UrlService',
        'EditableQuestionBackendApiService', 'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'StateEditorService',
        'QuestionUndoRedoService', 'UndoRedoService',
        'NUM_QUESTIONS_PER_PAGE', function(
            $scope, $http, $q, $uibModal, $window, AlertsService,
            SkillEditorStateService, QuestionCreationService, UrlService,
            EditableQuestionBackendApiService, EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, StateEditorService,
            QuestionUndoRedoService, UndoRedoService,
            NUM_QUESTIONS_PER_PAGE) {
          $scope.currentPage = 0;

          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.questionSummaries =
              SkillEditorStateService.getQuestionSummaries($scope.currentPage);
            $scope.isLastPage = SkillEditorStateService.isLastQuestionBatch;
            $scope.activeQuestion = null;
            $scope.questionIsBeingUpdated = false;
          };

          $scope.getQuestionIndex = function(index) {
            return $scope.currentPage * NUM_QUESTIONS_PER_PAGE + index + 1;
          };

          $scope.goToNextPage = function() {
            $scope.currentPage++;
            var questionSummaries =
              SkillEditorStateService.getQuestionSummaries($scope.currentPage);
            if (questionSummaries === null) {
              SkillEditorStateService.fetchQuestionSummaries(
                $scope.skill.getId(), false
              );
            } else {
              $scope.questionSummaries = questionSummaries;
            }
          };

          $scope.goToPreviousPage = function() {
            $scope.currentPage--;
            $scope.questionSummaries =
              SkillEditorStateService.getQuestionSummaries($scope.currentPage);
          };

          $scope.saveAndPublishQuestion = function() {
            var validationErrors = $scope.question.validate(
              $scope.skill.getMisconceptions());
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            if (!$scope.questionIsBeingUpdated) {
              EditableQuestionBackendApiService.createQuestion(
                $scope.skill.getId(), $scope.question.toBackendDict(true)
              ).then(function() {
                SkillEditorStateService.fetchQuestionSummaries(
                  $scope.skill.getId(), true
                );
                $scope.currentPage = 0;
              });
            } else {
              if (QuestionUndoRedoService.hasChanges()) {
                $scope.questionIsBeingSaved = true;
                // TODO(tjiang11): Allow user to specify a commit message.
                EditableQuestionBackendApiService.updateQuestion(
                  $scope.questionId, $scope.question.getVersion(), 'blank',
                  QuestionUndoRedoService.getCommittableChangeList()).then(
                  function() {
                    QuestionUndoRedoService.clearChanges();
                    SkillEditorStateService.fetchQuestionSummaries(
                      $scope.skill.getId(), true
                    );
                    $scope.questionIsBeingSaved = false;
                  }, function(error) {
                    AlertsService.addWarning(
                      error || 'There was an error saving the question.');
                    $scope.questionIsBeingSaved = false;
                  });
              }
            }
          };

          $scope.createQuestion = function() {
            $scope.question =
              QuestionObjectFactory.createDefaultQuestion();
            $scope.questionId = $scope.question.getId();
            $scope.questionStateData = $scope.question.getStateData();
            $scope.questionIsBeingUpdated = false;
            $scope.openQuestionEditor();
          };

          $scope.editQuestion = function(questionSummary) {
            EditableQuestionBackendApiService.fetchQuestion(
              questionSummary.id).then(function(response) {
              response.associated_skill_dicts.forEach(function(skillDict) {
                skillDict.misconceptions.forEach(function(misconception) {
                  $scope.misconceptions.append(misconception);
                });
              });
              $scope.question =
                QuestionObjectFactory.createFromBackendDict(
                  response.question_dict);
              $scope.questionId = $scope.question.getId();
              $scope.questionStateData = $scope.question.getStateData();
              $scope.questionIsBeingUpdated = true;

              $scope.openQuestionEditor();
            }, function(errorResponse) {
              AlertsService.addWarning(
                errorResponse.error || 'Failed to fetch question.');
            });
          };

          $scope.openQuestionEditor = function() {
            var question = $scope.question;
            var questionStateData = $scope.questionStateData;
            var questionId = $scope.questionId;
            var misconceptions = $scope.skill.getMisconceptions();

            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/questions_tab/' +
                'question_editor_modal_directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.questionId = questionId;
                  $scope.misconceptions = misconceptions;
                  $scope.canEditQuestion = true;
                  $scope.removeErrors = function() {
                    $scope.validationError = null;
                  };
                  $scope.done = function() {
                    $scope.validationError = $scope.question.validate(
                      $scope.misconceptions);
                    if ($scope.validationError) {
                      return;
                    }
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              $scope.saveAndPublishQuestion();
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
