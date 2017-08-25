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
        isPlaylistMode: '&playlistMode',
        getLearnerDashboardActivityIds: '&learnerDashboardActivityIds',
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
        '$scope', '$http', '$modal',
        'oppiaDatetimeFormatter', 'RatingComputationService',
        'windowDimensionsService', 'UrlInterpolationService',
        'alertsService',
        function(
          $scope, $http, $modal,
          oppiaDatetimeFormatter, RatingComputationService,
          windowDimensionsService, UrlInterpolationService,
          alertsService) {
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
          var explorationIsActive = false;

          $scope.toggleExplorationIsActive = function(explorationId) {
            explorationIsActive = !explorationIsActive;
          };

          $scope.canExplorationBeAddedToLearnerPlaylist = function(explorationId) {
            if ($scope.getLearnerDashboardActivityIds()) {
              var incompleteExplorationIds = (
                $scope.getLearnerDashboardActivityIds().incomplete_exploration_ids);
              var completedExplorationIds = (
                $scope.getLearnerDashboardActivityIds().completed_exploration_ids);
              var explorationPlaylistIds = (
                $scope.getLearnerDashboardActivityIds().exploration_playlist_ids);

              if (incompleteExplorationIds.indexOf(explorationId) !== -1 ||
                  completedExplorationIds.indexOf(explorationId) !== -1 ||
                  explorationPlaylistIds.indexOf(explorationId) !== -1) {
                return false;
              } else {
                return explorationIsActive;
              }
            }
          };

          $scope.addToLearnerPlaylist = function(explorationId) {
            var addExplorationToLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/<activityType>/<explorationId>', {
                  activityType: constants.ACTIVITY_TYPE_EXPLORATION,
                  explorationId: explorationId
                }));
            $http.post(addExplorationToLearnerPlaylistUrl, {})
              .then(function(response) {
                var successfullyAdded = true;
                if (response.data.belongs_to_completed_or_incomplete_list) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'You have already completed or are completing this ' +
                    'activity.');
                }
                if (response.data.belongs_to_subscribed_activities) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'This is present in your creator dashboard');
                }
                if (response.data.playlist_limit_exceeded) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'Your \'Play Later\' list is full!  Either you can ' +
                    'complete some or you can head to the learner dashboard ' +
                    'and remove some.');
                }
                if (successfullyAdded) {
                  alertsService.addSuccessMessage(
                    'Successfully added to your \'Play Later\' list.');
                  /* eslint-disable max-len */
                  $scope.getLearnerDashboardActivityIds().exploration_playlist_ids.push(
                    explorationId);
                  /* eslint-enable max-len */
                }
              });
          };

          $scope.removeFromLearnerPlaylist = function(explorationId, explorationTitle) {
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/learner_dashboard/' +
                'remove_activity_from_learner_dashboard_modal_directive.html'),
              backdrop: true,
              resolve: {
                explorationId: function() {
                  return explorationId;
                },
                explorationTitle: function() {
                  return explorationTitle;
                }
              },
              controller: [
                '$scope', '$modalInstance', '$http',
                'UrlInterpolationService', function($scope, $modalInstance,
                  $http, UrlInterpolationService) {
                  $scope.sectionNameI18nId = (
                    'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                  $scope.explorationTitle = explorationTitle;
                  var removeFromLearnerPlaylistUrl = (
                    UrlInterpolationService.interpolateUrl(
                      '/learnerplaylistactivityhandler/' +
                      '<activityType>/<explorationId>', {
                        activityType: constants.ACTIVITY_TYPE_EXPLORATION,
                        explorationId: explorationId
                      }));
                  $scope.remove = function() {
                    $http['delete'](removeFromLearnerPlaylistUrl);
                    $modalInstance.close();
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function() {
              /* eslint-disable max-len */
              var index = (
                $scope.getLearnerDashboardActivityIds().exploration_playlist_ids.indexOf(
                  explorationId));
              if (index !== -1) {
                $scope.getLearnerDashboardActivityIds().exploration_playlist_ids.splice(
                  index, 1);
              }
              /* eslint-enable max-len */
            });
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
            return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
              $scope.getLastUpdatedMsec());
          };

          $scope.getExplorationLink = function() {
            if (!$scope.getExplorationId()) {
              return '#';
            } else {
              var result = '/explore/' + $scope.getExplorationId();
              if ($scope.getCollectionId()) {
                result += ('?collection_id=' + $scope.getCollectionId());
              }
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

          $scope.getCompleteThumbnailIconUrl = function () {
            return UrlInterpolationService.getStaticImageUrl(
              $scope.getThumbnailIconUrl());
          };
        }
      ]
    };
  }]);
