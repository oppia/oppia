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

oppia.animation('.oppia-collection-animate-slide', function() {
  return {
    enter: function(element) {
      element.hide().slideDown();
    },
    leave: function(element) {
      element.slideUp();
    }
  };
});

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
      return null;
    };

    $scope.getCollectionNodesForExplorationIds = function(explorationIds) {
      var collectionNodes = [];
      for (var i = 0; i < explorationIds.length; i++) {
        collectionNodes[i] = $scope.getCollectionNodeForExplorationId(
          explorationIds[i]);
      }
      return collectionNodes;
    };

    $scope.hasStartedCollection = function() {
      return $scope.collection.completed_exploration_ids.length != 0;
    };

    $scope.hasFinishedCollection = function() {
      return $scope.collection.next_exploration_ids.length == 0;
    };

    $scope.getNextRecommendedCollectionNodeCount = function() {
      return $scope.collection.next_exploration_ids.length;
    };

    $scope.getNextRecommendedCollectionNodes = function() {
      return $scope.getCollectionNodesForExplorationIds(
        $scope.collection.next_exploration_ids);
    };

    $scope.getCompletedExplorationNodeCount = function() {
      return $scope.collection.completed_exploration_ids.length;
    };

    $scope.getCompletedExplorationNodes = function() {
      return $scope.getCollectionNodesForExplorationIds(
        $scope.collection.completed_exploration_ids);
    };

    $scope.getNonRecommendedCollectionNodeCount = function() {
      return $scope.collection.nodes.length - (
        $scope.getNextRecommendedCollectionNodeCount() +
        $scope.getCompletedExplorationNodeCount());
    };

    $scope.getNonRecommendedCollectionNodes = function() {
      var displayedExplorationIds = (
        $scope.collection.next_exploration_ids.concat(
          $scope.collection.completed_exploration_ids));
      var nonRecommendedCollectionNodes = [];
      for (var i = 0; i < $scope.collection.nodes.length; i++) {
        var collectionNode = $scope.collection.nodes[i];
        var searchIndex = -1;
        for (var j = 0; j < displayedExplorationIds.length; j++) {
          if (displayedExplorationIds[j] === collectionNode.exploration_id) {
            searchIndex = j;
            break;
          }
        }
        if (searchIndex == -1) {
          nonRecommendedCollectionNodes.push(collectionNode);
        }
      }
      return nonRecommendedCollectionNodes;
    };

    $scope.getAllCollectionNodes = function() {
      return $scope.collection.nodes;
    };

    $scope.toggleShowAllExplorations = function() {
      $scope.showingAllExplorations = !$scope.showingAllExplorations;
    };

    // Load the collection the learner wants to view.
    CollectionDataService.loadCollection($scope.collectionId).then(
      function(collection) {
        $scope.collection = collection;
      },
      function(error) {
        // TODO(bhenning): Handle not being able to load the collection.
        warningsData.addWarning(
          error || 'There was an error loading the collection.');
      }
    );
  }
]);
