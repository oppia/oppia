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
 * @fileoverview Directive for displaying and editing a collection node. This
 * directive allows creators to add and remove prerequisite and acquired skills,
 * and also delete the collection node represented by this directive.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

oppia.directive('collectionNodeEditorDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getPrerequisiteSkills: '&prerequisiteSkills',
      getAcquiredSkills: '&acquiredSkills',
      getExplorationId: '&explorationId',
      getExplorationTitle: '&explorationTitle',
      doesExplorationExist: '&explorationExists',
      isExplorationNew: '&explorationNewlyCreated',
      addPrerequisiteSkill: '&',
      addAcquiredSkill: '&',
      deletePrerequisiteSkill: '&',
      deleteAcquiredSkill: '&',
      deleteCollectionNode: '&',
      addChange: '&'
    },
    templateUrl: 'inline/collection_node_editor_directive',
    controller: ['$scope', 'CollectionUpdateService', 'warningsData',
      function($scope, CollectionUpdateService, warningsData) {
      // TODO(bhenning): Replace skill array handling with the SkillList
      // frontend domain object, but that may have to wait until a real
      // Collection frontend domain object is introduced to contain it.
      // Checks whether a given skill name is in an array, where skill names are
      // normalized and are case-insensitive.
      var _isSkillNameInArray = function(skillName, array) {
        var lowercaseSkillName = skillName.toLowerCase();
        return array.some(function(arrayItem) {
          return arrayItem.toLowerCase() == lowercaseSkillName;
        });
      };

      var _validateNewSkill = function(newSkillName, currentSkillNames) {
        // Ensure the user entered a skill name.
        if (!newSkillName) {
          warningsData.addWarning('Cannot add empty skill to collection.');
          return false;
        } else if (_isSkillNameInArray(newSkillName, currentSkillNames)) {
          warningsData.addWarning('Skill is already added: ' + newSkillName);
          return false;
        }
        return true;
      };

      // Adds a prerequisite skill to the frontend collection object and also
      // updates the changelist.
      $scope.addNewPrerequisiteSkill = function() {
        if (!_validateNewSkill(
            $scope.prerequisiteSkillName, $scope.getPrerequisiteSkills())) {
          return;
        }
        $scope.addPrerequisiteSkill({
          skillName: $scope.prerequisiteSkillName,
          explorationId: $scope.getExplorationId()
        });
        $scope.addChange({
          change: CollectionUpdateService.buildPrerequisiteSkillsChangeDict(
            $scope.getExplorationId(), $scope.getPrerequisiteSkills())
        });
        $scope.prerequisiteSkillName = '';
      };

      // Removes a prerequisite skill from the frontend collection object and
      // also updates the changelist.
      $scope.removePrerequisiteSkill = function(index) {
        $scope.deletePrerequisiteSkill({
          skillIndex: index,
          explorationId: $scope.getExplorationId()
        });
        $scope.addChange({
          change: CollectionUpdateService.buildPrerequisiteSkillsChangeDict(
            $scope.getExplorationId(), $scope.getPrerequisiteSkills())
        });
      };

      // Adds an acquired skill to the frontend collection object and also
      // updates the changelist.
      $scope.addNewAcquiredSkill = function() {
        if (!_validateNewSkill(
            $scope.acquiredSkillName, $scope.getAcquiredSkills())) {
          return;
        }
        $scope.addAcquiredSkill({
          skillName: $scope.acquiredSkillName,
          explorationId: $scope.getExplorationId()
        });
        $scope.addChange({
          change: CollectionUpdateService.buildAcquiredSkillsChangeDict(
            $scope.getExplorationId(), $scope.getAcquiredSkills())
        });
        $scope.acquiredSkillName = '';
      };

      // Removes an acquired skill from the frontend collection object and also
      // updates the changelist.
      $scope.removeAcquiredSkill = function(index) {
        $scope.deleteAcquiredSkill({
          skillIndex: index,
          explorationId: $scope.getExplorationId()
        });
        $scope.addChange({
          change: CollectionUpdateService.buildAcquiredSkillsChangeDict(
            $scope.getExplorationId(), $scope.getAcquiredSkills())
        });
      };

      // Deletes this collection node from the frontend collection object and
      // also updates the changelist.
      $scope.deleteExploration = function() {
        $scope.deleteCollectionNode({
          explorationId: $scope.getExplorationId()
        });
        $scope.addChange({
          change: CollectionUpdateService.buildDeleteCollectionNodeChangeDict(
            $scope.getExplorationId())
        });
      };
    }]
  };
}]);
