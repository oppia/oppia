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
require(
  'components/skill-selector/skill-selector.directive.ts');
require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').directive('skillPrerequisiteSkillsEditor', [
  'SkillEditorStateService', 'SkillUpdateService', 'UrlInterpolationService',
  function(
      SkillEditorStateService, SkillUpdateService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/' +
        'skill-prerequisite-skills-editor/' +
        'skill-prerequisite-skills-editor.directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'EVENT_SKILL_REINITIALIZED', 'AlertsService',
        function(
            $scope, $filter, $uibModal, $rootScope,
            EVENT_SKILL_REINITIALIZED, AlertsService) {
          var ctrl = this;
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

            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.skillSummaries = sortedSkillSummaries;
                  $scope.selectedSkillId = null;
                  $scope.countOfSkillsToPrioritize = skillsInSameTopicCount;
                  $scope.save = function() {
                    $uibModalInstance.close($scope.selectedSkillId);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(skillId) {
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
