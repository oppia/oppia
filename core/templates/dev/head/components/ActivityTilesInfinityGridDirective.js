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
 * @fileoverview Directive for an infinitely-scrollable view of activity tiles
 */

oppia.directive('activityTilesInfinityGrid', [function() {
  return {
    restrict: 'E',
    templateUrl: 'components/activityTilesInfinityGrid',
    controller: [
      '$scope', '$rootScope', 'searchService',
      function($scope, $rootScope, searchService) {
        $scope.endOfPageIsReached = false;
        $scope.allExplorationsInOrder = [];

        // Called when the first batch of search results is retrieved from the
        // server.
        $scope.$on(
          'initialSearchResultsLoaded', function(evt, explorationsList) {
            $scope.allExplorationsInOrder = explorationsList;
          }
        );

        $scope.showMoreExplorations = function() {
          if (!$rootScope.loadingMessage && !$scope.endOfPageIsReached) {
            $scope.searchResultsAreLoading = true;
            searchService.loadMoreData(function(data, endOfPageIsReached) {
              $scope.allExplorationsInOrder =
              $scope.allExplorationsInOrder.concat(
                data.explorations_list);
              $scope.endOfPageIsReached = endOfPageIsReached;
              $scope.searchResultsAreLoading = false;
            }, function(endOfPageIsReached) {
              $scope.endOfPageIsReached = endOfPageIsReached;
              $scope.searchResultsAreLoading = false;
            });
          }
        };
      }
    ]
  };
}]);
