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

oppia.directive('collectionNodeEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollectionNode: '&collectionNode',
      getLinearIndex: '&linearIndex'
    },
    templateUrl: 'inline/collection_node_editor_directive',
    controller: [
      '$scope', 'CollectionEditorStateService', 'CollectionLinearizerService',
      'CollectionUpdateService', 'alertsService',
      function(
          $scope, CollectionEditorStateService, CollectionLinearizerService,
          CollectionUpdateService, alertsService) {
        $scope.collection = CollectionEditorStateService.getCollection();

        var _addSkill = function(skillList, newSkillName) {
          // Ensure the user entered a skill name.
          if (!newSkillName) {
            alertsService.addWarning('Cannot add empty skill to collection.');
            return false;
          } else if (!skillList.addSkill(newSkillName)) {
            alertsService.addWarning(
              'Skill is already added: ' + newSkillName);
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
            $scope.collection, collectionNode.getExplorationId(),
            prerequisiteSkillList.getSkills());
          $scope.prerequisiteSkillName = '';
        };

        // Removes a prerequisite skill from the frontend collection object and
        // also updates the changelist.
        $scope.removePrerequisiteSkill = function(index) {
          var collectionNode = $scope.getCollectionNode();
          var prerequisiteSkillList = _copyPrerequisiteSkillList();
          prerequisiteSkillList.removeSkillByIndex(index);
          CollectionUpdateService.setPrerequisiteSkills(
            $scope.collection, collectionNode.getExplorationId(),
            prerequisiteSkillList.getSkills());
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
            $scope.collection, collectionNode.getExplorationId(),
            acquiredSkillList.getSkills());
          $scope.acquiredSkillName = '';
        };

        // Removes an acquired skill from the frontend collection object and
        // also updates the changelist.
        $scope.removeAcquiredSkill = function(index) {
          var collectionNode = $scope.getCollectionNode();
          var acquiredSkillList = _copyAcquiredSkillList();
          acquiredSkillList.removeSkillByIndex(index);
          CollectionUpdateService.setAcquiredSkills(
            $scope.collection, collectionNode.getExplorationId(),
            acquiredSkillList.getSkills());
        };

        // Deletes this collection node from the frontend collection object and
        // also updates the changelist.
        $scope.deleteNode = function() {
          var explorationId = $scope.getCollectionNode().getExplorationId();
          if (!CollectionLinearizerService.removeCollectionNode(
              $scope.collection, explorationId)) {
            alertsService.fatalWarning(
              'Internal collection editor error. Could not delete ' +
              'exploration by ID: ' + explorationId);
          }
        };

        // Shifts this collection node left in the linearized list of the
        // collection, if possible.
        $scope.shiftNodeLeft = function() {
          var explorationId = $scope.getCollectionNode().getExplorationId();
          if (!CollectionLinearizerService.shiftNodeLeft(
              $scope.collection, explorationId)) {
            alertsService.fatalWarning(
              'Internal collection editor error. Could not shift node left ' +
              'with ID: ' + explorationId);
          }
        };

        // Shifts this collection node right in the linearized list of the
        // collection, if possible.
        $scope.shiftNodeRight = function() {
          var explorationId = $scope.getCollectionNode().getExplorationId();
          if (!CollectionLinearizerService.shiftNodeRight(
              $scope.collection, explorationId)) {
            alertsService.fatalWarning(
              'Internal collection editor error. Could not shift node right ' +
              'with ID: ' + explorationId);
          }
        };
      }
    ]
  };
}]);
