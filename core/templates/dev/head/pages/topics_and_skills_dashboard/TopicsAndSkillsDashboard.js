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
 * @fileoverview Controllers for the topics and skills dashboard.
 */

require('components/QuestionCreationService.js');
require('components/StoryCreationService.js');
require('domain/editor/undo_redo/BaseUndoRedoService.js');
require('domain/editor/undo_redo/QuestionUndoRedoService.js');
require('domain/editor/undo_redo/UndoRedoService.js');
require('domain/exploration/AnswerGroupObjectFactory.js');
require('domain/exploration/HintObjectFactory.js');
require('domain/exploration/OutcomeObjectFactory.js');
require('domain/exploration/RuleObjectFactory.js');
require('domain/exploration/SolutionObjectFactory.js');
require('domain/exploration/SubtitledHtmlObjectFactory.js');
require('domain/question/EditableQuestionBackendApiService.js');
require('domain/question/QuestionObjectFactory.js');
require('domain/skill/EditableSkillBackendApiService.js');
require('domain/skill/MisconceptionObjectFactory.js');
require('domain/state/StateObjectFactory.js');
require('domain/story/EditableStoryBackendApiService.js');
require('domain/story/StoryObjectFactory.js');
require('domain/story/StoryUpdateService.js');
require('domain/suggestion/QuestionSuggestionObjectFactory.js');
require('domain/suggestion/SuggestionThreadObjectFactory.js');
require('domain/topic/EditableTopicBackendApiService.js');
require('domain/topic/SubtopicPageObjectFactory.js');
require('domain/topic/TopicObjectFactory.js');
require('domain/topic/TopicRightsBackendApiService.js');
require('domain/topic/TopicRightsObjectFactory.js');
require('domain/topic/TopicUpdateService.js');
require('domain/utilities/UrlInterpolationService.js');
require('filters/CamelCaseToHyphensFilter.js');
require('pages/exploration_editor/EditorFirstTimeEventsService.js');
require('pages/exploration_editor/ExplorationDataService.js');
require('pages/exploration_editor/ExplorationStatesService.js');
require('pages/exploration_editor/editor_tab/InteractionDetailsCacheService.js');
require('pages/exploration_editor/editor_tab/ResponsesService.js');
require('pages/exploration_editor/editor_tab/SolutionValidityService.js');
require('pages/exploration_editor/editor_tab/SolutionVerificationService.js');
require('pages/exploration_editor/feedback_tab/ThreadDataService.js');
require('pages/exploration_player/CurrentInteractionService.js');
require('pages/exploration_player/ExplorationEngineService.js');
require('pages/exploration_player/PlayerPositionService.js');
require('pages/exploration_player/PlayerTranscriptService.js');
require('pages/state_editor/state_properties/StateContentService.js');
require('pages/state_editor/state_properties/StateCustomizationArgsService.js');
require('pages/state_editor/state_properties/StateEditorService.js');
require('pages/state_editor/state_properties/StateHintsService.js');
require('pages/state_editor/state_properties/StateInteractionIdService.js');
require('pages/state_editor/state_properties/StateSolutionService.js');
require('pages/story_editor/StoryEditorStateService.js');
require('pages/story_editor/main_editor/StoryEditorDirective.js');
require('pages/suggestion_editor/SuggestionModalService.js');
require('pages/topic_editor/TopicEditorRoutingService.js');
require('pages/topic_editor/TopicEditorStateService.js');
require('services/AlertsService.js');
require('services/ContextService.js');
require('services/EditabilityService.js');
require('services/ExplorationHtmlFormatterService.js');
require('services/GenerateContentIdService.js');
require('services/HtmlEscaperService.js');
require('services/contextual/UrlService.js');
require('services/stateful/FocusManagerService.js');

oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

oppia.constant('EVENT_TYPE_TOPIC_CREATION_ENABLED', 'topicCreationEnabled');
oppia.constant('EVENT_TYPE_SKILL_CREATION_ENABLED', 'skillCreationEnabled');
oppia.constant(
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'topicsAndSkillsDashboardReinitialized');

oppia.controller('TopicsAndSkillsDashboard', [
  '$http', '$rootScope', '$scope', '$uibModal', '$window',
  'AlertsService', 'SkillCreationService',
  'TopicCreationService', 'TopicsAndSkillsDashboardBackendApiService',
  'UrlInterpolationService',
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'EVENT_TYPE_SKILL_CREATION_ENABLED',
  'EVENT_TYPE_TOPIC_CREATION_ENABLED',
  'FATAL_ERROR_CODES',
  function(
      $http, $rootScope, $scope, $uibModal, $window,
      AlertsService, SkillCreationService,
      TopicCreationService, TopicsAndSkillsDashboardBackendApiService,
      UrlInterpolationService,
      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
      EVENT_TYPE_SKILL_CREATION_ENABLED,
      EVENT_TYPE_TOPIC_CREATION_ENABLED,
      FATAL_ERROR_CODES) {
    $scope.TAB_NAME_TOPICS = 'topics';
    $scope.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
    $scope.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';

    var _initDashboard = function() {
      TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
        function(response) {
          $scope.topicSummaries = response.data.topic_summary_dicts;
          $scope.editableTopicSummaries = $scope.topicSummaries.filter(
            function(summary) {
              return summary.can_edit_topic === true;
            }
          );
          $scope.untriagedSkillSummaries =
            response.data.untriaged_skill_summary_dicts;
          $scope.mergeableSkillSummaries =
            response.data.mergeable_skill_summary_dicts;
          $scope.unpublishedSkillSummaries =
            response.data.unpublished_skill_summary_dicts;
          $scope.activeTab = $scope.TAB_NAME_TOPICS;
          $scope.userCanCreateTopic = response.data.can_create_topic;
          $scope.userCanCreateSkill = response.data.can_create_skill;
          $rootScope.$broadcast(
            EVENT_TYPE_TOPIC_CREATION_ENABLED, $scope.userCanCreateTopic);
          $rootScope.$broadcast(
            EVENT_TYPE_SKILL_CREATION_ENABLED, $scope.userCanCreateSkill);
          $scope.userCanDeleteTopic = response.data.can_delete_topic;
          $scope.userCanDeleteSkill = response.data.can_delete_skill;
          if ($scope.topicSummaries.length === 0 &&
              $scope.untriagedSkillSummaries.length !== 0) {
            $scope.activeTab = $scope.TAB_NAME_UNTRIAGED_SKILLS;
          } else if (
            $scope.topicSummaries.length === 0 &&
            $scope.unpublishedSkillSummaries.length !== 0) {
            $scope.activeTab = $scope.TAB_NAME_UNPUBLISHED_SKILLS;
          }
        },
        function(errorResponse) {
          if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
            AlertsService.addWarning('Failed to get dashboard data');
          } else {
            AlertsService.addWarning('Unexpected error code from the server.');
          }
        }
      );
    };

    $scope.isTopicTabHelpTextVisible = function() {
      return (
        ($scope.topicSummaries.length === 0) &&
        ($scope.untriagedSkillSummaries.length > 0 ||
        $scope.unpublishedSkillSummaries.length > 0));
    };
    $scope.isSkillsTabHelpTextVisible = function() {
      return (
        ($scope.untriagedSkillSummaries.length === 0) &&
        ($scope.topicSummaries.length > 0) &&
        ($scope.unpublishedSkillSummaries.length === 0));
    };
    $scope.setActiveTab = function(tabName) {
      $scope.activeTab = tabName;
    };
    $scope.createTopic = function() {
      TopicCreationService.createNewTopic();
    };
    $scope.createSkill = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/topics_and_skills_dashboard/' +
          'create_new_skill_modal_directive.html'),
        backdrop: 'static',
        controller: [
          '$scope', '$uibModalInstance',
          function($scope, $uibModalInstance) {
            $scope.newSkillDescription = '';
            $scope.createNewSkill = function() {
              $uibModalInstance.close({
                description: $scope.newSkillDescription
              });
            };

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function(result) {
        SkillCreationService.createNewSkill(result.description);
      });
    };

    _initDashboard();
    $scope.$on(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
  }
]);
