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

require('base-components/base-content.directive.ts');
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
require('components/entity-creation-services/topic-creation.service.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');

require('domain/skill/RubricObjectFactory.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts'
);
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');

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
        'MAX_CHARS_IN_SKILL_DESCRIPTION', 'SKILL_DESCRIPTION_STATUS_VALUES',
        function(
            $http, $rootScope, $scope, $uibModal, $window,
            AlertsService, RubricObjectFactory, SkillCreationService,
            TopicCreationService, TopicsAndSkillsDashboardBackendApiService,
            UrlInterpolationService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            EVENT_TYPE_SKILL_CREATION_ENABLED,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            FATAL_ERROR_CODES, SKILL_DIFFICULTIES,
            MAX_CHARS_IN_SKILL_DESCRIPTION, SKILL_DESCRIPTION_STATUS_VALUES) {
          var ctrl = this;
          var _initDashboard = function(stayInSameTab) {
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
                if (!stayInSameTab || !ctrl.activeTab) {
                  ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
                }
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
              (ctrl.untriagedSkillSummaries.length > 0));
          };
          ctrl.isSkillsTabHelpTextVisible = function() {
            return (
              (ctrl.untriagedSkillSummaries.length === 0) &&
              (ctrl.topicSummaries.length > 0));
          };
          ctrl.setActiveTab = function(tabName) {
            ctrl.activeTab = tabName;
          };
          ctrl.createTopic = function() {
            TopicCreationService.createNewTopic();
          };
          ctrl.createSkill = function() {
            var rubrics = [
              RubricObjectFactory.create(SKILL_DIFFICULTIES[0], []),
              RubricObjectFactory.create(SKILL_DIFFICULTIES[1], ['']),
              RubricObjectFactory.create(SKILL_DIFFICULTIES[2], [])];
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
                  $scope.bindableDict = {
                    displayedConceptCardExplanation: ''
                  };
                  $scope.MAX_CHARS_IN_SKILL_DESCRIPTION = (
                    MAX_CHARS_IN_SKILL_DESCRIPTION);
                  var newExplanationObject = null;

                  $scope.$watch('newSkillDescription', function() {
                    if (
                      SkillCreationService.getSkillDescriptionStatus() !==
                      SKILL_DESCRIPTION_STATUS_VALUES.STATUS_DISABLED) {
                      var initParagraph = document.createElement('p');
                      var explanations = $scope.rubrics[1].getExplanations();
                      var newExplanation = document.createTextNode(
                        $scope.newSkillDescription);
                      initParagraph.appendChild(newExplanation);
                      explanations[0] = initParagraph.outerHTML;
                      $scope.rubrics[1].setExplanations(explanations);
                      SkillCreationService.markChangeInSkillDescription();
                    }
                  });

                  $scope.onSaveExplanation = function(explanationObject) {
                    newExplanationObject = explanationObject.toBackendDict();
                    $scope.bindableDict.displayedConceptCardExplanation =
                      explanationObject.getHtml();
                  };

                  $scope.onSaveRubric = function(difficulty, explanations) {
                    for (var idx in $scope.rubrics) {
                      if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                        $scope.rubrics[idx].setExplanations(explanations);
                      }
                    }
                  };

                  $scope.createNewSkill = function() {
                    $uibModalInstance.close({
                      description: $scope.newSkillDescription,
                      rubrics: $scope.rubrics,
                      explanation: newExplanationObject
                    });
                  };

                  $scope.cancel = function() {
                    SkillCreationService.resetSkillDescriptionStatusMarker();
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, result.explanation, []);
            });
          };
          ctrl.$onInit = function() {
            ctrl.TAB_NAME_TOPICS = 'topics';
            ctrl.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
            ctrl.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';
            $scope.$on(
              EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, function(
                  evt, stayInSameTab) {
                _initDashboard(stayInSameTab);
              }
            );
            // The _initDashboard function is written separately since it is
            // also called in $scope.$on when some external events are
            // triggered.
            _initDashboard(false);
          };
        }
      ]
    };
  }]);
