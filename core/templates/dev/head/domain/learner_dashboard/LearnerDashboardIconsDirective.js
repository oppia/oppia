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
        activityActive: '=activityActive'
      },
      templateUrl:  UrlInterpolationService.getDirectiveTemplateUrl(
        '/domain/learner_dashboard/' +
        'learner_dashboard_icons_directive.html'),
      controller: [
        '$scope', 'LearnerDashboardIdsBackendApiService',
        'LearnerDashboardActivityIdsObjectFactory',
        'LearnerPlaylistService',
        function($scope, LearnerDashboardIdsBackendApiService,
                 LearnerDashboardActivityIdsObjectFactory,
                 LearnerPlaylistService) {
          $scope.activityIsActive = true;

          $scope.$watch('activityActive', function(value) {
            $scope.activityIsActive = !$scope.activityIsActive;
          });

          LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
            function(response) {
              $scope.learnerDashboardActivityIds = (
                LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
                  response.data.learner_dashboard_activity_ids));
            }
          );

          $scope.toggleActivityIsActive = function(activityId) {
            $scope.activityIsActive = !$scope.activityIsActive;
          };

          $scope.canActivityBeAddedToLearnerPlaylist = function(
            activityId) {
            if ($scope.learnerDashboardActivityIds) {
              if ($scope.learnerDashboardActivityIds.belongsToLearnerDashboardActivities(activityId)) {
                return false;
              } else {
                return $scope.activityIsActive;
              }
            }
          };

          $scope.addToLearnerPlaylist = function(activityId, activityType) {
            var isSuccessfullyAdded = (
              LearnerPlaylistService.addToLearnerPlaylist(
                activityId, activityType));
            if (isSuccessfullyAdded) {
              $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(activityId);
            }
          };

          $scope.removeFromLearnerPlaylist = function(
            activityId, activityTitle, activityType) {
            var isSuccessfullyRemoved = (
              LearnerPlaylistService.removeFromLearnerPlaylist(
                activityId, activityTitle,
                activityType,
                $scope.learnerDashboardActivityIds));
          };
        }
      ]
    };
  }]);
