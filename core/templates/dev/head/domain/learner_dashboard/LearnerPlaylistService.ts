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
 * @fileoverview Service related to the learner playlist.
 */

oppia.factory('LearnerPlaylistService', [
  '$http', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($http, $uibModal, AlertsService, UrlInterpolationService) {
    var _addToLearnerPlaylist = function(activityId, activityType) {
      var successfullyAdded = true;
      var addToLearnerPlaylistUrl = (
        UrlInterpolationService.interpolateUrl(
          '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
            activityType: activityType,
            activityId: activityId
          }));
      $http.post(addToLearnerPlaylistUrl, {})
        .then(function(response) {
          if (response.data.belongs_to_completed_or_incomplete_list) {
            successfullyAdded = false;
            AlertsService.addInfoMessage(
              'You have already completed or are completing this ' +
              'activity.');
          }
          if (response.data.belongs_to_subscribed_activities) {
            successfullyAdded = false;
            AlertsService.addInfoMessage(
              'This is present in your creator dashboard');
          }
          if (response.data.playlist_limit_exceeded) {
            successfullyAdded = false;
            AlertsService.addInfoMessage(
              'Your \'Play Later\' list is full!  Either you can ' +
              'complete some or you can head to the learner dashboard ' +
              'and remove some.');
          }
          if (successfullyAdded) {
            AlertsService.addSuccessMessage(
              'Successfully added to your \'Play Later\' list.');
          }
        });
      return successfullyAdded;
    };

    var _removeFromLearnerPlaylist = function(
        activityId, activityTitle, activityType, learnerDashboardActivityIds) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/learner_dashboard/' +
          'remove_activity_from_learner_dashboard_modal_directive.html'),
        backdrop: true,
        resolve: {
          activityId: function() {
            return activityId;
          },
          activityTitle: function() {
            return activityTitle;
          }
        },
        controller: [
          '$scope', '$uibModalInstance', '$http', 'UrlInterpolationService',
          function($scope, $uibModalInstance, $http, UrlInterpolationService) {
            $scope.sectionNameI18nId = (
              'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
            $scope.activityTitle = activityTitle;
            var removeFromLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/' +
                '<activityType>/<activityId>', {
                  activityType: activityType,
                  activityId: activityId
                }));
            $scope.remove = function() {
              $http['delete'](removeFromLearnerPlaylistUrl);
              $uibModalInstance.close();
            };

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function() {
        if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
          learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(
            activityId);
        } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
          learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(
            activityId);
        }
      });
    };

    return {
      addToLearnerPlaylist: _addToLearnerPlaylist,
      removeFromLearnerPlaylist: _removeFromLearnerPlaylist
    };
  }]);
