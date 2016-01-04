// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Primary controller for the collection editor page.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

// TODO(bhenning): These constants should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL', '/collection_handler/data/<collection_id>');
oppia.constant(
  'WRITABLE_COLLECTION_DATA_URL', '/collection_editor/data/<collection_id>');

oppia.controller('CollectionEditor', ['$scope', 'CollectionBackendApiService',
  'WritableCollectionBackendApiService', 'CollectionUpdateService',
  'warningsData', function(
    $scope, CollectionBackendApiService, WritableCollectionBackendApiService,
    CollectionUpdateService, warningsData) {

  $scope.collection = null;
  $scope.collectionId = GLOBALS.collectionId;

  // Load the collection to be edited.
  CollectionBackendApiService.loadCollection($scope.collectionId).then(
    function(collection) {
      $scope.collection = collection;
    }, function(error) {
      // TODO(mgowano): Handle not being able to load the collection.
      warningsData.addWarning(
        error || 'There was an error loading the collection.');
  });

  var _getCollectionNodeForExplorationId = function(explorationId) {
    for (var i = 0; i < $scope.collection.nodes.length; i++) {
      var collectionNode = $scope.collection.nodes[i];
      if (collectionNode.exploration_id == explorationId) {
        return collectionNode;
      }
    }
    return null;
  };

  // EXAMPLES DEMONSTRATING HOW TO CHANGE THE COLLECTION. THE FOLLOWING CODE
  // SHOULD NOT GO INTO DEVELOP.

  // Stores a pending list of changes.
  $scope.changeList = [];

  var _arrayContainsCaseInsensitive = function(array, element) {
    var lowerElement = element.toLowerCase();
    for (var i = 0; i < array.length; i++) {
      if (array[i].toLowerCase() === lowerElement) {
        return true;
      }
    }
    return false;
  };

  $scope.addExploration = function(newExpId) {
    if (newExpId) {
      var change = CollectionUpdateService.buildAddCollectionNodeUpdate(
        newExpId);
      $scope.changeList.push(change);
    }
  };

  $scope.deleteExploration = function(removeExpId) {
    if (removeExpId) {
      var change = CollectionUpdateService.buildDeleteCollectionNodeUpdate(
        removeExpId);
      $scope.changeList.push(change);
    }
  };

  $scope.setCollectionTitle = function(newCollectionTitle) {
    if (newCollectionTitle) {
      var change = CollectionUpdateService.buildCollectionTitleUpdate(
        newCollectionTitle);
      $scope.changeList.push(change);
    }
  };

  $scope.setCollectionCategory = function(newCollectionCategory) {
    if (newCollectionCategory) {
      var change = CollectionUpdateService.buildCollectionCategoryUpdate(
        newCollectionCategory);
      $scope.changeList.push(change);
    }
  };

  $scope.setCollectionObjective = function(newCollectionObjective) {
    if (newCollectionObjective) {
      var change = CollectionUpdateService.buildCollectionObjectiveUpdate(
        newCollectionObjective);
      $scope.changeList.push(change);
    }
  };

  $scope.addPrereqSkill = function(expId, skillName) {
    if (expId && skillName) {
      var collectionNode = _getCollectionNodeForExplorationId(expId);
      var prerequisiteSkills = angular.copy(collectionNode.prerequisite_skills);
      if (!_arrayContainsCaseInsensitive(prerequisiteSkills, skillName)) {
        prerequisiteSkills.push(skillName);
        var change = CollectionUpdateService.buildPrerequisiteSkillsUpdate(
          expId, prerequisiteSkills);
        $scope.changeList.push(change);
      }
    }
  };

  $scope.addAcquiredSkill = function(expId, skillName) {
    if (expId && skillName) {
      var collectionNode = _getCollectionNodeForExplorationId(expId);
      var acquiredSkills = angular.copy(collectionNode.acquired_skills);
      if (!_arrayContainsCaseInsensitive(acquiredSkills, skillName)) {
        acquiredSkills.push(skillName);
        var change = CollectionUpdateService.buildAcquiredSkillsUpdate(
          expId, acquiredSkills);
        $scope.changeList.push(change);
      }
    }
  };

  // An explicit save is needed to push all changes to the backend at once
  // because some likely working states of the collection will cause validation
  // errors when trying to incrementally save them.
  $scope.saveCollection = function(commitMessage) {
    WritableCollectionBackendApiService.updateCollection(
      $scope.collection.id, $scope.collection.version, commitMessage,
      $scope.changeList).then(function(collection) {
        $scope.collection = collection;
        $scope.changeList = [];
      }, function(error) {
        warningsData.addWarning(
          error || 'There was an error updating the collection.');
      });
  };

  // END OF EXAMPLE CODE DEMONSTRATING HOW TO CHANGE THE COLLECTION.
}]);
