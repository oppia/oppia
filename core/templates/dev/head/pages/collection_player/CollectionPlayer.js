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
    function($scope, collectionDataService, warningsData) {

  $scope.collection = null;
  $scope.collectionId = GLOBALS.collectionId;

  $scope.getCollectionNodeForExplorationId = function(explorationId) {
    for (var i = 0; i < $scope.collection.nodes.length; i++) {
      var collectionNode = $scope.collection.nodes[i];
      if (collectionNode.exploration_id == explorationId) {
        return collectionNode;
      }
    }
    return undefined;
  };

  $scope.getSuggestedCollectionNodes = function() {
    var nextExplorationIds = $scope.collection.next_exploration_ids;
    var suggestedCollectionNodes = [];
    for (var i = 0; i < nextExplorationIds.length; i++) {
      var collectionNode = $scope.getCollectionNodeForExplorationId(
        nextExplorationIds[i]);
      suggestedCollectionNodes.push(collectionNode);
    }
    return suggestedCollectionNodes;
  };

  // Load the collection the learner wants to view.
  collectionDataService.loadCollection(
      $scope.collectionId, function(collection) {
    $scope.collection = collection;
  }, function(error, collectionId) {
    // TODO(bhenning): Handle not being able to load the collection.
    warningsData.addWarning(
      error || 'There was an error loading the collection.');
  });
}]);
