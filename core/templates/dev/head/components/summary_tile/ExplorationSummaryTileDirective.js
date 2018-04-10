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
 * @fileoverview Component for an exploration summary tile.
 */

oppia.directive('explorationSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
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
        openInNewWindow: '@openInNewWindow',
        isCommunityOwned: '&isCommunityOwned',
        // If this is not undefined, collection preview tile for mobile
        // will be displayed.
        isCollectionPreviewTile: '@isCollectionPreviewTile',
        // If the screen width is below the threshold defined here, the mobile
        // version of the summary tile is displayed. This attribute is optional:
        // if it is not specified, it is treated as 0, which means that the
        // desktop version of the summary tile is always displayed.
        mobileCutoffPx: '@mobileCutoffPx',
        isPlaylistTile: '&isPlaylistTile',
        getParentExplorationIds: '&parentExplorationIds',
        showLearnerDashboardIconsIfPossible: (
          '&showLearnerDashboardIconsIfPossible'),
        isContainerNarrow: '&containerIsNarrow',
        belongsToCreatorPlaylist: '&belongsToCreatorPlaylist',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary_tile/' +
        'exploration_summary_tile_directive.html'),
      link: function(scope, element) {
        element.find('.exploration-summary-avatars').on('mouseenter',
          function() {
            element.find('.mask').attr('class',
              'exploration-summary-tile-mask mask');
            // As animation duration time may be 400ms, .stop(true) is used to
            // prevent the effects queue falling behind the mouse movement.
            // .hide(1) and .show(1) used to place the animation in the effects
            // queue.
            element.find('.avatars-num-minus-one').stop(true).hide(1,
              function() {
                element.find('.all-avatars').stop(true).slideDown();
              }
            );
          }
        );

        element.find('.exploration-summary-avatars').on('mouseleave',
          function() {
            element.find('.mask').attr('class', 'top-section-mask mask');
            element.find('.all-avatars').stop(true).slideUp(400, function() {
              element.find('.avatars-num-minus-one').stop(true).show(1);
            });
          }
        );
      },
      controller: [
        '$scope', '$http', '$window',
        'DateTimeFormatService', 'RatingComputationService',
        'WindowDimensionsService', 'UrlService',
        function(
            $scope, $http, $window,
            DateTimeFormatService, RatingComputationService,
            WindowDimensionsService, UrlService) {
          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;
          $scope.ACTIVITY_TYPE_EXPLORATION = (
            constants.ACTIVITY_TYPE_EXPLORATION);
          var contributorsSummary = $scope.getContributorsSummary() || {};
          $scope.contributors = Object.keys(
            contributorsSummary).sort(
            function(contributorUsername1, contributorUsername2) {
              var commitsOfContributor1 = contributorsSummary[
                contributorUsername1].num_commits;
              var commitsOfContributor2 = contributorsSummary[
                contributorUsername2].num_commits;
              return commitsOfContributor2 - commitsOfContributor1;
            }
          );

          $scope.isRefresherExploration = false;
          if ($scope.getParentExplorationIds()) {
            $scope.isRefresherExploration = (
              $scope.getParentExplorationIds().length > 0);
          }

          $scope.avatarsList = [];

          $scope.MAX_AVATARS_TO_DISPLAY = 5;

          $scope.setHoverState = function(hoverState) {
            $scope.explorationIsCurrentlyHoveredOver = hoverState;
          };

          $scope.loadParentExploration = function() {
            $window.location.href = $scope.getExplorationLink();
          };

          $scope.getAverageRating = function() {
            if (!$scope.getRatings()) {
              return null;
            }
            return RatingComputationService.computeAverageRating(
              $scope.getRatings());
          };

          $scope.getLastUpdatedDatetime = function() {
            if (!$scope.getLastUpdatedMsec()) {
              return null;
            }
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              $scope.getLastUpdatedMsec());
          };

          $scope.getExplorationLink = function() {
            if (!$scope.getExplorationId()) {
              return '#';
            } else {
              var result = '/explore/' + $scope.getExplorationId();
              var urlParams = UrlService.getUrlParams();
              var parentExplorationIds = $scope.getParentExplorationIds();

              var collectionIdToAdd = $scope.getCollectionId();
              // Replace the collection ID with the one in the URL if it exists
              // in urlParams.
              if (parentExplorationIds &&
                  urlParams.hasOwnProperty('collection_id')) {
                collectionIdToAdd = urlParams.collection_id;
              }

              if (collectionIdToAdd) {
                result = UrlService.addField(
                  result, 'collection_id', collectionIdToAdd);
              }
              if (parentExplorationIds) {
                for (var i = 0; i < parentExplorationIds.length - 1; i++) {
                  result = UrlService.addField(
                    result, 'parent', parentExplorationIds[i]);
                }
              }
              return result;
            }
          };

          if (!$scope.mobileCutoffPx) {
            $scope.mobileCutoffPx = 0;
          }
          $scope.isWindowLarge = (
            WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.isWindowLarge = (
              WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
            $scope.$apply();
          });

          $scope.getCompleteThumbnailIconUrl = function () {
            return UrlInterpolationService.getStaticImageUrl(
              $scope.getThumbnailIconUrl());
          };
        }
      ]
    };
  }]);
