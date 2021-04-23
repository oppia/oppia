// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Skill editor section in the state editor.
*/
import { CategorizedSkills } from
  // eslint-disable-next-line
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SkillSummary } from 'core/templates/domain/skill/skill-summary.model';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');
require(
  'components/skill-selector/skill-selector.component.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').directive('stateSkillEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveLinkedSkillId: '=',
        onSaveStateContent: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-skill-editor/' +
        'state-skill-editor.directive.html'),
      controller: [
        '$rootScope', '$scope', '$uibModal', 'AlertsService', 'NgbModal',
        'StateLinkedSkillIdService', 'StoryEditorStateService',
        'TopicsAndSkillsDashboardBackendApiService',
        'WindowDimensionsService',
        function(
            $rootScope, $scope, $uibModal, AlertsService, NgbModal,
            StateLinkedSkillIdService, StoryEditorStateService,
            TopicsAndSkillsDashboardBackendApiService,
            WindowDimensionsService) {
          var ctrl = this;
          var categorizedSkills: CategorizedSkills = null;
          var untriagedSkillSummaries: SkillSummary = null;
          var _init = function() {
            TopicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
              .then(function(response) {
                /**
                 * CategorizedSkills: dict. It represents the categorized
                 *   skills on the topic-and-skill-dashboard page.
                 *   Contains the following key:
                 *   topicName: dict. Contains the following keys:
                 *      uncategorized: list(ShortSkillSummary). List of all the
                 *        uncategorized skills in the topic.
                 *      subtopicName: list(ShortSkillSummary). List of all the
                 *        skills in the subtopic of the topic.
                 */
                categorizedSkills = response.categorizedSkillsDict;
                /**
                 * UntriagedSkillSummaries: list(SkillSummary). A list of all
                 *   untriaged skills on the topic-and-skill-dashboard page.
                */
                untriagedSkillSummaries = response.untriagedSkillSummaries;
                $rootScope.$applyAsync();
              });
          };

          $scope.addSkill = function() {
            var sortedSkillSummaries = (
              StoryEditorStateService.getSkillSummaries());
            var allowSkillsFromOtherTopics = true;
            var skillsInSameTopicCount = 0;
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
            modalRef.result.then(function(result) {
              try {
                StateLinkedSkillIdService.displayed = result.id;
                StateLinkedSkillIdService.saveDisplayedValue();
                $scope.onSaveLinkedSkillId(result.id);
              } catch (err) {
                AlertsService.addInfoMessage(err, 5000);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.deleteSkill = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-state-skill-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              StateLinkedSkillIdService.displayed = null;
              StateLinkedSkillIdService.saveDisplayedValue();
              $scope.onSaveLinkedSkillId(StateLinkedSkillIdService.displayed);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.getSkillEditorUrl = function() {
            if (StateLinkedSkillIdService.displayed) {
              return UrlInterpolationService.interpolateUrl(
                '/skill_editor/<skill_id>', {
                  skill_id: StateLinkedSkillIdService.displayed
                });
            }
          };

          $scope.toggleSkillEditor = function() {
            $scope.skillEditorIsShown = !$scope.skillEditorIsShown;
          };

          ctrl.$onInit = function() {
            $scope.StateLinkedSkillIdService = StateLinkedSkillIdService;
            $scope.skillEditorIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            _init();
          };
        }
      ]
    };
  }]);
