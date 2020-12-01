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

require('domain/learner_dashboard/learner-dashboard-icons.directive.ts');
require('filters/summarize-nonnegative-number.filter.ts');
require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');

require('components/ratings/rating-computation/rating-computation.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/date-time-format.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('explorationSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getCollectionId: '&collectionId',
        getExplorationId: '&explorationId',
        getExplorationTitle: '&explorationTitle',
        getStoryNodeId: '&nodeId',
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
        isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary-tile/exploration-summary-tile.directive.html'),
      controller: [
        '$rootScope', '$scope', '$window', 'DateTimeFormatService',
        'RatingComputationService', 'UrlService', 'UserService',
        'WindowDimensionsService', 'ACTIVITY_TYPE_EXPLORATION',
        function(
            $rootScope, $scope, $window, DateTimeFormatService,
            RatingComputationService, UrlService, UserService,
            WindowDimensionsService, ACTIVITY_TYPE_EXPLORATION) {
          var ctrl = this;
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
              var storyIdToAdd = null;
              var storyNodeIdToAdd = null;
              // Replace the collection ID with the one in the URL if it exists
              // in urlParams.
              if (parentExplorationIds &&
                  urlParams.hasOwnProperty('collection_id')) {
                collectionIdToAdd = urlParams.collection_id;
              } else if (
                UrlService.getPathname().match(/\/story\/(\w|-){12}/g) &&
                $scope.getStoryNodeId()) {
                storyIdToAdd = UrlService.getStoryIdFromViewerUrl();
                storyNodeIdToAdd = $scope.getStoryNodeId();
              } else if (
                urlParams.hasOwnProperty('story_id') &&
                urlParams.hasOwnProperty('node_id')) {
                storyIdToAdd = urlParams.story_id;
                storyNodeIdToAdd = $scope.getStoryNodeId();
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
              if (storyIdToAdd && storyNodeIdToAdd) {
                result = UrlService.addField(result, 'story_id', storyIdToAdd);
                result = UrlService.addField(
                  result, 'node_id', storyNodeIdToAdd);
              }
              return result;
            }
          };

          $scope.getCompleteThumbnailIconUrl = function() {
            return UrlInterpolationService.getStaticImageUrl(
              $scope.getThumbnailIconUrl());
          };
          ctrl.$onInit = function() {
            $scope.userIsLoggedIn = null;
            UserService.getUserInfoAsync().then(function(userInfo) {
              $scope.userIsLoggedIn = userInfo.isLoggedIn();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the controller is migrated to angular.
              $rootScope.$applyAsync();
            });
            $scope.ACTIVITY_TYPE_EXPLORATION = ACTIVITY_TYPE_EXPLORATION;
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

            if (!$scope.mobileCutoffPx) {
              $scope.mobileCutoffPx = 0;
            }
            $scope.isWindowLarge = (
              WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);

            ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
              subscribe(evt => {
                $scope.isWindowLarge = (
                  WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
                $scope.$applyAsync();
              });
          };

          ctrl.$onDestroy = function() {
            if (ctrl.resizeSubscription) {
              ctrl.resizeSubscription.unsubscribe();
            }
          };
        }
      ]
    };
  }]);

import { Directive, ElementRef, Injector } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
@Directive({
  selector: 'exploration-summary-tile'
})
export class ExplorationSummaryTileDirective extends UpgradeComponent {
  constructor(elementRef: ElementRef, injector: Injector) {
    super('explorationSummaryTile', elementRef, injector);
  }
}
