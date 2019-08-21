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

require('base_components/BaseContentDirective.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/skills-list/' +
  'skills-list.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/topics-list/' +
  'topics-list.directive.ts');

require('components/entity-creation-services/skill-creation.service.ts');
require('components/entity-creation-services/topic-creation.service.ts.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');

require('domain/skill/RubricObjectFactory.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardBackendApiService.ts'
);
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('topicsAndSkillsDashboardPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/' +
        'topics-and-skills-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', '$scope', '$uibModal', '$window',
        'AlertsService', 'RubricObjectFactory', 'SkillCreationService',
        'TopicCreationService', 'TopicsAndSkillsDashboardBackendApiService',
        'UrlInterpolationService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        'EVENT_TYPE_SKILL_CREATION_ENABLED',
        'EVENT_TYPE_TOPIC_CREATION_ENABLED',
        'FATAL_ERROR_CODES', 'SKILL_DIFFICULTIES',
        function(
            $http, $rootScope, $scope, $uibModal, $window,
            AlertsService, RubricObjectFactory, SkillCreationService,
            TopicCreationService, TopicsAndSkillsDashboardBackendApiService,
            UrlInterpolationService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            EVENT_TYPE_SKILL_CREATION_ENABLED,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            FATAL_ERROR_CODES, SKILL_DIFFICULTIES) {
          var ctrl = this;
          ctrl.TAB_NAME_TOPICS = 'topics';
          ctrl.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
          ctrl.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';

          var _initDashboard = function() {
            TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
              function(response) {
                ctrl.topicSummaries = response.data.topic_summary_dicts;
                ctrl.editableTopicSummaries = ctrl.topicSummaries.filter(
                  function(summary) {
                    return summary.can_edit_topic === true;
                  }
                );
                ctrl.untriagedSkillSummaries =
                  response.data.untriaged_skill_summary_dicts;
                ctrl.mergeableSkillSummaries =
                  response.data.mergeable_skill_summary_dicts;
                ctrl.unpublishedSkillSummaries =
                  response.data.unpublished_skill_summary_dicts;
                ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
                ctrl.userCanCreateTopic = response.data.can_create_topic;
                ctrl.userCanCreateSkill = response.data.can_create_skill;
                $rootScope.$broadcast(
                  EVENT_TYPE_TOPIC_CREATION_ENABLED, ctrl.userCanCreateTopic);
                $rootScope.$broadcast(
                  EVENT_TYPE_SKILL_CREATION_ENABLED, ctrl.userCanCreateSkill);
                ctrl.userCanDeleteTopic = response.data.can_delete_topic;
                ctrl.userCanDeleteSkill = response.data.can_delete_skill;
                if (ctrl.topicSummaries.length === 0 &&
                    ctrl.untriagedSkillSummaries.length !== 0) {
                  ctrl.activeTab = ctrl.TAB_NAME_UNTRIAGED_SKILLS;
                } else if (
                  ctrl.topicSummaries.length === 0 &&
                  ctrl.unpublishedSkillSummaries.length !== 0) {
                  ctrl.activeTab = ctrl.TAB_NAME_UNPUBLISHED_SKILLS;
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

          ctrl.isTopicTabHelpTextVisible = function() {
            return (
              (ctrl.topicSummaries.length === 0) &&
              (ctrl.untriagedSkillSummaries.length > 0 ||
              ctrl.unpublishedSkillSummaries.length > 0));
          };
          ctrl.isSkillsTabHelpTextVisible = function() {
            return (
              (ctrl.untriagedSkillSummaries.length === 0) &&
              (ctrl.topicSummaries.length > 0) &&
              (ctrl.unpublishedSkillSummaries.length === 0));
          };
          ctrl.setActiveTab = function(tabName) {
            ctrl.activeTab = tabName;
          };
          ctrl.createTopic = function() {
            TopicCreationService.createNewTopic();
          };
          ctrl.createSkill = function() {
            var rubrics = [];
            for (var idx in SKILL_DIFFICULTIES) {
              rubrics.push(
                RubricObjectFactory.create(SKILL_DIFFICULTIES[idx], '')
              );
            }
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'create-new-skill-modal.template.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.newSkillDescription = '';
                  $scope.rubrics = rubrics;
                  $scope.allRubricsAdded = false;

                  var areAllRubricsPresent = function() {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getExplanation() === '') {
                        $scope.allRubricsAdded = false;
                        return;
                      }
                    }
                    $scope.allRubricsAdded = true;
                  };


                  $scope.onSaveRubric = function(difficulty, explanation) {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                        $scope.rubrics[idx].setExplanation(explanation);
                      }
                    }
                    areAllRubricsPresent();
                  };

                  $scope.createNewSkill = function() {
                    $uibModalInstance.close({
                      description: $scope.newSkillDescription,
                      rubrics: $scope.rubrics
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, []);
            });
          };

          _initDashboard();
          $scope.$on(
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
        }
      ]
    };
  }]);
