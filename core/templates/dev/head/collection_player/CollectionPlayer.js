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
 * @fileoverview Controller for the learner's view of a collection.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

oppia.constant(
  'COLLECTION_DATA_URL', '/collectionhandler/data/<collection_id>');

oppia.controller('CollectionPlayer', [
    '$scope', 'CollectionDataService', 'warningsData',
    function($scope, CollectionDataService, warningsData) {

  $scope.collection = null;
  $scope.collectionId = GLOBALS.collectionId;
  $scope.showingAllExplorations = !GLOBALS.isLoggedIn;

  $scope.getCollectionNodeForExplorationId = function(explorationId) {
    for (var i = 0; i < $scope.collection.nodes.length; i++) {
      var collectionNode = $scope.collection.nodes[i];
      if (collectionNode.exploration_id == explorationId) {
        return collectionNode;
      }
    }
    warningsData.addWarning('There was an error loading the collection.');
    console.error('There was an error loading the collection.');
    return null;
  };

  $scope.hasStartedCollection = function() {
    return $scope.collection.completed_exploration_ids.length != 0;
  };

  $scope.hasFinishedCollection = function() {
    return $scope.collection.next_exploration_ids.length == 0;
  };

  $scope.getDisplayedCollectionNodes = function() {
    // If the collection has been finished, show all explorations so users may
    // replay any of their choice.
    if ($scope.hasFinishedCollection() || $scope.showingAllExplorations) {
      return $scope.collection.nodes;
    }

    var nextExplorationIds = $scope.collection.next_exploration_ids;
    var completedExplorationIds = $scope.collection.completed_exploration_ids;
    var displayedExplorationIds = nextExplorationIds.concat(
      completedExplorationIds);

    var displayedCollectionNodes = [];
    for (var i = 0; i < displayedExplorationIds.length; i++) {
      var collectionNode = (
        $scope.getCollectionNodeForExplorationId(displayedExplorationIds[i]));

      // The completed explorations are listed first, so their index falls
      // within [0:nextExplorationIds.length).
      collectionNode.exploration.completed = (i >= nextExplorationIds.length);
      displayedCollectionNodes.push(collectionNode);
    }

    return displayedCollectionNodes;
  };

  $scope.toggleShowAllExplorations = function() {
    var showingAllExplorations = $scope.showingAllExplorations;
    $scope.showingAllExplorations = !showingAllExplorations;
    if (!showingAllExplorations) {
      for (var i = 0; i < $scope.collection.nodes.length; i++) {
        $scope.collection.nodes[i].exploration.completed = false;
      }
    }
  };

  // Load the collection the learner wants to view.
  CollectionDataService.loadCollection($scope.collectionId).then(
    function(collection) {
      $scope.collection = collection;
    }, function(error, collectionId) {
      // TODO(bhenning): Handle not being able to load the collection.
      warningsData.addWarning(
        error || 'There was an error loading the collection.');
    });
}]);
