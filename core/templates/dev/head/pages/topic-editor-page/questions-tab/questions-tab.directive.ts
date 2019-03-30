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

require('pages/questions_list/QuestionsListDirective.ts');

require('components/QuestionCreationService.ts');
require('domain/editor/undo_redo/QuestionUndoRedoService.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/question/EditableQuestionBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/EditableSkillBackendApiService.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/suggestion/QuestionSuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/state_editor/state_properties/StateEditorService.ts');
require('pages/topic-editor-page/topic-editor-services/topic-editor-state/topic-editor-state.service.ts');
require('services/AlertsService.ts');
require('services/contextual/UrlService.ts');

angular.module('questionsTabModule').directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/questions-tab/questions-tab.directive.html'),
      controller: [
        '$scope', '$http', '$log', '$q', '$uibModal', '$window',
        'AlertsService', 'TopicEditorStateService', 'QuestionCreationService',
        'UrlService', 'EditableQuestionBackendApiService',
        'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionSuggestionObjectFactory', 'SuggestionThreadObjectFactory',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'StateEditorService',
        'QuestionUndoRedoService', 'UndoRedoService',
        'NUM_QUESTIONS_PER_PAGE', function(
            $scope, $http, $log, $q, $uibModal, $window,
            AlertsService, TopicEditorStateService, QuestionCreationService,
            UrlService, EditableQuestionBackendApiService,
            EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionSuggestionObjectFactory, SuggestionThreadObjectFactory,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, StateEditorService,
            QuestionUndoRedoService, UndoRedoService,
            NUM_QUESTIONS_PER_PAGE) {
          $scope.currentPage = 0;
          $scope.getQuestionSummaries =
            TopicEditorStateService.getQuestionSummaries;
          $scope.fetchQuestionSummaries =
            TopicEditorStateService.fetchQuestionSummaries;
          $scope.isLastQuestionBatch =
            TopicEditorStateService.isLastQuestionBatch;

          var _initTab = function() {
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.allSkillSummaries = [];
            $scope.allSkillSummaries = $scope.allSkillSummaries.concat(
              $scope.topic.getUncategorizedSkillSummaries());
            for (var i = 0; i < $scope.topic.getSubtopics().length; i++) {
              var subtopic = $scope.topic.getSubtopics()[i];
              $scope.allSkillSummaries = $scope.allSkillSummaries.concat(
                subtopic.getSkillSummaries());
            }
            $scope.canEditQuestion = $scope.topicRights.canEditTopic();
            $scope.misconceptions = [];
            $scope.questionSuggestionThreads = [];
            $scope.activeQuestion = null;
            $scope.suggestionReviewMessage = null;
            $scope.questionIsBeingUpdated = false;
            $scope.questionIsBeingSaved = false;
            $scope.emptyMisconceptionsList = [];
          };

          var loadSuggestedQuestionsAsync = function() {
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

          _initTab();
          loadSuggestedQuestionsAsync();
        }
      ]
    };
  }]);
