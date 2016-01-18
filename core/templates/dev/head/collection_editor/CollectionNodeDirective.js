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
      addPrerequisiteSkill: '&',
      addAcquiredSkill: '&',
      deletePrerequisiteSkill: '&',
      deleteAcquiredSkill: '&',
      deleteCollectionNode: '&',
      addChange: '&'
    },
    templateUrl: 'inline/collection_node_directive',
    controller: ['$scope', 'CollectionUpdateService', function($scope,
      CollectionUpdateService) {

      // Uses addPrerequisiteSkill callback function to add a pre-requisite
      // skill on the frontend and then uses CollectionUpdateService to update
      // a changelist that will update the backend.
      $scope.addNewPrerequisiteSkill = function(newSkill) {
        if ($scope.addPrerequisiteSkill(
          {skillName: newSkill, expId: $scope.getExplorationId()})) {
          var change = CollectionUpdateService.buildPrerequisiteSkillsUpdate(
            $scope.getExplorationId(), $scope.getPrerequisiteSkills());
          $scope.addChange({change: change});
        }
      };

      // Uses deletePrerequisiteSkill callback function to delete a prerequisite
      // skill on the frontend and then uses CollectionUpdateService to update a
      // changelist that will update the backend.
      $scope.removePrerequisiteSkill = function(index) {
        if ($scope.deletePrerequisiteSkill({skillIdx: index,
          expId: $scope.getExplorationId()})) {
          var change = CollectionUpdateService.buildPrerequisiteSkillsUpdate(
            $scope.getExplorationId(), $scope.getPrerequisiteSkills());
          $scope.addChange({change: change});
        }
      }

      // Uses addAcquiredSkill callback function to add an acquired skill
      // on the frontend and then uses CollectionUpdateService to update a
      // changelist that will update the backend.
      $scope.addNewAcquiredSkill = function(newSkill) {
        if ($scope.addAcquiredSkill({skillName: newSkill,
          expId: $scope.getExplorationId()})) {
          var change = CollectionUpdateService.buildAcquiredSkillsUpdate(
            $scope.getExplorationId(), $scope.getAcquiredSkills());
          $scope.addChange({change: change});
        }
      };

      // Uses deleteAcquiredSkill callback function to delete an acquired skill
      // on the frontend and then uses CollectionUpdateService to update a
      // changelist that will update the backend.
      $scope.removeAcquiredSkill = function(index) {
        if ($scope.deleteAcquiredSkill({skillIdx: index,
          expId: $scope.getExplorationId()})) {
          var change = CollectionUpdateService.buildAcquiredSkillsUpdate(
            $scope.getExplorationId(), $scope.getAcquiredSkills());
          $scope.addChange({change: change});
        }
      }

      // Uses deleteExploration callback function to delete an exploration
      // on the frontend and then uses CollectionUpdateService to update a
      // changelist that will update the backend.
      $scope.deleteExploration = function() {
        if ($scope.deleteCollectionNode({expId: $scope.getExplorationId()})) {
          var change = CollectionUpdateService.buildDeleteCollectionNodeUpdate(
            $scope.getExplorationId());
          $scope.addChange({change: change});
        }
      };
    }]
  };
}]);
