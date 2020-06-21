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
 * @fileoverview Directive for the skill prerequisite skills editor.
 */

require('components/skill-selector/select-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.directive.ts');

require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillPrerequisiteSkillsEditor', [
  'SkillEditorStateService', 'SkillUpdateService',
  'TopicsAndSkillsDashboardBackendApiService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService
      , TopicsAndSkillsDashboardBackendApiService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/' +
        'skill-prerequisite-skills-editor/' +
        'skill-prerequisite-skills-editor.directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', 'AlertsService',
        function(
            $scope, $filter, $uibModal, AlertsService) {
          var ctrl = this;
          var categorizedSkills = null;
          TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
            function(response) {
              categorizedSkills = response.categorized_skills_dict;
            });
          var groupedSkillSummaries =
            SkillEditorStateService.getGroupedSkillSummaries();

          $scope.removeSkillId = function(skillId) {
            SkillUpdateService.deletePrerequisiteSkill($scope.skill, skillId);
          };

          $scope.getSkillEditorUrl = function(skillId) {
            return '/skill_editor/' + skillId;
          };

          $scope.addSkill = function() {
            // This contains the summaries of skill in the same topic as
            // the current skill as the initial entries followed by the others.
            var skillsInSameTopicCount =
              groupedSkillSummaries.current.length;
            var sortedSkillSummaries = groupedSkillSummaries.current.concat(
              groupedSkillSummaries.others);
            var allowSkillsFromOtherTopics = true;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skillsInSameTopicCount: () => skillsInSameTopicCount,
                sortedSkillSummaries: () => sortedSkillSummaries,
                categorizedSkills: () => categorizedSkills,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics
              },
              controller: 'SelectSkillModalController',
              windowClass: 'skill-select-modal',
              size: 'xl'
            }).result.then(function(summary) {
              var skillId = summary.id;
              if (skillId === $scope.skill.getId()) {
                AlertsService.addInfoMessage(
                  'A skill cannot be a prerequisite of itself', 5000);
                return;
              }
              for (var idx in $scope.skill.getPrerequisiteSkillIds()) {
                if ($scope.skill.getPrerequisiteSkillIds()[idx] === skillId) {
                  AlertsService.addInfoMessage(
                    'Given skill is already a prerequisite skill', 5000);
                  return;
                }
              }
              SkillUpdateService.addPrerequisiteSkill($scope.skill, skillId);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.skillIdToSummaryMap = {};

            for (var name in groupedSkillSummaries) {
              var skillSummaries = groupedSkillSummaries[name];
              for (var idx in skillSummaries) {
                $scope.skillIdToSummaryMap[skillSummaries[idx].id] =
                  skillSummaries[idx].description;
              }
            }
          };
        }]
    };
  }
]);
