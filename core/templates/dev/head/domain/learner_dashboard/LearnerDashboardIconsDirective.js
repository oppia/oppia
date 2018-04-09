// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for showing learner dashboard icons.
 */

oppia.directive('learnerDashboardIcons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getActivityType: '&activityType',
        getActivityId: '&activityId',
        getActivityTitle: '&activityTitle',
        activityActive: '=activityActive',
        isContainerNarrow: '&containerIsNarrow',
        shouldAddToPlaylistIcon: '&shouldShowAddToPlaylistIcon'
      },
      templateUrl:  UrlInterpolationService.getDirectiveTemplateUrl(
        '/domain/learner_dashboard/' +
        'learner_dashboard_icons_directive.html'),
      controller: [
        '$scope', 'LearnerDashboardIdsBackendApiService',
        'LearnerDashboardActivityIdsObjectFactory',
        'LearnerPlaylistService',
        function(
            $scope, LearnerDashboardIdsBackendApiService,
            LearnerDashboardActivityIdsObjectFactory,
            LearnerPlaylistService) {
          $scope.activityIsCurrentlyHoveredOver = true;
          $scope.playlistTooltipIsEnabled = false;
          $scope.enablePlaylistTooltip = function() {
            $scope.playlistTooltipIsEnabled = true;
          };

          $scope.disablePlaylistTooltip = function() {
            $scope.playlistTooltipIsEnabled = false;
          };

          $scope.$watch('activityActive', function(value) {
            $scope.activityIsCurrentlyHoveredOver = $scope.activityActive;
          });

          LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
            function(response) {
              $scope.learnerDashboardActivityIds = (
                LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
                  response.data.learner_dashboard_activity_ids));
            }
          );

          $scope.setHoverState = function(hoverState) {
            $scope.activityIsCurrentlyHoveredOver = hoverState;
          };

          $scope.canActivityBeAddedToLearnerPlaylist = function(activityId) {
            if ($scope.learnerDashboardActivityIds) {
              if ($scope.learnerDashboardActivityIds.includesActivity(
                activityId)) {
                return false;
              } else {
                if ($scope.isContainerNarrow()) {
                  return true;
                } else {
                  return $scope.activityIsCurrentlyHoveredOver;
                }
              }
            }
          };

          $scope.belongsToLearnerPlaylist = function() {
            var activityType = $scope.getActivityType();
            if ($scope.learnerDashboardActivityIds) {
              /* eslint-disable max-len */
              if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToExplorationPlaylist(
                    $scope.getActivityId()));
              } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToCollectionPlaylist(
                    $scope.getActivityId()));
              }
              /* eslint-enable max-len */
            }
          };

          $scope.belongsToCompletedActivities = function() {
            var activityType = $scope.getActivityType();
            if ($scope.learnerDashboardActivityIds) {
              /* eslint-disable max-len */
              if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToCompletedExplorations(
                    $scope.getActivityId()));
              } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToCompletedCollections(
                    $scope.getActivityId()));
              }
              /* eslint-enable max-len */
            }
          };

          $scope.belongsToIncompleteActivities = function() {
            var activityType = $scope.getActivityType();
            if ($scope.learnerDashboardActivityIds) {
              /* eslint-disable max-len */
              if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToIncompleteExplorations(
                    $scope.getActivityId()));
              } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                return (
                  $scope.learnerDashboardActivityIds.belongsToIncompleteCollections(
                    $scope.getActivityId()));
              }
              /* eslint-enable max-len */
            }
          };

          $scope.addToLearnerPlaylist = function(activityId, activityType) {
            var isSuccessfullyAdded = (
              LearnerPlaylistService.addToLearnerPlaylist(
                activityId, activityType));
            if (isSuccessfullyAdded) {
              if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                /* eslint-disable max-len */
                $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
                  activityId);
                /* eslint-enable max-len */
              } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                /* eslint-disable max-len */
                $scope.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
                  activityId);
                /* eslint-enable max-len */
              }
              $scope.disablePlaylistTooltip();
            }
          };

          $scope.removeFromLearnerPlaylist = function(
              activityId, activityTitle, activityType) {
            var isSuccessfullyRemoved = (
              LearnerPlaylistService.removeFromLearnerPlaylist(
                activityId, activityTitle, activityType,
                $scope.learnerDashboardActivityIds));
          };
        }
      ]
    };
  }]);
