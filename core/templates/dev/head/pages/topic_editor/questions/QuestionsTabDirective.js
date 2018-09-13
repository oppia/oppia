
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
        'TopicEditorStateService', 'QuestionCreationService',
        'EditableQuestionBackendApiService', 'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionSuggestionObjectFactory', 'SuggestionThreadObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'QuestionUndoRedoService', 'UrlService',
        'UndoRedoService', function(
            $scope, $http, $q, $uibModal, $window, AlertsService,
            TopicEditorStateService, QuestionCreationService,
            EditableQuestionBackendApiService, EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionSuggestionObjectFactory, SuggestionThreadObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED,
            QuestionUndoRedoService, UrlService,
            UndoRedoService) {
          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.canEditQuestion = $scope.topicRights.canEditTopic();
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries();
            $scope.misconceptions = [];
            $scope.questionSuggestionThreads = [];
            $scope.activeQuestion = null;
            $scope.suggestionReviewMessage = null;
            $scope.questionIsBeingUpdated = false;
            $scope.questionIsBeingSaved = false;
          };

          $scope.hasChanges = function() {
            return QuestionUndoRedoService.hasChanges();
          };

          $scope.saveQuestion = function() {
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
                  $scope.topic.getId(), function() {
                    _initTab();
                  }
                );
                $scope.questionIsBeingSaved = false;
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
              $scope.questionEditorIsShown = true;
              $scope.questionIsBeingUpdated = true;
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

                  $scope.selectSkill = function(skillId) {
                    $scope.selectedSkillId = skillId;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close($scope.selectedSkillId);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
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
                  $scope.questionEditorIsShown = true;
                }, function(error) {
                  AlertsService.addWarning();
                });
            });
          };

          loadSuggestedQuestionsAsync = function() {
            $scope.questionSuggestionThreads = [];
            var suggestionsPromise = $http.get(
              '/generalsuggestionlisthandler', {
                params: {
                  target_type: 'topic',
                  target_id: $scope.topic.getId(),
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
                '/generalsuggestionactionhandler/topic/<topic_id>/' +
                '<suggestion_id>', {
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
                '/generalsuggestionactionhandler/topic/<topic_id>/' +
                '<suggestion_id>', {
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
