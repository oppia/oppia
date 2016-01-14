// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive displaying and editing a collection node. Edit
 * options include: editing pre-requisite skills, editing acquired skills and
 * deleting a node.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

oppia.directive('collectionNodeDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getPrerequisiteSkills: '&prerequisiteSkills',
      getAcquiredSkills: '&acquiredSkills',
      getExplorationId: '&explorationId',
      getExplorationTitle: '&explorationTitle',
      addChange: '&'
    },
    templateUrl: 'inline/collection_node_directive',
    controller: ['$scope', 'CollectionUpdateService', function($scope,
      CollectionUpdateService) {
      var _arrayContainsCaseInsensitive = function(array, element) {
        var lowerElement = element.toLowerCase();
        for (var i = 0; i < array.length; i++) {
          if (array[i].toLowerCase() === lowerElement) {
            return true;
          }
        }
        return false;
      };

      $scope.addPrereqSkill = function(skillName) {
        if (skillName) {
          if (!_arrayContainsCaseInsensitive($scope.getPrerequisiteSkills(), skillName)) {
            $scope.getPrerequisiteSkills().push(skillName);
            var change = CollectionUpdateService.buildPrerequisiteSkillsUpdate(
              $scope.getExplorationId(), $scope.getPrerequisiteSkills());
            $scope.addChange({change: change});
          }
        }
      };

      $scope.addAcquiredSkill = function(skillName) {
        if (skillName) {
          if (!_arrayContainsCaseInsensitive($scope.getAcquiredSkills(), skillName)) {
            $scope.getAcquiredSkills().push(skillName);
            var change = CollectionUpdateService.buildAcquiredSkillsUpdate(
              $scope.getExplorationId(), $scope.getAcquiredSkills());
            $scope.addChange({change: change});
          }
        }
      };

      $scope.deleteExploration = function() {
        var change = CollectionUpdateService.buildDeleteCollectionNodeUpdate(
          $scope.getExplorationId());
        $scope.addChange({change: change});
      };
    }]
  };
}]);
