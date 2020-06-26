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
 * @fileoverview Controller for select skill modal.
 */
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('SelectSkillModalController', [
  '$controller', '$scope', '$uibModalInstance', 'allowSkillsFromOtherTopics',
  'categorizedSkills', 'skillsInSameTopicCount', 'sortedSkillSummaries',
  function($controller, $scope, $uibModalInstance, allowSkillsFromOtherTopics,
      categorizedSkills, skillsInSameTopicCount, sortedSkillSummaries) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.skillSummaries = sortedSkillSummaries;
    $scope.categorizedSkills = categorizedSkills;
    $scope.allowSkillsFromOtherTopics = allowSkillsFromOtherTopics;
    $scope.selectedSkillId = null;
    $scope.countOfSkillsToPrioritize =
      skillsInSameTopicCount;
    $scope.save = function() {
      $scope.confirm($scope.skillSummaries.find(
        summary => summary.id === $scope.selectedSkillId));
    };
  }
]);
