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
        '/pages/topic_editor/questions/questions_tab_directive.html'),
      controller: [
        '$scope', '$http', '$q', '$uibModal', '$window', 'AlertsService',
        'TopicEditorStateService', 'QuestionCreationService', 'UrlService',
        'EditableQuestionBackendApiService', 'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionSuggestionObjectFactory', 'SuggestionThreadObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'StateEditorService',
        'QuestionUndoRedoService', 'UndoRedoService',
        'NUM_QUESTIONS_PER_PAGE', function(
            $scope, $http, $q, $uibModal, $window, AlertsService,
            TopicEditorStateService, QuestionCreationService, UrlService,
            EditableQuestionBackendApiService, EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionSuggestionObjectFactory, SuggestionThreadObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, StateEditorService,
            QuestionUndoRedoService, UndoRedoService,
            NUM_QUESTIONS_PER_PAGE) {
          $scope.currentPage = 0;
          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.canEditQuestion = $scope.topicRights.canEditTopic();
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries($scope.currentPage);
            $scope.isLastPage = TopicEditorStateService.isLastQuestionBatch;
            $scope.misconceptions = [];
            $scope.questionSuggestionThreads = [];
            $scope.activeQuestion = null;
            $scope.suggestionReviewMessage = null;
            $scope.questionIsBeingUpdated = false;
            $scope.questionIsBeingSaved = false;
            $scope.emptyMisconceptionsList = [];
          };

          $scope.hasChanges = function() {
            return QuestionUndoRedoService.hasChanges();
          };

          $scope.getQuestionIndex = function(index) {
            return $scope.currentPage * NUM_QUESTIONS_PER_PAGE + index + 1;
          };

          $scope.goToNextPage = function() {
            $scope.currentPage++;
            var questionSummaries =
              TopicEditorStateService.getQuestionSummaries($scope.currentPage);
            if (questionSummaries === null) {
              TopicEditorStateService.fetchQuestionSummaries(
                $scope.topic.getId(), false
              );
            } else {
              $scope.questionSummaries = questionSummaries;
            }
          };

          $scope.goToPreviousPage = function() {
            $scope.currentPage--;
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries($scope.currentPage);
          };

          $scope.saveAndPublishQuestion = function() {
            var validationErrors = $scope.question.validate(
              $scope.misconceptions);
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }

            if (!$scope.questionIsBeingUpdated) {
              $scope.questionIsBeingSaved = true;
              EditableQuestionBackendApiService.createQuestion(
                $scope.skillId,
                $scope.question.toBackendDict(true)
              ).then(function() {
                TopicEditorStateService.fetchQuestionSummaries(
                  $scope.topic.getId(), true
                );
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
                    TopicEditorStateService.fetchQuestionSummaries(
                      $scope.topic.getId(), function() {
                        _initTab();
                      }
                    );
                  }, function(error) {
                    AlertsService.addWarning(
                      error || 'There was an error saving the question.');
                    $scope.questionIsBeingSaved = false;
                  });
              }
            }
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

          $scope.createQuestion = function() {
            var allSkillSummaries = [];
            allSkillSummaries = allSkillSummaries.concat(
              $scope.topic.getUncategorizedSkillSummaries());
            for (var i = 0; i < $scope.topic.getSubtopics().length; i++) {
              var subtopic = $scope.topic.getSubtopics()[i];
              allSkillSummaries = allSkillSummaries.concat(
                subtopic.getSkillSummaries());
            }
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
                  $scope.question =
                    QuestionObjectFactory.createDefaultQuestion();
                  $scope.questionId = $scope.question.getId();
                  $scope.questionStateData = $scope.question.getStateData();
                  $scope.questionIsBeingUpdated = false;
                  $scope.openQuestionEditor();
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          $scope.openQuestionEditor = function() {
            var question = $scope.question;
            var questionStateData = $scope.questionStateData;
            var questionId = $scope.questionId;
            var canEditQuestion = $scope.canEditQuestion;
            var misconceptions = $scope.misconceptions;

            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/questions/' +
                'question_editor_modal_directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.questionId = questionId;
                  $scope.canEditQuestion = canEditQuestion;
                  $scope.misconceptions = misconceptions;
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

          loadSuggestedQuestionsAsync = function() {
            $scope.questionSuggestionThreads = [];
            var suggestionsPromise = $http.get(
              '/suggestionlisthandler', {
                params: {
                  target_type: 'topic',
                  target_id: UrlService.getTopicIdFromUrl(),
                  suggestion_type: 'add_question'
                }
              }
            );
            var threadsPromise = $http.get(
              UrlInterpolationService.interpolateUrl(
                '/threadlisthandlerfortopic/<topic_id>', {
                  topic_id: UrlService.getTopicIdFromUrl()
                }));
            $q.all([suggestionsPromise, threadsPromise]).then(function(res) {
              var suggestionThreads = res[1].data.suggestion_thread_dicts;
              var suggestions = res[0].data.suggestions;
              if (suggestionThreads.length !== suggestions.length) {
                $log.error(
                  'Number of suggestion threads doesn\'t match number of ' +
                  'suggestion objects');
              }
              for (var i = 0; i < suggestionThreads.length; i++) {
                for (var j = 0; j < suggestions.length; j++) {
                  if (suggestionThreads[i].thread_id ===
                      suggestions[j].suggestion_id) {
                    var suggestionThread = (
                      SuggestionThreadObjectFactory.createFromBackendDicts(
                        suggestionThreads[i], suggestions[j]));
                    $scope.questionSuggestionThreads.push(suggestionThread);
                    break;
                  }
                }
              }
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
            var allSkillSummaries = [];
            allSkillSummaries = allSkillSummaries.concat(
              $scope.topic.getUncategorizedSkillSummaries());
            for (var i = 0; i < $scope.topic.getSubtopics().length; i++) {
              var subtopic = $scope.topic.getSubtopics()[i];
              allSkillSummaries = allSkillSummaries.concat(
                subtopic.getSkillSummaries());
            }
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
                  topic_id: $scope.topic.getId(),
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
                  topic_id: $scope.topic.getId(),
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
          loadSuggestedQuestionsAsync();
        }
      ]
    };
  }]);
