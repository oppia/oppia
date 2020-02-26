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

require(
  'components/question-directives/questions-list/' +
  'questions-list.directive.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/editable-skill-backend-api.service.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/questions-list.service.ts');

angular.module('oppia').directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/questions-tab/' +
        'topic-questions-tab.directive.html'),
      controller: [
        '$scope', '$q', '$uibModal', '$window',
        'AlertsService', 'TopicEditorStateService', 'QuestionCreationService',
        'UrlService', 'EditableQuestionBackendApiService',
        'EditableSkillBackendApiService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'QuestionsListService',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'StateEditorService',
        'QuestionUndoRedoService', 'UndoRedoService',
        'NUM_QUESTIONS_PER_PAGE', 'EVENT_TOPIC_INITIALIZED',
        'EVENT_TOPIC_REINITIALIZED', function(
            $scope, $q, $uibModal, $window,
            AlertsService, TopicEditorStateService, QuestionCreationService,
            UrlService, EditableQuestionBackendApiService,
            EditableSkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, QuestionsListService,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, StateEditorService,
            QuestionUndoRedoService, UndoRedoService,
            NUM_QUESTIONS_PER_PAGE, EVENT_TOPIC_INITIALIZED,
            EVENT_TOPIC_REINITIALIZED) {
          var ctrl = this;
          $scope.getQuestionSummariesAsync =
            QuestionsListService.getQuestionSummariesAsync;
          $scope.getGroupedSkillSummaries =
            TopicEditorStateService.getGroupedSkillSummaries;
          $scope.isLastQuestionBatch =
            QuestionsListService.isLastQuestionBatch;
          var _initTab = function() {
            $scope.question = null;
            $scope.skillId = null;
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.skillIdToRubricsObject =
              TopicEditorStateService.getSkillIdToRubricsObject();
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
            $scope.questionIsBeingUpdated = false;
            $scope.questionIsBeingSaved = false;
            $scope.emptyMisconceptionsList = [];
          };

          $scope.reinitializeQuestionsList = function(skillId) {
            $scope.selectedSkillId = skillId;
            QuestionsListService.resetPageNumber();
            $scope.getQuestionSummariesAsync(
              [skillId], true, true
            );
          };
          ctrl.$onInit = function() {
            $scope.selectedSkillId = null;
            $scope.$on(EVENT_TOPIC_INITIALIZED, _initTab);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, _initTab);
            _initTab();
          };
        }
      ]
    };
  }]);
