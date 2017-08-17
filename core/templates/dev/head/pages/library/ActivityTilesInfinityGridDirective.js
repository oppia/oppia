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

oppia.directive('activityTilesInfinityGrid', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        learnerDashboardActivityIds: '=learnerDashboardActivityIds',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/library/' +
        'activity_tiles_infinity_grid_directive.html'),
      controller: [
        '$scope', '$rootScope', '$http', 'searchService', 'alertsService',
        '$modal', function(
          $scope, $rootScope, $http, searchService, alertsService, $modal) {
          $scope.endOfPageIsReached = false;
          $scope.allActivitiesInOrder = [];
          var hoverOverActivity = false;
          var activeActivityId = '';

          // Called when the first batch of search results is retrieved from the
          // server.
          $scope.$on(
            'initialSearchResultsLoaded', function(evt, activityList) {
              $scope.allActivitiesInOrder = activityList;
              $scope.endOfPageIsReached = false;
            }
          );

          $scope.setHoverOverActivity = function(activityId) {
            activeActivityId = activityId;
            hoverOverActivity = !hoverOverActivity;
          };

          $scope.showAddToLearnerPlaylistIcon = function(activityId) {
            var incompleteExplorationIds = (
              $scope.learnerDashboardActivityIds.incomplete_exploration_ids);
            var incompleteCollectionIds = (
              $scope.learnerDashboardActivityIds.incomplete_collection_ids);
            var completedExplorationIds = (
              $scope.learnerDashboardActivityIds.completed_exploration_ids);
            var completedCollectionIds = (
              $scope.learnerDashboardActivityIds.completed_collection_ids);
            var explorationPlaylistIds = (
              $scope.learnerDashboardActivityIds.exploration_playlist_ids);
            var collectionPlaylistIds = (
              $scope.learnerDashboardActivityIds.collection_playlist_ids);

            if (incompleteExplorationIds.indexOf(activityId) !== -1 ||
                incompleteCollectionIds.indexOf(activityId) !== -1 ||
                completedExplorationIds.indexOf(activityId) !== -1 ||
                completedCollectionIds.indexOf(activityId) !== -1 ||
                explorationPlaylistIds.indexOf(activityId) !== -1 ||
                collectionPlaylistIds.indexOf(activityId) !== -1) {
              return false;
            } else {
              return hoverOverActivity && (activeActivityId == activityId);
            }
          };

          $scope.addToLearnerPlaylist = function(activityType, activityId) {
            var addActivityToLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                  activityType: activityType,
                  activityId: activityId
                }));
            $http.post(addActivityToLearnerPlaylistUrl, {})
              .then(function(response) {
                if (response.data.belongs_to_completed_or_incomplete_list) {
                  alertsService.addInfoMessage(
                    'You have already completed or are completing this ' +
                    ' activity.');
                } else if (response.data.belongs_to_subscribed_activities) {
                  alertsService.addInfoMessage(
                    'This is present in your creator dashboard');
                } else if (response.data.playlist_limit_exceeded) {
                  alertsService.addInfoMessage(
                    'Your \'Play Later\' list is full!  Either you can complete ' +
                    'some or you can head to the learner dashboard and remove '+
                    'some.');
                } else {
                  alertsService.addSuccessMessage(
                    'Succesfully added to your \'Play Later\' list.');
                }
              });

            if (activityType == constants.ACTIVITY_TYPE_EXPLORATION) {
              $scope.learnerDashboardActivityIds.exploration_playlist_ids.push(
                activityId);
            } else {
              $scope.learnerDashboardActivityIds.collection_playlist_ids.push(
                activityId);
            }
          };

          $scope.removeFromLearnerPlaylist = function(
            activityId, activityType, activityTitle) {
            $modal.open({
              templateUrl: 'modals/removeActivity',
              backdrop: true,
              resolve: {
                activityId: function() {
                  return activityId;
                },
                activityType: function() {
                  return activityType;
                },
                activityTitle: function() {
                  return activityTitle;
                }
              },
              controller: [
                '$scope', '$modalInstance', '$http', 'UrlInterpolationService',
                function(
                  $scope, $modalInstance, $http, UrlInterpolationService) {
                  $scope.sectionNameI18nId = (
                    'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                  $scope.activityTitle = activityTitle;
                  var removeFromLearnerPlaylistUrl = (
                    /* eslint-disable max-len */
                    UrlInterpolationService.interpolateUrl(
                      '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                        activityType: activityType,
                        activityId: activityId
                      }));
                    /* eslint-enable max-len */
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
              if (activityType == constants.ACTIVITY_TYPE_EXPLORATION) {
                /* eslint-disable max-len */
                var index = (
                  $scope.learnerDashboardActivityIds.exploration_playlist_ids.indexOf(
                    activityId));
                if (index !== -1) {
                  $scope.learnerDashboardActivityIds.exploration_playlist_ids.splice(
                    index, 1);
                }
              } else {
                var index = (
                  $scope.learnerDashboardActivityIds.collection_playlist_ids.indexOf(
                    activityId));
                if (index !== -1) {
                  $scope.learnerDashboardActivityIds.collection_playlist_ids.splice(
                    index, 1);
                }
              }
              /* eslint-enable max-len */
            });
          };

          $scope.showMoreActivities = function() {
            if (!$rootScope.loadingMessage && !$scope.endOfPageIsReached) {
              $scope.searchResultsAreLoading = true;
              searchService.loadMoreData(function(data, endOfPageIsReached) {
                $scope.allActivitiesInOrder =
                $scope.allActivitiesInOrder.concat(
                  data.activity_list);
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
