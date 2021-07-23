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

import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
require(
  'components/skill-selector/skill-selector.component.ts');

require('domain/skill/skill-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').directive('skillPrerequisiteSkillsEditor', [
  'NgbModal', 'SkillEditorStateService', 'SkillUpdateService',
  'TopicsAndSkillsDashboardBackendApiService', 'UrlInterpolationService',
  'WindowDimensionsService',
  function(
      NgbModal, SkillEditorStateService, SkillUpdateService,
      TopicsAndSkillsDashboardBackendApiService, UrlInterpolationService,
      WindowDimensionsService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/' +
        'skill-prerequisite-skills-editor/' +
        'skill-prerequisite-skills-editor.directive.html'),
      controller: [
        '$scope', 'AlertsService',
        function(
            $scope, AlertsService) {
          var ctrl = this;
          var categorizedSkills = null;
          var untriagedSkillSummaries = null;
          TopicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
            .then(function(response) {
              categorizedSkills = response.categorizedSkillsDict;
              untriagedSkillSummaries = response.untriagedSkillSummaries;
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
            let modalRef: NgbModalRef = NgbModal.open(
              SelectSkillModalComponent, {
                backdrop: 'static',
                windowClass: 'skill-select-modal',
                size: 'xl'
              });
            modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
            modalRef.componentInstance.skillsInSameTopicCount = (
              skillsInSameTopicCount);
            modalRef.componentInstance.categorizedSkills = categorizedSkills;
            modalRef.componentInstance.allowSkillsFromOtherTopics = (
              allowSkillsFromOtherTopics);
            modalRef.componentInstance.untriagedSkillSummaries = (
              untriagedSkillSummaries);
            modalRef.result.then(function(summary) {
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

          $scope.togglePrerequisiteSkills = function() {
            if (WindowDimensionsService.isWindowNarrow()) {
              $scope.prerequisiteSkillsAreShown = (
                !$scope.prerequisiteSkillsAreShown);
            }
          };
          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.prerequisiteSkillsAreShown = (
              !WindowDimensionsService.isWindowNarrow());
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
