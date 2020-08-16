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
  'pages/topics-and-skills-dashboard-page/skills-list/' +
  'assign-skill-to-topic-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'delete-skill-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/topic-selector/' +
  'topic-selector.directive.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'skills-list/assign-skill-to-topic-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'skills-list/unassign-skill-from-topics-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/topic-selector/' +
  'topic-selector.directive.ts');
require('services/alerts.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('skillsList', [
  'AlertsService', 'UrlInterpolationService',
  function(
      AlertsService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSkillSummaries: '&skillSummaries',
        getPageNumber: '&pageNumber',
        getItemsPerPage: '&itemsPerPage',
        getEditableTopicSummaries: '&editableTopicSummaries',
        getMergeableSkillSummaries: '&mergeableSkillSummaries',
        getUntriagedSkillSummaries: '&untriagedSkillSummaries',
        canDeleteSkill: '&userCanDeleteSkill',
        canCreateSkill: '&userCanCreateSkill',
        isUnpublishedSkill: '&unpublishedSkill',
        getSkillsCategorizedByTopics: '&skillsCategorizedByTopics'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/skills-list/' +
        'skills-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$uibModal', '$rootScope', '$timeout',
        'EditableTopicBackendApiService', 'SkillBackendApiService',
        'TopicsAndSkillsDashboardBackendApiService',
        function(
            $scope, $uibModal, $rootScope, $timeout,
            EditableTopicBackendApiService, SkillBackendApiService,
            TopicsAndSkillsDashboardBackendApiService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          ctrl.getSkillEditorUrl = function(skillId) {
            var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skill_id>';
            return UrlInterpolationService.interpolateUrl(
              SKILL_EDITOR_URL_TEMPLATE, {
                skill_id: skillId
              });
          };

          ctrl.deleteSkill = function(skillId) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'delete-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skillId: () => skillId
              },
              windowClass: 'delete-skill-modal',
              controller: 'DeleteSkillModalController'
            }).result.then(function() {
              SkillBackendApiService.deleteSkill(skillId).then(
                function(status) {
                  $timeout(function() {
                    TopicsAndSkillsDashboardBackendApiService.
                      onTopicsAndSkillsDashboardReinitialized.emit();
                    var successToast = 'The skill has been deleted.';
                    AlertsService.addSuccessMessage(successToast, 1000);
                  }, 100);
                }
              );
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            }).then(function() {
            });
          };

          ctrl.unassignSkill = function(skillId) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                  'unassign-skill-from-topics-modal.template.html'),
              backdrop: true,
              resolve: {
                skillId: () => skillId
              },
              controller: 'UnassignSkillFromTopicModalController'
            }).result.then(function(topicsToUnassign) {
              for (let topic in topicsToUnassign) {
                var changeList = [];
                if (topicsToUnassign[topic].subtopicId) {
                  changeList.push({
                    cmd: 'remove_skill_id_from_subtopic',
                    subtopic_id: topicsToUnassign[topic].subtopicId,
                    skill_id: skillId
                  });
                }
                changeList.push({
                  cmd: 'remove_uncategorized_skill_id',
                  uncategorized_skill_id: skillId
                });
                EditableTopicBackendApiService.updateTopic(
                  topicsToUnassign[topic].topicId,
                  topicsToUnassign[topic].topicVersion,
                  `Unassigned skill with id ${skillId} from the topic.`,
                  changeList
                ).then(function() {
                  $timeout(function() {
                    TopicsAndSkillsDashboardBackendApiService.
                      onTopicsAndSkillsDashboardReinitialized.emit(true);
                  }, 100);
                }).then(function() {
                  var successToast = (
                    'The skill has been unassigned to the topic.');
                  AlertsService.addSuccessMessage(successToast, 1000);
                });
              }
            });
          };

          ctrl.assignSkillToTopic = function(skillId) {
            var topicSummaries = $scope.getEditableTopicSummaries();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'assign-skill-to-topic-modal.template.html'),
              backdrop: true,
              windowClass: 'assign-skill-to-topic-modal',
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
                for (var j = 0; j < topicSummaries.length; j++) {
                  if (topicSummaries[j].id === topicIds[i]) {
                    EditableTopicBackendApiService.updateTopic(
                      topicIds[i], topicSummaries[j].version,
                      'Added skill with id ' + skillId + ' to topic.',
                      changeList
                    ).then(function() {
                      $timeout(function() {
                        TopicsAndSkillsDashboardBackendApiService.
                          onTopicsAndSkillsDashboardReinitialized.emit(true);
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

          ctrl.mergeSkill = function(skill) {
            var skillSummaries = $scope.getMergeableSkillSummaries();
            var categorizedSkills = $scope.getSkillsCategorizedByTopics();
            var untriagedSkillSummaries = $scope.getUntriagedSkillSummaries();
            var allowSkillsFromOtherTopics = true;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skill: () => skill,
                skillSummaries: () => skillSummaries,
                categorizedSkills: () => categorizedSkills,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics,
                untriagedSkillSummaries: () => untriagedSkillSummaries
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
                  TopicsAndSkillsDashboardBackendApiService.
                    onTopicsAndSkillsDashboardReinitialized.emit();
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

          ctrl.getSerialNumberForSkill = function(skillIndex) {
            var skillSerialNumber = (
              skillIndex + (ctrl.getPageNumber() * ctrl.getItemsPerPage()));
            return (skillSerialNumber + 1);
          };

          ctrl.changeEditOptions = function(skillId) {
            ctrl.selectedIndex = ctrl.selectedIndex ? null : skillId;
          };

          ctrl.showEditOptions = function(skillId) {
            return ctrl.selectedIndex === skillId;
          };

          ctrl.$onInit = function() {
            ctrl.getPageNumber = $scope.getPageNumber;
            ctrl.getItemsPerPage = $scope.getItemsPerPage;
            ctrl.SKILL_HEADINGS = [
              'index', 'description', 'worked_examples_count',
              'misconception_count', 'status'];
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
