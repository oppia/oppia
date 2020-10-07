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

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('learnerDashboardIcons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getActivityType: '&activityType',
        getActivityId: '&activityId',
        getActivityTitle: '&activityTitle',
        activityActive: '=activityActive',
        isContainerNarrow: '&containerIsNarrow',
        isAddToPlaylistIconShown: '&addToPlaylistIconIsShown'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/domain/learner_dashboard/' +
        'learner-dashboard-icons.directive.html'),
      controller: [
        '$scope', 'LearnerDashboardIdsBackendApiService',
        'LearnerPlaylistService', 'ACTIVITY_TYPE_COLLECTION',
        'ACTIVITY_TYPE_EXPLORATION',
        function(
            $scope, LearnerDashboardIdsBackendApiService,
            LearnerPlaylistService, ACTIVITY_TYPE_COLLECTION,
            ACTIVITY_TYPE_EXPLORATION) {
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

          /* eslint-disable-next-line max-len */
          LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIdsAsync().then(
            function(learnerDashboardActivityIds) {
              $scope.learnerDashboardActivityIds = learnerDashboardActivityIds;
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
              if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                return (
                  /* eslint-disable-next-line max-len */
                  $scope.learnerDashboardActivityIds.belongsToExplorationPlaylist(
                    $scope.getActivityId()));
              } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                return (
                  /* eslint-disable-next-line max-len */
                  $scope.learnerDashboardActivityIds.belongsToCollectionPlaylist(
                    $scope.getActivityId()));
              }
            }
          };

          $scope.belongsToCompletedActivities = function() {
            var activityType = $scope.getActivityType();
            if ($scope.learnerDashboardActivityIds) {
              if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                return (
                  // eslint-disable-next-line max-len
                  $scope.learnerDashboardActivityIds.belongsToCompletedExplorations(
                    $scope.getActivityId()));
              } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                return (
                  // eslint-disable-next-line max-len
                  $scope.learnerDashboardActivityIds.belongsToCompletedCollections(
                    $scope.getActivityId()));
              }
            }
          };

          $scope.belongsToIncompleteActivities = function() {
            var activityType = $scope.getActivityType();
            if ($scope.learnerDashboardActivityIds) {
              if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                return (
                  // eslint-disable-next-line max-len
                  $scope.learnerDashboardActivityIds.belongsToIncompleteExplorations(
                    $scope.getActivityId()));
              } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                return (
                  // eslint-disable-next-line max-len
                  $scope.learnerDashboardActivityIds.belongsToIncompleteCollections(
                    $scope.getActivityId()));
              }
            }
          };

          $scope.addToLearnerPlaylist = function(activityId, activityType) {
            var isSuccessfullyAdded = (
              LearnerPlaylistService.addToLearnerPlaylist(
                activityId, activityType));
            if (isSuccessfullyAdded) {
              if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                /* eslint-disable-next-line max-len */
                $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
                  activityId);
              } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                /* eslint-disable-next-line max-len */
                $scope.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
                  activityId);
              }
              $scope.disablePlaylistTooltip();
            }
          };
        }
      ]
    };
  }]);
