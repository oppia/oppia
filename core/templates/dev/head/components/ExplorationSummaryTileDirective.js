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

oppia.animation('.oppia-exploration-summary-tile-all-contributors-animate',
  function() {
    return {
      enter: function(element) {
        element.hide().slideDown();
      },
      leave: function(element) {
        element.slideUp();
      }
    };
  }
);

oppia.directive('explorationSummaryTile', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollectionId: '&collectionId',
      getExplorationId: '&explorationId',
      getExplorationTitle: '&explorationTitle',
      getLastUpdatedMsec: '&lastUpdatedMsec',
      getNumViews: '&numViews',
      getObjective: '&objective',
      getCategory: '&category',
      getRatings: '&ratings',
      getContributorsSummary: '&contributorsSummary',
      getThumbnailIconUrl: '&thumbnailIconUrl',
      getThumbnailBgColor: '&thumbnailBgColor',
      // If this is not null, the new exploration opens in a new window when
      // the summary tile is clicked.
      openInNewWindow: '@openInNewWindow'
    },
    templateUrl: 'summaryTile/exploration',
    controller: [
      '$scope', 'oppiaDatetimeFormatter', 'RatingComputationService',
      function($scope, oppiaDatetimeFormatter, RatingComputationService) {
        $scope.contributors = Object.keys(
          $scope.getContributorsSummary() || {}).sort(
          function(contributorUsername1, contributorUsername2) {
            var commitsOfContributor1 = $scope.getContributorsSummary()[
                contributorUsername1];
            var commitsOfContributor2 = $scope.getContributorsSummary()[
                contributorUsername2];
            return commitsOfContributor2 - commitsOfContributor1;
          }
        );

        $scope.MAX_CONTRIBUTORS_TO_DISPLAY = 5;

        $scope.allContributorsAreVisible = false;

        $scope.getAverageRating = function() {
          return RatingComputationService.computeAverageRating(
            $scope.getRatings());
        };

        $scope.getLastUpdatedDatetime = function() {
          return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
            $scope.getLastUpdatedMsec());
        };

        $scope.wasRecentlyUpdated = function() {
          return oppiaDatetimeFormatter.isRecent($scope.getLastUpdatedMsec());
        };

        $scope.getExplorationLink = function() {
          var result = '/explore/' + $scope.getExplorationId();
          if ($scope.getCollectionId()) {
            result += ('?collection_id=' + $scope.getCollectionId());
          }
          return result;
        };
      }
    ]
  };
}]);
