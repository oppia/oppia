
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
 * @fileoverview Controller for the questions list.
 */

require('directives/AngularHtmlBindDirective.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/question/EditableQuestionBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/EditableSkillBackendApiService.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/AlertsService.ts');
require('services/contextual/UrlService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('questionsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        skillDescriptionsAreShown: '&skillDescriptionsAreShown',
        selectSkillModalIsShown: '&selectSkillModalIsShown',
        getSkillIds: '&skillIds',
        getQuestionSummariesAsync: '=',
        isLastPage: '=isLastQuestionBatch',
        getAllSkillSummaries: '&allSkillSummaries',
        canEditQuestion: '&',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/questions-list/' +
        'questions-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$http', '$q', '$uibModal', '$window',
        'AlertsService', 'QuestionCreationService', 'UrlService',
        'NUM_QUESTIONS_PER_PAGE', 'EditableQuestionBackendApiService',
        'EditableSkillBackendApiService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'SkillDifficultyObjectFactory',
        'DEFAULT_SKILL_DIFFICULTY', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'MODE_SELECT_DIFFICULTY', 'MODE_SELECT_SKILL',
        'StateEditorService', 'QuestionUndoRedoService', 'UndoRedoService',
        function(
            $scope, $filter, $http, $q, $uibModal, $window,
            AlertsService, QuestionCreationService, UrlService,
            NUM_QUESTIONS_PER_PAGE, EditableQuestionBackendApiService,
            EditableSkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, SkillDifficultyObjectFactory,
            DEFAULT_SKILL_DIFFICULTY, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            MODE_SELECT_DIFFICULTY, MODE_SELECT_SKILL,
            StateEditorService, QuestionUndoRedoService, UndoRedoService) {
          var ctrl = this;
          ctrl.currentPage = 0;
          ctrl.skillIds = [];

          var _initTab = function() {
            ctrl.skillIds = ctrl.getSkillIds();
            ctrl.questionEditorIsShown = false;
            ctrl.question = null;
            ctrl.questionSummaries = ctrl.getQuestionSummariesAsync(
              ctrl.currentPage, ctrl.skillIds, false, false
            );
            ctrl.truncatedQuestionSummaries = [];
            ctrl.populateTruncatedQuestionSummaries();
            ctrl.questionIsBeingUpdated = false;
            ctrl.misconceptions = [];
          };

          ctrl.getQuestionIndex = function(index) {
            return ctrl.currentPage * NUM_QUESTIONS_PER_PAGE + index + 1;
          };

          ctrl.goToNextPage = function() {
            ctrl.currentPage++;
            ctrl.questionSummaries = ctrl.getQuestionSummariesAsync(
              ctrl.currentPage, ctrl.skillIds, true, false
            );
            ctrl.populateTruncatedQuestionSummaries();
          };

          ctrl.goToPreviousPage = function() {
            ctrl.currentPage--;
            ctrl.questionSummaries = ctrl.getQuestionSummariesAsync(
              ctrl.currentPage, ctrl.skillIds, false, false
            );
            ctrl.populateTruncatedQuestionSummaries();
          };

          ctrl.populateTruncatedQuestionSummaries = function() {
            if (ctrl.questionSummaries) {
              ctrl.truncatedQuestionSummaries =
                ctrl.questionSummaries.map(function(question) {
                  var summary = $filter(
                    'formatRtePreview')(question.summary.question_content);
                  summary = $filter('truncate')(summary, 100);
                  return summary;
                });
            }
          };

          ctrl.getSkillDescription = function(skillDescriptions) {
            return skillDescriptions.join(', ');
          };

          ctrl.saveAndPublishQuestion = function() {
            var validationErrors = ctrl.question.validate(
              ctrl.misconceptions);
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            if (!ctrl.questionIsBeingUpdated) {
              EditableQuestionBackendApiService.createQuestion(
                ctrl.newQuestionSkillIds, ctrl.newQuestionSkillDifficulties,
                ctrl.question.toBackendDict(true)
              ).then(function() {
                ctrl.questionSummaries = ctrl.getQuestionSummariesAsync(
                  0, ctrl.skillIds, true, true
                );
                ctrl.questionIsBeingSaved = false;
                ctrl.currentPage = 0;
              });
            } else {
              if (QuestionUndoRedoService.hasChanges()) {
                ctrl.questionIsBeingSaved = true;
                // TODO(tjiang11): Allow user to specify a commit message.
                EditableQuestionBackendApiService.updateQuestion(
                  ctrl.questionId, ctrl.question.getVersion(), 'blank',
                  QuestionUndoRedoService.getCommittableChangeList()).then(
                  function() {
                    QuestionUndoRedoService.clearChanges();
                    ctrl.questionIsBeingSaved = false;
                    ctrl.questionSummaries = ctrl.getQuestionSummariesAsync(
                      ctrl.currentPage, ctrl.skillIds, true, true
                    );
                  }, function(error) {
                    AlertsService.addWarning(
                      error || 'There was an error saving the question.');
                    ctrl.questionIsBeingSaved = false;
                  });
              }
            }
          };

          ctrl.initializeNewQuestionCreation = function(skillIds) {
            ctrl.question =
              QuestionObjectFactory.createDefaultQuestion(skillIds);
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question.getStateData();
            ctrl.questionIsBeingUpdated = false;
            ctrl.openQuestionEditor();
          };

          ctrl.createQuestion = function() {
            ctrl.newQuestionSkillIds = [];
            var currentMode = MODE_SELECT_SKILL;
            if (!ctrl.selectSkillModalIsShown()) {
              ctrl.newQuestionSkillIds = ctrl.skillIds;
              currentMode = MODE_SELECT_DIFFICULTY;
            }
            var linkedSkillsWithDifficulty = [];
            ctrl.newQuestionSkillIds.forEach(function(skillId) {
              linkedSkillsWithDifficulty.push(
                SkillDifficultyObjectFactory.create(
                  skillId, '', DEFAULT_SKILL_DIFFICULTY));
            });
            var allSkillSummaries = ctrl.getAllSkillSummaries();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'select-skill-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  var init = function() {
                    $scope.currentMode = currentMode;
                    $scope.linkedSkillsWithDifficulty =
                      linkedSkillsWithDifficulty;
                    $scope.skillSummaries = allSkillSummaries;
                  };

                  $scope.selectOrDeselectSkill = function(skillId, index) {
                    if (!$scope.skillSummaries[index].isSelected) {
                      $scope.linkedSkillsWithDifficulty.push(
                        SkillDifficultyObjectFactory.create(
                          skillId,
                          $scope.skillSummaries[index].getDescription(),
                          DEFAULT_SKILL_DIFFICULTY));
                      $scope.skillSummaries[index].isSelected = true;
                    } else {
                      var idIndex = $scope.linkedSkillsWithDifficulty.map(
                        function(linkedSkillWithDifficulty) {
                          return linkedSkillWithDifficulty.getId();
                        }).indexOf(skillId);
                      $scope.linkedSkillsWithDifficulty.splice(idIndex, 1);
                      $scope.skillSummaries[index].isSelected = false;
                    }
                  };

                  $scope.goToSelectSkillView = function() {
                    $scope.currentMode = MODE_SELECT_SKILL;
                  };

                  $scope.goToSelectDifficultyView = function() {
                    $scope.currentMode = MODE_SELECT_DIFFICULTY;
                  };

                  $scope.startQuestionCreation = function() {
                    $uibModalInstance.close($scope.linkedSkillsWithDifficulty);
                  };

                  $scope.cancelModal = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.closeModal = function() {
                    $uibModalInstance.dismiss('ok');
                  };

                  init();
                }
              ]
            });

            modalInstance.result.then(function(linkedSkillsWithDifficulty) {
              ctrl.newQuestionSkillIds = [];
              ctrl.newQuestionSkillDifficulties = [];
              linkedSkillsWithDifficulty.forEach(
                function(linkedSkillWithDifficulty) {
                  ctrl.newQuestionSkillIds.push(
                    linkedSkillWithDifficulty.getId());
                  ctrl.newQuestionSkillDifficulties.push(
                    linkedSkillWithDifficulty.getDifficulty());
                }
              );
              ctrl.populateMisconceptions(ctrl.newQuestionSkillIds);
              if (AlertsService.warnings.length === 0) {
                ctrl.initializeNewQuestionCreation(
                  ctrl.newQuestionSkillIds);
              }
            });
          };

          ctrl.populateMisconceptions = function(skillIds) {
            EditableSkillBackendApiService.fetchMultiSkills(
              skillIds).then(
              function(skillDicts) {
                skillDicts.forEach(function(skillDict) {
                  ctrl.misconceptions = ctrl.misconceptions.concat(
                    skillDict.misconceptions.map(
                      function(misconceptionsBackendDict) {
                        return MisconceptionObjectFactory
                          .createFromBackendDict(misconceptionsBackendDict);
                      }));
                });
              }, function(error) {
                AlertsService.addWarning();
              });
          };

          ctrl.editQuestion = function(questionSummary) {
            ctrl.misconceptions = [];
            EditableQuestionBackendApiService.fetchQuestion(
              questionSummary.id).then(function(response) {
              if (response.associated_skill_dicts) {
                response.associated_skill_dicts.forEach(function(skillDict) {
                  skillDict.misconceptions.forEach(function(misconception) {
                    ctrl.misconceptions.push(
                      MisconceptionObjectFactory.createFromBackendDict(
                        misconception));
                  });
                });
              }
              ctrl.question =
                QuestionObjectFactory.createFromBackendDict(
                  response.question_dict);
              ctrl.questionId = ctrl.question.getId();
              ctrl.questionStateData = ctrl.question.getStateData();
              ctrl.questionIsBeingUpdated = true;

              ctrl.openQuestionEditor();
            }, function(errorResponse) {
              AlertsService.addWarning(
                errorResponse.error || 'Failed to fetch question.');
            });
          };

          ctrl.openQuestionEditor = function() {
            var question = ctrl.question;
            var questionStateData = ctrl.questionStateData;
            var questionId = ctrl.questionId;
            var canEditQuestion = ctrl.canEditQuestion();
            var misconceptions = ctrl.misconceptions;
            QuestionUndoRedoService.clearChanges();

            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/modal-templates/' +
                'question-editor-modal.directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                'UndoRedoService',
                function(
                    $scope, $uibModalInstance, StateEditorService,
                    UndoRedoService) {
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.questionId = questionId;
                  $scope.misconceptions = misconceptions;
                  $scope.canEditQuestion = canEditQuestion;
                  $scope.removeErrors = function() {
                    $scope.validationError = null;
                  };
                  $scope.questionChanged = function() {
                    $scope.removeErrors();
                  };
                  $scope.done = function() {
                    $scope.validationError = $scope.question.validate(
                      $scope.misconceptions);
                    if ($scope.validationError) {
                      return;
                    }
                    if (!StateEditorService.isCurrentSolutionValid()) {
                      $scope.validationError =
                        'The solution is invalid and does not ' +
                        'correspond to a correct answer';
                      return;
                    }
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    if (QuestionUndoRedoService.hasChanges()) {
                      var modalInstance = $uibModal.open({
                        templateUrl:
                          UrlInterpolationService.getDirectiveTemplateUrl(
                            '/components/question-directives/modal-templates/' +
                            'confirm-question-modal-exit-modal.directive.html'),
                        backdrop: true,
                        controller: [
                          '$scope', '$uibModalInstance',
                          function($scope, $uibModalInstance) {
                            $scope.cancel = function() {
                              $uibModalInstance.dismiss('cancel');
                            };

                            $scope.close = function() {
                              $uibModalInstance.close();
                            };
                          }
                        ]
                      });
                      modalInstance.result.then(function() {
                        $uibModalInstance.dismiss('cancel');
                      });
                    } else {
                      $uibModalInstance.dismiss('cancel');
                    }
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              ctrl.saveAndPublishQuestion();
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
