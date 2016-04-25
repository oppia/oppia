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
    '$scope', '$http', '$rootScope', 'oppiaDatetimeFormatter',
    function($scope, $http, $rootScope, oppiaDatetimeFormatter) {
  $scope.getDatetimeAsString = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch);
  };

  $scope.getExplorationCreateUrl = function(explorationId) {
    return '/create/' + explorationId;
  };

  // TODO(sll): Abstract this out into a general utility function so that it
  // can be used in multiple places.
  $scope.recentCommitsCursor = null;
  $scope.reachedEndOfCommits = false;
  $scope.allCommits = [];
  // Map of exploration ids to objects containing a single key: title. Only the
  // first fetch of the data is used to populate this map, so that explorations
  // on multiple pages with the same id correspond to the same data.
  $scope.explorationData = {};
  $scope.loadMoreCommits = function() {
    if ($scope.reachedEndOfCommits) {
      return;
    }

    var recentCommitsUrl = '/recentcommitshandler/recent_commits';
    recentCommitsUrl += '?query_type=all_non_private_commits';
    if ($scope.recentCommitsCursor) {
      recentCommitsUrl += ('?cursor=' + $scope.recentCommitsCursor);
    }

    $http.get(recentCommitsUrl).then(function(response) {
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

      for (var i = 0; i < data.results.length; i++) {
        $scope.allCommits.push(data.results[i]);
      }
      $scope.recentCommitsCursor = data.cursor;
      if (!data.more) {
        $scope.reachedEndOfCommits = true;
      }
    });
  };

  $scope.loadMoreCommits();

  $scope.recentFeedbackMessagesCursor = null;
  $scope.reachedEndOfFeedbackMessages = false;
  $scope.allFeedbackMessages = [];
  $scope.loadMoreFeedbackMessages = function() {
    if ($scope.reachedEndOfFeedbackMessages) {
      return;
    }

    var recentFeedbackMessagesUrl = '/recent_feedback_messages';
    if ($scope.recentFeedbackMessagesCursor) {
      recentFeedbackMessagesUrl += (
        '?cursor=' + $scope.recentFeedbackMessagesCursor);
    }

    $http.get(recentFeedbackMessagesUrl).then(function(response) {
      var data = response.data;
      for (var i = 0; i < data.results.length; i++) {
        $scope.allFeedbackMessages.push(data.results[i]);
      }
      $scope.recentFeedbackMessagesCursor = data.cursor;
      if (!data.more) {
        $scope.reachedEndOfFeedbackMessages = true;
      }
    });
  };

  $scope.loadMoreFeedbackMessages();
}]);
