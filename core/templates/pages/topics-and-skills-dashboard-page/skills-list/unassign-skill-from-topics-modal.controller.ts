// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for unassign skill from topics modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
    'confirm-or-cancel-modal.controller.ts');

require(
  'domain/topics_and_skills_dashboard/' +
    'topics-and-skills-dashboard-backend-api.service.ts');

angular.module('oppia').controller('UnassignSkillFromTopicModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'TopicsAndSkillsDashboardBackendApiService', 'skillId',
  function($controller, $scope, $uibModalInstance,
      TopicsAndSkillsDashboardBackendApiService, skillId) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.fetchTopicAssignmentsForSkill = function() {
      TopicsAndSkillsDashboardBackendApiService.fetchTopicAssignmentsForSkill(
        skillId).then((response) => {
        $scope.topicsAssignments = {};
        response.map((topic) => {
          $scope.topicsAssignments[topic.topicName] = {
            subtopicId: topic.subtopicId,
            topicVersion: topic.topicVersion,
            topicId: topic.topicId,
          };
        });
        $scope.topicsAssignmentsAreFetched = true;
      });
    };
    $scope.init = function() {
      $scope.selectedTopicNames = [];
      $scope.topicsAssignmentsAreFetched = false;
      $scope.fetchTopicAssignmentsForSkill();
    };
    $scope.selectedTopicToUnassign = function(topicId) {
      var index = $scope.selectedTopicNames.indexOf(topicId);
      if (index !== -1) {
        $scope.selectedTopicNames.splice(index, 1);
      } else {
        $scope.selectedTopicNames.push(topicId);
      }
    };
    $scope.close = function() {
      $scope.selectedTopics = [];
      for (let index in $scope.selectedTopicNames) {
        $scope.selectedTopics.push(
          $scope.topicsAssignments[$scope.selectedTopicNames[index]]);
      }
      $uibModalInstance.close($scope.selectedTopics);
    };
    $scope.init();
  }
]);
