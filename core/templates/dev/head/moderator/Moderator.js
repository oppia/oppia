// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Data and controllers for the Oppia moderator page.
*/

oppia.controller('Moderator', [
  '$scope', '$http', '$rootScope', 'oppiaDatetimeFormatter', 'alertsService',
  function($scope, $http, $rootScope, oppiaDatetimeFormatter, alertsService) {
    $scope.getDatetimeAsString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.getExplorationCreateUrl = function(explorationId) {
      return '/create/' + explorationId;
    };

    $scope.getActivityCreateUrl = function(activityId) {
      var prefix = activityId.substring(0, 2);
      var suffix = activityId.substring(2);
      return (
        (prefix === 'e:' ? '/create/' : '/create_collection/') + suffix);
    };

    $scope.allCommits = [];
    $scope.allFeedbackMessages = [];
    $scope.displayedFeaturedActivityIds = [];
    $scope.lastSavedFeaturedActivityIds = [];
    // Map of exploration ids to objects containing a single key: title.
    $scope.explorationData = {};
    $scope.FEATURED_ACTIVITY_IDS_SCHEMA = {
      type: 'list',
      items: {
        type: 'unicode'
      }
    };

    var RECENT_COMMITS_URL = (
      '/recentcommitshandler/recent_commits' +
      '?query_type=all_non_private_commits');
    $http.get(RECENT_COMMITS_URL).then(function(response) {
      // Update the explorationData object with information about newly-
      // discovered explorations.
      var data = response.data;
      var explorationIdsToExplorationData = data.exp_ids_to_exp_data;
      for (var expId in explorationIdsToExplorationData) {
        if (!$scope.explorationData.hasOwnProperty(expId)) {
          $scope.explorationData[expId] = (
            explorationIdsToExplorationData[expId]);
        }
      }
      $scope.allCommits = data.results;
    });

    $http.get('/recent_feedback_messages').then(function(response) {
      $scope.allFeedbackMessages = response.data.results;
    });

    $http.get('/moderatorhandler/featured').then(function(response) {
      $scope.displayedFeaturedActivityIds = (
        response.data.featured_activity_ids);
      $scope.lastSavedFeaturedActivityIds = angular.copy(
        $scope.displayedFeaturedActivityIds);
    });

    $scope.isSaveFeaturedActivitiesButtonDisabled = function() {
      return angular.equals(
        $scope.displayedFeaturedActivityIds,
        $scope.lastSavedFeaturedActivityIds);
    };

    $scope.saveFeaturedActivityIds = function() {
      alertsService.clearWarnings();

      var activityIdsToSave = angular.copy(
        $scope.displayedFeaturedActivityIds);
      $http.post('/moderatorhandler/featured', {
        featured_activity_ids: activityIdsToSave
      }).then(function() {
        $scope.lastSavedFeaturedActivityIds = angular.copy(activityIdsToSave);
      });
    };
  }
]);
