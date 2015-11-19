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
 * @fileoverview Gallery tile component.
 *
 * @author Sean Lip
 */

oppia.directive('explorationSummaryTile', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollectionId: '&collectionId',
      getExplorationId: '&explorationId',
      getLastUpdatedMsec: '&lastUpdatedMsec',
      getNumViews: '&numViews',
      getObjective: '&objective',
      getStarRating: '&starRating',
      getThumbnailImageUrl: '&thumbnailImageUrl',
      getTitle: '&title'
    },
    templateUrl: 'summaryTile/exploration',
    controller: [
      '$scope', 'oppiaDatetimeFormatter',
      function($scope, oppiaDatetimeFormatter) {
        $scope.lastUpdatedDatetime = (
          oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
            $scope.getLastUpdatedMsec()));

        $scope.explorationLink = '/explore/' + $scope.getExplorationId();
        if ($scope.getCollectionId()) {
          $scope.explorationLink += (
            '?collection_id=' + $scope.getCollectionId());
        }
      }
    ]
  };
}]);
