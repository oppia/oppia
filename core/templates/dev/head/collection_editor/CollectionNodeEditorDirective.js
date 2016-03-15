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
 */

oppia.directive('collectionNodeEditorDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollection: '&collection',
      getCollectionNode: '&collectionNode',
      updateSkillList: '&'
    },
    templateUrl: 'inline/collection_node_editor_directive',
    controller: ['$scope', 'CollectionUpdateService', 'alertsService',
      function($scope, CollectionUpdateService, alertsService) {
      var _addSkill = function(skillList, newSkillName) {
        // Ensure the user entered a skill name.
        if (!newSkillName) {
          alertsService.addWarning('Cannot add empty skill to collection.');
          return false;
        } else if (!skillList.addSkill(newSkillName)) {
          alertsService.addWarning('Skill is already added: ' + newSkillName);
          return false;
        }
        return true;
      };

      var _copyPrerequisiteSkillList = function() {
        var collectionNode = $scope.getCollectionNode();
        return angular.copy(collectionNode.getPrerequisiteSkillList());
      };

      var _copyAcquiredSkillList = function() {
        var collectionNode = $scope.getCollectionNode();
        return angular.copy(collectionNode.getAcquiredSkillList());
      };

      // Adds a prerequisite skill to the frontend collection object and also
      // updates the changelist.
      $scope.addNewPrerequisiteSkill = function() {
        var collectionNode = $scope.getCollectionNode();
        var prerequisiteSkillList = _copyPrerequisiteSkillList();
        if (!_addSkill(prerequisiteSkillList, $scope.prerequisiteSkillName)) {
          return;
        }
        CollectionUpdateService.setPrerequisiteSkills(
          $scope.getCollection(), collectionNode.getExplorationId(),
          prerequisiteSkillList.getSkills());
        $scope.updateSkillList();
        $scope.prerequisiteSkillName = '';
      };

      // Removes a prerequisite skill from the frontend collection object and
      // also updates the changelist.
      $scope.removePrerequisiteSkill = function(index) {
        var collectionNode = $scope.getCollectionNode();
        var prerequisiteSkillList = _copyPrerequisiteSkillList();
        prerequisiteSkillList.removeSkillByIndex(index);
        CollectionUpdateService.setPrerequisiteSkills(
          $scope.getCollection(), collectionNode.getExplorationId(),
          prerequisiteSkillList.getSkills());
        $scope.updateSkillList();
      };

      // Adds an acquired skill to the frontend collection object and also
      // updates the changelist.
      $scope.addNewAcquiredSkill = function() {
        var collectionNode = $scope.getCollectionNode();
        var acquiredSkillList = _copyAcquiredSkillList();
        if (!_addSkill(acquiredSkillList, $scope.acquiredSkillName)) {
          return;
        }
        CollectionUpdateService.setAcquiredSkills(
          $scope.getCollection(), collectionNode.getExplorationId(),
          acquiredSkillList.getSkills());
        $scope.updateSkillList();
        $scope.acquiredSkillName = '';
      };

      // Removes an acquired skill from the frontend collection object and also
      // updates the changelist.
      $scope.removeAcquiredSkill = function(index) {
        var collectionNode = $scope.getCollectionNode();
        var acquiredSkillList = _copyAcquiredSkillList();
        acquiredSkillList.removeSkillByIndex(index);
        CollectionUpdateService.setAcquiredSkills(
          $scope.getCollection(), collectionNode.getExplorationId(),
          acquiredSkillList.getSkills());
        $scope.updateSkillList();
      };

      // Deletes this collection node from the frontend collection object and
      // also updates the changelist.
      $scope.deleteCollectionNode = function() {
        var collection = $scope.getCollection();
        var collectionNode = $scope.getCollectionNode();
        var explorationId = collectionNode.getExplorationId();
        if (!collection.containsCollectionNode(explorationId)) {
          alertsService.fatalWarning(
            'Internal collection editor error. Could not delete exploration ' +
            'by ID: ' + explorationId);
        }
        CollectionUpdateService.deleteCollectionNode(
          collection, explorationId);
      };
    }]
  };
}]);
