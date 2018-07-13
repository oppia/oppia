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
  '$scope', '$rootScope', '$http', '$window',
  'AlertsService', 'TopicsAndSkillsDashboardBackendApiService',
  'UrlInterpolationService', 'TopicCreationService',
  'FATAL_ERROR_CODES', 'EVENT_TYPE_TOPIC_CREATION_ENABLED',
  'EVENT_TYPE_SKILL_CREATION_ENABLED',
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  function(
      $scope, $rootScope, $http, $window,
      AlertsService, TopicsAndSkillsDashboardBackendApiService,
      UrlInterpolationService, TopicCreationService,
      FATAL_ERROR_CODES, EVENT_TYPE_TOPIC_CREATION_ENABLED,
      EVENT_TYPE_SKILL_CREATION_ENABLED,
      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
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
          $scope.unpublishedSkillSummaries =
            response.data.unpublished_skill_summary_dicts;
          console.log(angular.copy(response.data.unpublished_skill_summary_dicts));
          $scope.activeTab = $scope.TAB_NAME_TOPICS;
          $scope.userCanCreateTopic = response.data.can_create_topic;
          $scope.userCanCreateSkill = response.data.can_create_skill;
          $rootScope.$broadcast(
            EVENT_TYPE_TOPIC_CREATION_ENABLED, $scope.userCanCreateTopic);
          $rootScope.$broadcast(
            EVENT_TYPE_SKILL_CREATION_ENABLED, $scope.userCanCreateSkill);
          $scope.userCanDeleteTopic = response.data.can_delete_topic;
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

    $scope.setActiveTab = function(tabName) {
      $scope.activeTab = tabName;
    };
    $scope.createTopic = function() {
      TopicCreationService.createNewTopic();
    };

    _initDashboard();
    $scope.$on(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
  }
]);
