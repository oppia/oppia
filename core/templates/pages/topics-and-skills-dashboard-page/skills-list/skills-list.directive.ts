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
 * @fileoverview Controller for the skills list viewer.
 */

require('components/skill-selector/merge-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/templates/' +
  'assign-skill-to-topic-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/topic-selector/' +
  'topic-selector.directive.ts');

require('domain/skill/skill-backend-api.service.ts');
require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('skillsList', [
  'AlertsService', 'UrlInterpolationService',
  function(
      AlertsService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSkillSummaries: '&skillSummaries',
        getEditableTopicSummaries: '&editableTopicSummaries',
        getMergeableSkillSummaries: '&mergeableSkillSummaries',
        canDeleteSkill: '&userCanDeleteSkill',
        canCreateSkill: '&userCanCreateSkill',
        isUnpublishedSkill: '&unpublishedSkill',
        getSkillsCategorizedByTopics: '&skillsCategorizedByTopics'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/skills-list/' +
        'skills-list.directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope', '$timeout',
        'EditableTopicBackendApiService', 'SkillBackendApiService',
        'TopicsAndSkillsDashboardBackendApiService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $scope, $uibModal, $rootScope, $timeout,
            EditableTopicBackendApiService, SkillBackendApiService,
            TopicsAndSkillsDashboardBackendApiService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          var ctrl = this;
          $scope.highlightColumns = function(index) {
            $scope.highlightedIndex = index;
          };

          $scope.unhighlightColumns = function() {
            $scope.highlightedIndex = null;
          };

          $scope.getSkillEditorUrl = function(skillId) {
            return '/skill_editor/' + skillId;
          };

          $scope.deleteSkill = function(skillId) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'delete-skill-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              SkillBackendApiService.deleteSkill(skillId).then(
                function(status) {
                  $timeout(function() {
                    $rootScope.$broadcast(
                      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                  }, 100);
                }
              );
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            }).then(function() {
              var successToast = 'The skill has been deleted.';
              AlertsService.addSuccessMessage(successToast, 1000);
            });
          };

          $scope.assignSkillToTopic = function(skillId) {
            var topicSummaries = $scope.getEditableTopicSummaries();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'assign-skill-to-topic-modal.template.html'),
              backdrop: true,
              resolve: {
                topicSummaries: () => topicSummaries
              },
              controller: 'AssignSkillToTopicModalController'
            }).result.then(function(topicIds) {
              var changeList = [{
                cmd: 'add_uncategorized_skill_id',
                new_uncategorized_skill_id: skillId
              }];
              var topicSummaries = $scope.getEditableTopicSummaries();
              for (var i = 0; i < topicIds.length; i++) {
                var version = null;
                for (var j = 0; j < topicSummaries.length; j++) {
                  if (topicSummaries[j].id === topicIds[i]) {
                    EditableTopicBackendApiService.updateTopic(
                      topicIds[i], topicSummaries[j].version,
                      'Added skill with id ' + skillId + ' to topic.',
                      changeList
                    ).then(function() {
                      $timeout(function() {
                        $rootScope.$broadcast(
                          EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
                          true);
                      }, 100);
                    }).then(function() {
                      var successToast = (
                        'The skill has been assigned to the topic.');
                      AlertsService.addSuccessMessage(successToast, 1000);
                    });
                  }
                }
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.mergeSkill = function(skill) {
            var skillSummaries = $scope.getMergeableSkillSummaries();
            var categorizedSkills = $scope.getSkillsCategorizedByTopics();
            var allowSkillsFromOtherTopics = true;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skill: () => skill,
                skillSummaries: () => skillSummaries,
                categorizedSkills: () => categorizedSkills,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics
              },
              controller: 'MergeSkillModalController',
              windowClass: 'skill-select-modal',
              size: 'xl'

            }).result.then(function(result) {
              var skill = result.skill;
              var supersedingSkillId = result.supersedingSkillId;
              // Transfer questions from the old skill to the new skill.
              TopicsAndSkillsDashboardBackendApiService.mergeSkills(
                skill.id, supersedingSkillId).then(function() {
                // Broadcast will update the skills list in the dashboard so
                // that the merged skills are not shown anymore.
                $timeout(function() {
                  $rootScope.$broadcast(
                    EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                }, 100);
              }, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            $scope.SKILL_HEADINGS = [
              'description', 'worked_examples_count', 'misconception_count'
            ];
            $scope.highlightedIndex = null;
          };
        }
      ]
    };
  }]);
