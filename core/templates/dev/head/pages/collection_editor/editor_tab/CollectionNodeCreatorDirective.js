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
 * @fileoverview Directive for creating a new collection node.
 */

oppia.directive('collectionNodeCreator', [function() {
  return {
    restrict: 'E',
    templateUrl: 'collectionEditor/newNodeCreator',
    controller: [
      '$scope', '$http', '$window', '$filter', 'alertsService',
      'validatorsService', 'CollectionEditorStateService',
      'CollectionLinearizerService', 'CollectionUpdateService',
      'CollectionNodeObjectFactory', 'ExplorationSummaryBackendApiService',
      'SearchExplorationsBackendApiService', 'siteAnalyticsService',
      function(
          $scope, $http, $window, $filter, alertsService,
          validatorsService, CollectionEditorStateService,
          CollectionLinearizerService, CollectionUpdateService,
          CollectionNodeObjectFactory, ExplorationSummaryBackendApiService,
          SearchExplorationsBackendApiService, siteAnalyticsService) {
        $scope.collection = CollectionEditorStateService.getCollection();
        $scope.newExplorationId = '';
        $scope.newExplorationTitle = '';
        var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';

        $scope.fetchExplorationsMetadata = function(searchQuery) {
          if (/^[a-zA-Z0-9- ]*$/.test(searchQuery)) {
            return SearchExplorationsBackendApiService.getExplorations(
              searchQuery).then(
            function(explorationMetadataObject) {
              return explorationMetadataObject.collection_node_metadata_list.
                map(function(item) {
                  return '(#' + item.id + ') ' + item.title;
                });
            },
            function() {
              alertsService.addWarning(
                'There was an error when searching the explorations.');
            });
          }
        };

        var addExplorationToCollection = function(newExplorationId) {
          if (!newExplorationId) {
            alertsService.addWarning('Cannot add an empty exploration ID.');
            return;
          }
          if ($scope.collection.containsCollectionNode(newExplorationId)) {
            alertsService.addWarning(
              'There is already an exploration in this collection with that ' +
              'id.');
            return;
          }

          alertsService.clearWarnings();

          ExplorationSummaryBackendApiService
            .loadPublicAndPrivateExplorationSummaries([newExplorationId])
            .then(function(summaries) {
              var summaryBackendObject = null;
              if (summaries.length !== 0 &&
                  summaries[0].id === newExplorationId) {
                summaryBackendObject = summaries[0];
              }
              if (summaryBackendObject) {
                CollectionLinearizerService.appendCollectionNode(
                  $scope.collection, newExplorationId, summaryBackendObject);
              } else {
                alertsService.addWarning(
                  'That exploration does not exist or you do not have edit ' +
                  'access to it.');
              }
            }, function() {
              alertsService.addWarning(
                'There was an error while adding an exploration to the ' +
                'collection.');
            }
          );
        };

        var cleanExplorationId = function(newExplorationId) {
          if (newExplorationId.length > 1 && newExplorationId[0] === '(') {
            var temp = '';
            for (var i = 2; newExplorationId[i] !== ')'; i++) {
              temp += newExplorationId[i];
            }
            $scope.newExplorationId = temp;
          }
        };

        // Creates a new exploration, then adds it to the collection.
        $scope.createNewExploration = function() {
          var title = $filter('normalizeWhitespace')(
            $scope.newExplorationTitle);

          if (!validatorsService.isValidExplorationTitle(title, true)) {
            return;
          }

          // Create a new exploration with the given title.
          $http.post('/contributehandler/create_new', {
            title: title
          }).then(function(response) {
            $scope.newExplorationTitle = '';
            var newExplorationId = response.data.explorationId;

            siteAnalyticsService.registerCreateNewExplorationInCollectionEvent(
              newExplorationId);
            addExplorationToCollection(newExplorationId);
          });
        };

        $scope.addExploration = function() {
          cleanExplorationId($scope.newExplorationId);
          addExplorationToCollection($scope.newExplorationId);
          $scope.newExplorationId = '';
        };
      }
    ]
  };
}]);
