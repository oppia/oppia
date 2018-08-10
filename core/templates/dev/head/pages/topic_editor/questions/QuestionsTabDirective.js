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
        '$scope', '$http', '$uibModal', 'AlertsService',
        'TopicEditorStateService', 'QuestionCreationService',
        'EditableQuestionBackendApiService', 'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionSuggestionObjectFactory', 'SuggestionThreadObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'StateEditorService', function(
            $scope, $http, $uibModal, AlertsService,
            TopicEditorStateService, QuestionCreationService,
            EditableQuestionBackendApiService, EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionSuggestionObjectFactory, SuggestionThreadObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, StateEditorService) {
          var _initTab = function() {
            $scope.questionEditorIsShown = false;
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.canEditQuestion = $scope.topicRights.canEditTopic();
            $scope.questionSummaries =
              TopicEditorStateService.getQuestionSummaries();
            $scope.questionSuggestionThreads = []
            $scope.getSuggestedQuestions();
            $scope.questionUnderReview = null;
            $scope.suggestionReviewMessage = null;
          };

          $scope.saveAndPublishQuestion = function() {
            var validationErrors = $scope.question.validate(
              $scope.misconceptions);
            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            EditableQuestionBackendApiService.createQuestion(
              $scope.skillId, $scope.question.toBackendDict(
                true)
            ).then(function() {
              TopicEditorStateService.fetchQuestionSummaries(
                $scope.topic.getId(), function() {
                  _initTab();
                }
              );
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

          $scope.getSuggestedQuestions = function() {
            $scope.questionSuggestionThreads = [];
            $http.get('/generalsuggestionlisthandler', {
              params: {
                target_type: 'topic',
                target_id: $scope.topic.getId(),
                suggestion_type: 'add_question'
              }
            }).then(function(suggestionsResponse) {
              $http.get(
                '/threadlisthandlerfortopic/' + $scope.topic.getId()).then(
                function(threadsResponse) {
                  var suggestionThreads = (
                    threadsResponse.data.suggestion_thread_dicts);
                  var suggestions = suggestionsResponse.data.suggestions;
                  if (suggestionThreads.length !== suggestions.length) {
                    $log.error(
                      'Number of suggestion threads doesn\'t match number of' +
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
            });
          };

          $scope.setQuestionUnderReview = function(questionSuggestionThread) {
            $scope.questionUnderReview = (
              questionSuggestionThread.suggestion.question);
            $scope.idOfSuggestionUnderReview = (
              questionSuggestionThread.suggestion.suggestionId);
          };

          $scope.clearQuestionUnderReview = function() {
            $scope.questionUnderReview = null;
            $scope.suggestionReviewMessage = null;
            $scope.idOfSuggestionUnderReview = null;
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
                    $uibModalInstance.close($scope.selectedSkillId);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });
          };

          $scope.acceptQuestion = function(suggestionId) {
            $http.put(
              '/generalsuggestionactionhandler/topic/' + $scope.topic.getId() +
              '/' + suggestionId, {
                action: 'accept',
                skill_id: $scope.selectedSkillId,
                commit_message: 'unused_commit_message'
              }
            ).then(function() {
              $scope.clearQuestionUnderReview();
            });
          };

          $scope.rejectQuestion = function(suggestionId) {
            $http.put(
              '/generalsuggestionactionhandler/topic/' + $scope.topic.getId() +
              '/' + suggestionId, {
                action: 'reject',
                commit_message: 'unused_commit_message',
                review_message: $scope.suggestionReviewMessage
              }
            ).then(function(){
              $scope.clearQuestionUnderReview();
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, _initTab);

          _initTab();
        }
      ]
    };
  }]);
