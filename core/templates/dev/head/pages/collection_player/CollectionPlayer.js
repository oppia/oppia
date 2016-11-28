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
 */

oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');

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
  '$scope', 'ReadOnlyCollectionBackendApiService', 'CollectionObjectFactory',
  'CollectionPlaythroughObjectFactory', 'alertsService', '$http',
  function($scope, ReadOnlyCollectionBackendApiService, CollectionObjectFactory,
    CollectionPlaythroughObjectFactory, alertsService, $http) {
    $scope.collection = null;
    $scope.collectionPlaythrough = null;
    $scope.collectionId = GLOBALS.collectionId;
    $scope.showingAllExplorations = !GLOBALS.isLoggedIn;
    $scope.showPreviewCard = true;

    $scope.togglePreviewCard = function() {
      $scope.showPreviewCard = !$scope.showPreviewCard;
    };

    $scope.getCollectionNodeForExplorationId = function(explorationId) {
      var collectionNode = (
        $scope.collection.getCollectionNodeByExplorationId(explorationId));
      if (!collectionNode) {
        alertsService.addWarning('There was an error loading the collection.');
      }
      return collectionNode;
    };

    $scope.getCollectionNodesForExplorationIds = function(explorationIds) {
      var collectionNodes = [];
      for (var i = 0; i < explorationIds.length; i++) {
        collectionNodes[i] = $scope.getCollectionNodeForExplorationId(
          explorationIds[i]);
      }
      return collectionNodes;
    };

    $scope.getNextRecommendedCollectionNodes = function() {
      return $scope.getCollectionNodesForExplorationIds(
        $scope.collectionPlaythrough.getNextExplorationIds());
    };

    $scope.getCompletedExplorationNodes = function() {
      return $scope.getCollectionNodesForExplorationIds(
        $scope.collectionPlaythrough.getCompletedExplorationIds());
    };

    $scope.getNonRecommendedCollectionNodeCount = function() {
      return $scope.collection.getCollectionNodeCount() - (
        $scope.collectionPlaythrough.getNextRecommendedCollectionNodeCount() +
        $scope.collectionPlaythrough.getCompletedExplorationNodeCount());
    };

    $scope.getNonRecommendedCollectionNodes = function() {
      var displayedExplorationIds = (
        $scope.collectionPlaythrough.getNextExplorationIds().concat(
          $scope.collectionPlaythrough.getCompletedExplorationIds()));
      var nonRecommendedCollectionNodes = [];
      var collectionNodes = $scope.collection.getCollectionNodes();
      for (var i = 0; i < collectionNodes.length; i++) {
        var collectionNode = collectionNodes[i];
        var explorationId = collectionNode.getExplorationId();
        if (displayedExplorationIds.indexOf(explorationId) === -1) {
          nonRecommendedCollectionNodes.push(collectionNode);
        }
      }
      return nonRecommendedCollectionNodes;
    };

    $scope.toggleShowAllExplorations = function() {
      $scope.showingAllExplorations = !$scope.showingAllExplorations;
    };

    $scope.updateExplorationPreview = function(explorationId) {
      $scope.showPreviewCard = false;
      $scope.currentExplorationId = explorationId;
      $scope.explorationTitle = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().title);
      $scope.explorationLastUpdateMsec = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().last_updated_msec);
      $scope.explorationObjective = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().objective);
      $scope.explorationCategory = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().category);
      $scope.explorationRatings = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().ratings);
      $scope.explorationNumViews = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().num_views);
      $scope.explorationThumbnailIconUrl = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().thumbnail_icon_url);
      $scope.explorationThumbnailBgColor = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().thumbnail_bg_color);
      $scope.explorationIsCommunityOwned = (
        $scope.getCollectionNodeForExplorationId(
          explorationId).getExplorationSummaryObject().community_owned);
    };

    $http.get('/collectionsummarieshandler/data', {
            params: {
              stringified_collection_ids: JSON.stringify([$scope.collectionId])
            }
          }).then(
            function(response) {
              $scope.collectionSummary = response.data.summaries[0];
            },
            function() {
              alertsService.addWarning(
                'There was an error while fetching the collection summary.');
            }
          );

    // Load the collection the learner wants to view.
    ReadOnlyCollectionBackendApiService.loadCollection(
      $scope.collectionId).then(
      function(collectionBackendObject) {
        $scope.collection = CollectionObjectFactory.create(
          collectionBackendObject);
        $scope.collectionPlaythrough = (
          CollectionPlaythroughObjectFactory.create(
            collectionBackendObject.playthrough_dict));
      },
      function() {
        // TODO(bhenning): Handle not being able to load the collection.
        // NOTE TO DEVELOPERS: Check the backend console for an indication as to
        // why this error occurred; sometimes the errors are noisy, so they are
        // not shown to the user.
        alertsService.addWarning(
          'There was an error loading the collection.');
      }
    );
  }
]);
