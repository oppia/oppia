
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

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/question/EditableQuestionBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/EditableSkillBackendApiService.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/topic_editor/TopicEditorStateService.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/AlertsService.ts');
require('services/contextual/UrlService.ts');

oppia.directive('questionsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getSkill: '&skill',
        getTopicId: '&topicId',
        getQuestionSummaries: '=',
        fetchQuestionSummaries: '=',
        isLastPage: '=isLastQuestionBatch',
        getAllSkillSummaries: '&allSkillSummaries',
        canEditQuestion: '&',
        getQuestionSuggestionThreads: '&questionSuggestionThreads'
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
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'StateEditorService', 'QuestionUndoRedoService', 'UndoRedoService',
        function(
            $scope, $filter, $http, $q, $uibModal, $window,
            AlertsService, QuestionCreationService, UrlService,
            NUM_QUESTIONS_PER_PAGE, EditableQuestionBackendApiService,
            EditableSkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            StateEditorService, QuestionUndoRedoService, UndoRedoService) {
          var ctrl = this;
          ctrl.currentPage = 0;

          var _initTab = function() {
            ctrl.questionEditorIsShown = false;
            ctrl.question = null;
            ctrl.questionSummaries =
              ctrl.getQuestionSummaries(ctrl.currentPage);
            ctrl.truncatedQuestionSummaries = [];
            if (ctrl.questionSummaries) {
              ctrl.truncatedQuestionSummaries =
                ctrl.questionSummaries.map(function(question) {
                  var summary = $filter(
                    'formatRtePreview')(question.summary.question_content);
                  summary = $filter('truncate')(summary, 100);
                  return summary;
                });
            }
            ctrl.activeQuestion = null;
            ctrl.questionIsBeingUpdated = false;
            ctrl.misconceptions = [];
            if (ctrl.getSkill()) {
              ctrl.misconceptions = ctrl.getSkill().getMisconceptions();
              ctrl.skillId = ctrl.getSkill().getId();
              ctrl.entityId = ctrl.skillId;
            } else {
              ctrl.entityId = ctrl.getTopicId();
            }
          };

          ctrl.getQuestionIndex = function(index) {
            return ctrl.currentPage * NUM_QUESTIONS_PER_PAGE + index + 1;
          };

          ctrl.goToNextPage = function() {
            ctrl.currentPage++;
            var questionSummaries =
              ctrl.getQuestionSummaries(ctrl.currentPage);
            if (questionSummaries === null) {
              ctrl.fetchQuestionSummaries(ctrl.entityId, false);
            } else {
              ctrl.questionSummaries = questionSummaries;
            }
          };

          ctrl.goToPreviousPage = function() {
            ctrl.currentPage--;
            ctrl.questionSummaries =
              ctrl.getQuestionSummaries(ctrl.currentPage);
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
                ctrl.skillId, ctrl.question.toBackendDict(true)
              ).then(function() {
                ctrl.fetchQuestionSummaries(ctrl.entityId, true);
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
                    ctrl.fetchQuestionSummaries(ctrl.entityId, true);
                  }, function(error) {
                    AlertsService.addWarning(
                      error || 'There was an error saving the question.');
                    ctrl.questionIsBeingSaved = false;
                  });
              }
            }
          };

          ctrl.initializeNewQuestionCreation = function() {
            ctrl.question =
              QuestionObjectFactory.createDefaultQuestion();
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question.getStateData();
            ctrl.questionIsBeingUpdated = false;
            ctrl.openQuestionEditor();
          };

          ctrl.createQuestion = function() {
            if (ctrl.getSkill()) {
              ctrl.initializeNewQuestionCreation();
              return;
            }
            var allSkillSummaries = ctrl.getAllSkillSummaries();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/questions/' +
                'select_skill_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.selectedSkillId = null;
                  $scope.skillSummaries = allSkillSummaries;

                  $scope.selectOrDeselectSkill = function(skillId) {
                    if (skillId === $scope.selectedSkillId) {
                      $scope.selectedSkillId = null;
                    } else {
                      $scope.selectedSkillId = skillId;
                    }
                  };

                  $scope.done = function() {
                    $uibModalInstance.close($scope.selectedSkillId);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.ok = function() {
                    $uibModalInstance.dismiss('ok');
                  };
                }
              ]
            });

            modalInstance.result.then(function(skillId) {
              ctrl.skillId = skillId;
              EditableSkillBackendApiService.fetchSkill(
                skillId).then(
                function(skillDict) {
                  ctrl.misconceptions = skillDict.misconceptions.map(function(
                      misconceptionsBackendDict) {
                    return MisconceptionObjectFactory.createFromBackendDict(
                      misconceptionsBackendDict);
                  });
                  ctrl.initializeNewQuestionCreation();
                }, function(error) {
                  AlertsService.addWarning();
                });
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
                '/pages/skill-editor-page/modal-templates/' +
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
                            '/pages/skill-editor-page/modal-templates/' +
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

          ctrl.setActiveQuestion = function(questionSuggestionThread) {
            if (questionSuggestionThread.getSuggestionStatus() === 'review') {
              ctrl.activeQuestion = (
                questionSuggestionThread.suggestion.question);
              ctrl.idOfActiveSuggestion = (
                questionSuggestionThread.suggestion.suggestionId);
            }
          };

          ctrl.clearActiveQuestion = function() {
            ctrl.activeQuestion = null;
            ctrl.idOfActiveSuggestion = null;
            ctrl.suggestionReviewMessage = null;
          };

          ctrl.showSelectSkillModal = function() {
            var allSkillSummaries = ctrl.getAllSkillSummaries();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/questions/' +
                'select_skill_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.selectedSkillId = null;
                  $scope.skillSummaries = allSkillSummaries;

                  $scope.selectSkill = function(skillId) {
                    $scope.selectedSkillId = skillId;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close({
                      skillId: $scope.selectedSkillId
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(res) {
              ctrl.selectedSkillId = res.skillId;
              EditableSkillBackendApiService.fetchSkill(res.skillId).then(
                function(skillDict) {
                  ctrl.misconceptions = skillDict.misconceptions.map(function(
                      misconceptionsBackendDict) {
                    return MisconceptionObjectFactory.createFromBackendDict(
                      misconceptionsBackendDict);
                  });
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          ctrl.acceptQuestion = function(suggestionId, reviewMessage) {
            var suggestionActionHandlerUrl = (
              UrlInterpolationService.interpolateUrl(
                '/suggestionactionhandler/topic/<topic_id>/<suggestion_id>', {
                  topic_id: ctrl.getTopicId(),
                  suggestion_id: suggestionId
                }));
            $http.put(suggestionActionHandlerUrl, {
              action: 'accept',
              skill_id: ctrl.selectedSkillId,
              commit_message: 'unused_commit_message',
              review_message: reviewMessage
            }).then(function() {
              ctrl.clearActiveQuestion();
              $window.location.reload();
            });
          };

          ctrl.rejectQuestion = function(suggestionId, reviewMessage) {
            var suggestionActionHandlerUrl = (
              UrlInterpolationService.interpolateUrl(
                '/suggestionactionhandler/topic/<topic_id>/<suggestion_id>', {
                  topic_id: ctrl.getTopicId(),
                  suggestion_id: suggestionId
                }));
            $http.put(suggestionActionHandlerUrl, {
              action: 'reject',
              commit_message: 'unused_commit_message',
              review_message: reviewMessage
            }).then(function() {
              ctrl.clearActiveQuestion();
              $window.location.reload();
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
