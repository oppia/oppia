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

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/skills-list/' +
  'skills-list.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'navbar/' +
  'topics-and-skills-dashboard-navbar-breadcrumb.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'navbar/' +
  'topics-and-skills-dashboard-navbar.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/topics-list/' +
  'topics-list.directive.ts');

require(
  'components/entity-creation-services/' +
  'skill-creation.service.ts');
require(
  'components/entity-creation-services/' +
  'topic-creation.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardBackendApiService.ts'
);
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');

oppia.controller(
  'TopicsAndSkillsDashboard', [
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
              AlertsService.addWarning(
                'Unexpected error code from the server.');
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
            '/pages/topics-and-skills-dashboard-page/' +
            'templates/' +
            'create-new-skill-modal.template.html'),
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
      $scope.$on(
        EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
    }
  ]
);
