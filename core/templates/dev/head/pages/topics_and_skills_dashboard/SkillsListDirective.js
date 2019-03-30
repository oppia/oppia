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
oppia.directive('skillsList', [
  '$http', 'AlertsService', 'UrlInterpolationService',
  function(
      $http, AlertsService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSkillSummaries: '&skillSummaries',
        getEditableTopicSummaries: '&editableTopicSummaries',
        isInModal: '&inModal',
        getMergeableSkillSummaries: '&mergeableSkillSummaries',
        selectedSkill: '=',
        canDeleteSkill: '&userCanDeleteSkill',
        canCreateSkill: '&userCanCreateSkill',
        isUnpublishedSkill: '&unpublishedSkill'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics_and_skills_dashboard/skills_list_directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
        'EditableSkillBackendApiService',
        'TopicsAndSkillsDashboardBackendApiService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $scope, $uibModal, $rootScope, EditableTopicBackendApiService,
            EditableSkillBackendApiService,
            TopicsAndSkillsDashboardBackendApiService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          $scope.SKILL_HEADINGS = [
            'description', 'worked_examples_count', 'misconception_count'
          ];

          $scope.highlightedIndex = null;
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
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'delete_skill_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.confirmDeletion = function() {
                    $uibModalInstance.close();
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              EditableSkillBackendApiService.deleteSkill(skillId).then(
                function(status) {
                  $rootScope.$broadcast(
                    EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                }
              );
            }).then(function() {
              var successToast = 'The skill has been deleted.';
              AlertsService.addSuccessMessage(successToast, 1000);
            });
          };

          $scope.assignSkillToTopic = function(skillId) {
            var topicSummaries = $scope.getEditableTopicSummaries();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'assign_skill_to_topic_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.topicSummaries = topicSummaries;
                  $scope.selectedTopicIds = [];
                  $scope.done = function() {
                    $uibModalInstance.close($scope.selectedTopicIds);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(topicIds) {
              var changeList = [{
                cmd: 'add_uncategorized_skill_id',
                new_uncategorized_skill_id: skillId,
                change_affects_subtopic_page: false
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
                      $rootScope.$broadcast(
                        EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                    }).then(function() {
                      var successToast = (
                        'The skill has been assigned to the topic.');
                      AlertsService.addSuccessMessage(successToast, 1000);
                    });
                  }
                }
              }
            });
          };

          $scope.selectSkill = function(skill) {
            $scope.selectedSkill = skill;
          };

          $scope.mergeSkill = function(skill) {
            var skillSummaries = $scope.getMergeableSkillSummaries();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics_and_skills_dashboard/' +
                'merge_skill_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.skillSummaries = skillSummaries;
                  $scope.selectedSkill = {};
                  $scope.done = function() {
                    $uibModalInstance.close(
                      {skill: skill,
                        supersedingSkillId: $scope.selectedSkill.id
                      });
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(result) {
              var skill = result.skill;
              var supersedingSkillId = result.supersedingSkillId;
              // Transfer questions from the old skill to the new skill.
              TopicsAndSkillsDashboardBackendApiService.mergeSkills(
                skill.id, supersedingSkillId).then(function() {
                // Broadcast will update the skills list in the dashboard so
                // that the merged skills are not shown anymore.
                $rootScope.$broadcast(
                  EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
              });
            });
          };
        }
      ]
    };
  }]);
