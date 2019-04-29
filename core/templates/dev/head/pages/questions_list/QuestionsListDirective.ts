
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
oppia.directive('questionsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
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
        '/pages/questions_list/questions_list_directive.html'),
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
          $scope.currentPage = 0;

          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.questionSummaries =
              $scope.getQuestionSummaries($scope.currentPage);
            $scope.truncatedQuestionSummaries = [];
            if ($scope.questionSummaries) {
              $scope.truncatedQuestionSummaries =
                $scope.questionSummaries.map(function(question) {
                  var summary = $filter(
                    'formatRtePreview')(question.summary.question_content);
                  summary = $filter('truncate')(summary, 100);
                  return summary;
                });
            }
            $scope.activeQuestion = null;
            $scope.questionIsBeingUpdated = false;
            $scope.misconceptions = [];
            if ($scope.getSkill()) {
              $scope.misconceptions = $scope.getSkill().getMisconceptions();
              $scope.skillId = $scope.getSkill().getId();
              $scope.entityId = $scope.skillId;
            } else {
              $scope.entityId = $scope.getTopicId();
            }
          };

          $scope.getQuestionIndex = function(index) {
            return $scope.currentPage * NUM_QUESTIONS_PER_PAGE + index + 1;
          };

          $scope.goToNextPage = function() {
            $scope.currentPage++;
            var questionSummaries =
              $scope.getQuestionSummaries($scope.currentPage);
            if (questionSummaries === null) {
              $scope.fetchQuestionSummaries($scope.entityId, false);
            } else {
              $scope.questionSummaries = questionSummaries;
            }
          };

          $scope.goToPreviousPage = function() {
            $scope.currentPage--;
            $scope.questionSummaries =
              $scope.getQuestionSummaries($scope.currentPage);
          };

          $scope.saveAndPublishQuestion = function() {
            var validationErrors = $scope.question.validate(
              $scope.misconceptions);
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            if (!$scope.questionIsBeingUpdated) {
              EditableQuestionBackendApiService.createQuestion(
                $scope.skillId, $scope.question.toBackendDict(true)
              ).then(function() {
                $scope.fetchQuestionSummaries($scope.entityId, true);
                $scope.questionIsBeingSaved = false;
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
                    $scope.questionIsBeingSaved = false;
                    $scope.fetchQuestionSummaries($scope.entityId, true);
                  }, function(error) {
                    AlertsService.addWarning(
                      error || 'There was an error saving the question.');
                    $scope.questionIsBeingSaved = false;
                  });
              }
            }
          };

          $scope.initializeNewQuestionCreation = function() {
            $scope.question =
              QuestionObjectFactory.createDefaultQuestion();
            $scope.questionId = $scope.question.getId();
            $scope.questionStateData = $scope.question.getStateData();
            $scope.questionIsBeingUpdated = false;
            $scope.openQuestionEditor();
          };

          $scope.createQuestion = function() {
            if ($scope.getSkill()) {
              $scope.initializeNewQuestionCreation();
              return;
            }
            var allSkillSummaries = $scope.getAllSkillSummaries();
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
              $scope.skillId = skillId;
              EditableSkillBackendApiService.fetchSkill(
                skillId).then(
                function(skillDict) {
                  $scope.misconceptions = skillDict.misconceptions.map(function(
                      misconceptionsBackendDict) {
                    return MisconceptionObjectFactory.createFromBackendDict(
                      misconceptionsBackendDict);
                  });
                  $scope.initializeNewQuestionCreation();
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          $scope.editQuestion = function(questionSummary) {
            $scope.misconceptions = [];
            EditableQuestionBackendApiService.fetchQuestion(
              questionSummary.id).then(function(response) {
              if (response.associated_skill_dicts) {
                response.associated_skill_dicts.forEach(function(skillDict) {
                  skillDict.misconceptions.forEach(function(misconception) {
                    $scope.misconceptions.push(
                      MisconceptionObjectFactory.createFromBackendDict(
                        misconception));
                  });
                });
              }
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
            var canEditQuestion = $scope.canEditQuestion();
            var misconceptions = $scope.misconceptions;
            QuestionUndoRedoService.clearChanges();

            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/questions_tab/' +
                'question_editor_modal_directive.html'),
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
                            '/pages/skill_editor/questions_tab/' +
                            'confirm_question_modal_exit_modal_directive.html'),
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
              $scope.saveAndPublishQuestion();
            });
          };

          $scope.setActiveQuestion = function(questionSuggestionThread) {
            if (questionSuggestionThread.getSuggestionStatus() === 'review') {
              $scope.activeQuestion = (
                questionSuggestionThread.suggestion.question);
              $scope.idOfActiveSuggestion = (
                questionSuggestionThread.suggestion.suggestionId);
            }
          };

          $scope.clearActiveQuestion = function() {
            $scope.activeQuestion = null;
            $scope.idOfActiveSuggestion = null;
            $scope.suggestionReviewMessage = null;
          };

          $scope.showSelectSkillModal = function() {
            var allSkillSummaries = $scope.getAllSkillSummaries();
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
              $scope.selectedSkillId = res.skillId;
              EditableSkillBackendApiService.fetchSkill(res.skillId).then(
                function(skillDict) {
                  $scope.misconceptions = skillDict.misconceptions.map(function(
                      misconceptionsBackendDict) {
                    return MisconceptionObjectFactory.createFromBackendDict(
                      misconceptionsBackendDict);
                  });
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          $scope.acceptQuestion = function(suggestionId, reviewMessage) {
            var suggestionActionHandlerUrl = (
              UrlInterpolationService.interpolateUrl(
                '/suggestionactionhandler/topic/<topic_id>/<suggestion_id>', {
                  topic_id: $scope.getTopicId(),
                  suggestion_id: suggestionId
                }));
            $http.put(suggestionActionHandlerUrl, {
              action: 'accept',
              skill_id: $scope.selectedSkillId,
              commit_message: 'unused_commit_message',
              review_message: reviewMessage
            }).then(function() {
              $scope.clearActiveQuestion();
              $window.location.reload();
            });
          };

          $scope.rejectQuestion = function(suggestionId, reviewMessage) {
            var suggestionActionHandlerUrl = (
              UrlInterpolationService.interpolateUrl(
                '/suggestionactionhandler/topic/<topic_id>/<suggestion_id>', {
                  topic_id: $scope.getTopicId(),
                  suggestion_id: suggestionId
                }));
            $http.put(suggestionActionHandlerUrl, {
              action: 'reject',
              commit_message: 'unused_commit_message',
              review_message: reviewMessage
            }).then(function() {
              $scope.clearActiveQuestion();
              $window.location.reload();
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
