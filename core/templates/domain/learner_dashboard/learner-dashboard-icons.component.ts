// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for showing learner dashboard icons.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { LearnerDashboardIdsBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerPlaylistService } from
  'domain/learner_dashboard/learner-playlist-backend-api.service';

@Component({
  selector: 'learner-dashboard-icons',
  templateUrl: './learner-dashboard-icons.component.html',
})
export class LearnerDashboardIconsComponent {
  activityIsCurrentlyHoveredOver: boolean = true;
  playlistTooltipIsEnabled: boolean = false;

  @Input() activityType: string;
  @Input() activityId: string;
  @Input() activityTitle: string;
  @Input() activityActive: string;
  @Input() isContainerNarrow: boolean;
  @Input() isAddToPlaylistIconShown: boolean;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private alertsService: AlertsService,
    private learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService,
    private learnerPlaylistService: LearnerPlaylistService

  ) {}

  enablePlaylistTooltip() {
    this.playlistTooltipIsEnabled = true;
  };

  disablePlaylistTooltip() {
    this.playlistTooltipIsEnabled = false;
  };

}



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
        'learner-dashboard-icons.component.html'),
      controller: [
        '$scope', 'LearnerDashboardIdsBackendApiService',
        'LearnerPlaylistService', 'ACTIVITY_TYPE_COLLECTION',
        'ACTIVITY_TYPE_EXPLORATION',
        function(
            $scope, LearnerDashboardIdsBackendApiService,
            LearnerPlaylistService, ACTIVITY_TYPE_COLLECTION,
            ACTIVITY_TYPE_EXPLORATION) {


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

          $scope.removeFromLearnerPlaylist = function(activityId, activityTitle, activityType) {
            console.log(activityId,activityTitle,activityType);
            LearnerPlaylistService.removeFromLearnerPlaylist(activityId,activityTitle,activityType);
            // var isSuccessfullyAdded = (
            //   LearnerPlaylistService.addToLearnerPlaylist(
            //     activityId, activityType));
            // if (isSuccessfullyAdded) {
            //   if (activityType === ACTIVITY_TYPE_EXPLORATION) {
            //     /* eslint-disable-next-line max-len */
            //     $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
            //       activityId);
            //   } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
            //     /* eslint-disable-next-line max-len */
            //     $scope.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
            //       activityId);
            //   }
            //   $scope.disablePlaylistTooltip();
            //   $scope.$apply();
            // }
          };
        }
      ]
    };
  }]);
