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
 * @fileoverview Controller for oppia email dashboard page.
 */

oppia.controller('EmailDashboard', [
  '$scope', '$http', function($scope, $http) {
    var QUERY_DATA_URL = '/emaildashboarddatahandler';

    // Store current cursor.
    $scope.currentCursor = null;
    // List containing all of the previous cursors.
    $scope.prevCursors = [];
    // Store next cursor.
    $scope.nextCursor = null;

    // Store all querie results fetched so far.
    // Query results are keyed on value of currentCursor at the time of fetching
    // results. Each query result stores query result and nextCursor value.
    var totalFetchedQueries = {};

    $scope.resetForm = function() {
      $scope.has_not_logged_in_for_n_days = null;
      $scope.inactive_in_last_n_days = null;
      $scope.created_at_least_n_exps = null;
      $scope.created_fewer_than_n_exps = null;
      $scope.edited_at_least_n_exps = null;
      $scope.edited_fewer_than_n_exps = null;
    };

    // Update cursor forward when fetching next set of query results.
    var updateCursorForward = function(cursor) {
      var oldCursor = $scope.currentCursor;
      $scope.currentCursor = $scope.nextCursor;
      if ($scope.currentCursor !== null) {
        $scope.prevCursors.push(oldCursor);
      }
      $scope.nextCursor = cursor;
    };

    var fetchRecentQueries = function(cursor, cursorUpdater) {
      $http.get(QUERY_DATA_URL, {
        params: {
          cursor: cursor
        }
      }).then(function(response) {
        var data = response.data;
        if (data.recent_queries.length > 0) {
          $scope.recentQueries = data.recent_queries;
          if (cursorUpdater !== null) {
            cursorUpdater(data.cursor);
          }

          // Cache query results.
          totalFetchedQueries[cursor] = {
            queries: data.recent_queries,
            nextCursor: data.cursor
          };
        }
      });
    };

    $scope.submitQuery = function() {
      var data = {
        has_not_logged_in_for_n_days: $scope.has_not_logged_in_for_n_days,
        inactive_in_last_n_days: $scope.inactive_in_last_n_days,
        created_at_least_n_exps: $scope.created_at_least_n_exps,
        created_fewer_than_n_exps: $scope.created_fewer_than_n_exps,
        edited_at_least_n_exps: $scope.edited_at_least_n_exps,
        edited_fewer_than_n_exps: $scope.edited_fewer_than_n_exps
      };

      $http.post(QUERY_DATA_URL, {
        data: data
      });
      $scope.resetForm();
      $scope.showSuccessMessage = true;
    };

    $scope.refreshRecentQueries = function() {
      // Do not update cursors if reloading current query page.
      fetchRecentQueries($scope.currentCursor);
      $scope.showSuccessMessage = false;
    };

    $scope.getNextRecentQueries = function() {
      var cursor = $scope.nextCursor;
      if (cursor in totalFetchedQueries) {
        // Load query results from cache if available.
        $scope.recentQueries = totalFetchedQueries[cursor].queries;
        updateCursorForward(totalFetchedQueries[cursor].nextCursor);
      } else {
        fetchRecentQueries($scope.nextCursor, updateCursorForward);
      }
    };

    $scope.getPreviousRecentQueries = function() {
      // Load past query results from cache.
      if ($scope.prevCursors.length > 0) {
        var prevCursor = $scope.prevCursors.pop();
        $scope.recentQueries = totalFetchedQueries[prevCursor].queries;
        $scope.currentCursor = prevCursor;
        $scope.nextCursor = totalFetchedQueries[prevCursor].nextCursor;
      }
    };
    $scope.getNextRecentQueries();
  }
]);
