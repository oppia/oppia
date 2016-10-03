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
      // If this is not null, the new exploration opens in a new window when the
      // summary tile is clicked.
      openInNewWindow: '@openInNewWindow',
      isCommunityOwned: '&isCommunityOwned',
      // If the screen width is below the threshold defined here, the mobile
      // version of the summary tile is displayed. This attribute is optional:
      // if it is not specified, it is treated as 0, which means that the
      // desktop version of the summary tile is always displayed.
      mobileCutoffPx: '@mobileCutoffPx'
    },
    templateUrl: 'summaryTile/exploration',
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
      '$scope', '$http',
      'oppiaDatetimeFormatter', 'RatingComputationService',
      'windowDimensionsService', 'UrlInterpolationService',
      function(
        $scope, $http,
        oppiaDatetimeFormatter, RatingComputationService,
        windowDimensionsService, UrlInterpolationService) {
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

        $scope.avatarsList = [];
        $scope.contributors.forEach(function(contributorName) {
          var DEFAULT_PROFILE_IMAGE_PATH = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/user_blue_72px.png'));

          var avatarData = {
            image: contributorsSummary[
              contributorName].profile_picture_data_url ||
              DEFAULT_PROFILE_IMAGE_PATH,
            tooltipText: contributorName
          };

          if (GLOBALS.SYSTEM_USERNAMES.indexOf(contributorName) === -1) {
            avatarData.link = '/profile/' + contributorName;
          }

          $scope.avatarsList.push(avatarData);
        });

        if ($scope.isCommunityOwned()) {
          var COMMUNITY_OWNED_IMAGE_PATH = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/fa_globe_72px.png'));

          var COMMUNITY_OWNED_TOOLTIP_TEXT = 'Community Owned';

          var communityOwnedAvatar = {
            image: COMMUNITY_OWNED_IMAGE_PATH,
            tooltipText: COMMUNITY_OWNED_TOOLTIP_TEXT
          };

          $scope.avatarsList.unshift(communityOwnedAvatar);
        }

        $scope.MAX_AVATARS_TO_DISPLAY = 5;

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

        if (!$scope.mobileCutoffPx) {
          $scope.mobileCutoffPx = 0;
        }
        $scope.isWindowLarge = (
          windowDimensionsService.getWidth() >= $scope.mobileCutoffPx);

        windowDimensionsService.registerOnResizeHook(function() {
          $scope.isWindowLarge = (
            windowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
          $scope.$apply();
        });
      }
    ]
  };
}]);
