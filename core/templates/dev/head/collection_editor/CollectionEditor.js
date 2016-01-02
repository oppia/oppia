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

  // EXAMPLES DEMONSTRATING HOW TO CHANGE THE COLLECTION. THE FOLLOWING CODE
  // SHOULD NOT GO INTO DEVELOP.

  var _arrayContainsCaseInsensitive = function(array, element) {
    var lowerElement = element.toLowerCase();
    for (var i = 0; i < array.length; i++) {
      if (array[i].toLowerCase() === lowerElement) {
        return true;
      }
    }
    return false;
  };

  var _updateCollection = function(commitMessage, changeList) {
    WritableCollectionBackendApiService.updateCollection(
      $scope.collection.id, $scope.collection.version, commitMessage,
      changeList).then(function(collection) {
        $scope.collection = collection;
      }, function(error) {
        warningsData.addWarning(
          error || 'There was an error updating the collection.');
      });
  };

  $scope.addExploration = function(newExpId) {
    if (newExpId) {
      var change = CollectionUpdateService.buildAddCollectionNodeUpdate(
        newExpId);
      _updateCollection('Add new exploration to collection.', [change]);
    }
  };

  $scope.deleteExploration = function(removeExpId) {
    if (removeExpId) {
      var change = CollectionUpdateService.buildDeleteCollectionNodeUpdate(
        removeExpId);
      _updateCollection('Remove exploration from collection.', [change]);
    }
  };

  $scope.setCollectionTitle = function(newCollectionTitle) {
    if (newCollectionTitle) {
      var change = CollectionUpdateService.buildCollectionTitleUpdate(
        newCollectionTitle);
      _updateCollection('Change collection title.', [change]);
    }
  };

  $scope.setCollectionCategory = function(newCollectionCategory) {
    if (newCollectionCategory) {
      var change = CollectionUpdateService.buildCollectionCategoryUpdate(
        newCollectionCategory);
      _updateCollection('Change collection category.', [change]);
    }
  };

  $scope.setCollectionObjective = function(newCollectionObjective) {
    if (newCollectionObjective) {
      var change = CollectionUpdateService.buildCollectionObjectiveUpdate(
        newCollectionObjective);
      _updateCollection('Change collection objective.', [change]);
    }
  };

  $scope.addPrereqSkill = function(expId, skillName) {
    if (expId && skillName) {
      var collectionNode = $scope.collection.nodes[expId];
      var prerequisiteSkills = angular.copy(collectionNode.prerequisite_skills);
      if (!_arrayContainsCaseInsensitive(prerequisiteSkills, skillName)) {
        prerequisiteSkills.push(skillName);
        var change = CollectionUpdateService.buildPrerequisiteSkillsUpdate(
          expId, prerequisiteSkills);
        _updateCollection('Add prerequisite skill to exploration.', [change]);
      }
    }
  };

  $scope.addAcquiredSkill = function(expId, skillName) {
    if (expId && skillName) {
      var collectionNode = $scope.collection.nodes[expId];
      var acquiredSkills = angular.copy(collectionNode.acquired_skills);
      if (!_arrayContainsCaseInsensitive(acquiredSkills, skillName)) {
        acquiredSkills.push(skillName);
        var change = CollectionUpdateService.buildAcquiredSkillsUpdate(
          expId, acquiredSkills);
        _updateCollection('Add acquired skill to exploration.', [change]);
      }
    }
  };

  // END OF EXAMPLE CODE DEMONSTRATING HOW TO CHANGE THE COLLECTION.
}]);
