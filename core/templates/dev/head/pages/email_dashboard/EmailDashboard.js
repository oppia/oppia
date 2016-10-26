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
 * @fileoverview Controller and factory for oppia email dashboard page.
 */

oppia.factory('EmailDashboardDataService', [
  '$http', function($http) {
    var QUERY_DATA_URL = '/emaildashboarddatahandler';
    var QUERY_STATUS_CHECK_URL = '/querystatuscheck';

    // No. of query results to display on a single page.
    var QUERIES_PER_PAGE = 10;
    // Store latest cursor value for fetching next query page.
    var latestCursor = null;
    // Cache all fetched queries.
    var queries = [];
    // Index of currently showing page of query results.
    var currentPageIndex = -1;

    var fetchQueries = function() {
      return $http.get(QUERY_DATA_URL, {
        params: {
          cursor: latestCursor
        }
      }).then(function(response) {
        return response.data;
      });
    };

    return {
      submitQuery: function(data, callback) {
        $http.post(QUERY_DATA_URL, {
          data: data
        });

        var startQueryIndex = (currentPageIndex) * QUERIES_PER_PAGE;
        var endQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
        fetchQueries().then(function(data) {
          newQueries = [data.recent_queries[0]];
          queries = newQueries.concat(queries);
          callback(queries.slice(startQueryIndex, endQueryIndex));
        });
      },

      getNextQueries: function(callback) {
        var startQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
        var endQueryIndex = (currentPageIndex + 2) * QUERIES_PER_PAGE;
        currentPageIndex = currentPageIndex + 1;

        if (queries.length > startQueryIndex) {
          callback(queries.slice(startQueryIndex, endQueryIndex));
        } else {
          fetchQueries().then(function(data) {
            queries = queries.concat(data.recent_queries);
            latestCursor = data.cursor;
            callback(queries.slice(startQueryIndex, endQueryIndex));
          });
        }
      },

      getPreviousQueries: function() {
        var startQueryIndex = (currentPageIndex - 1) * QUERIES_PER_PAGE;
        var endQueryIndex = (currentPageIndex) * QUERIES_PER_PAGE;
        currentPageIndex = currentPageIndex - 1;
        return queries.slice(startQueryIndex, endQueryIndex);
      },

      isNextPageAvailable: function() {
        var nextQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
        return !(queries.length <= nextQueryIndex) || Boolean(latestCursor);
      },

      isPreviousPageAvailable: function() {
        return (currentPageIndex > 0);
      },

      recheckQueryStatus: function(index, callback) {
        var queryIndex = (currentPageIndex) * QUERIES_PER_PAGE + index;
        var query = queries[queryIndex];
        $http.get(QUERY_STATUS_CHECK_URL, {
          params: {
            query_id: query.id
          }
        }).then(function(response) {
          var data = response.data;
          query = data.query;
          callback(index, query);
        });
      }
    };
  }
]);

oppia.controller('EmailDashboard', [
  '$scope', '$http', 'EmailDashboardDataService',
  function($scope, $http, EmailDashboardDataService) {
    $scope.recentQueries = [];

    var updateRecentQueries = function(queries) {
      $scope.recentQueries = queries;
    };

    var setQueryStatus = function(index, query) {
      $scope.recentQueries[index] = query;
    };

    $scope.resetForm = function() {
      $scope.has_not_logged_in_for_n_days = null;
      $scope.inactive_in_last_n_days = null;
      $scope.created_at_least_n_exps = null;
      $scope.created_fewer_than_n_exps = null;
      $scope.edited_at_least_n_exps = null;
      $scope.edited_fewer_than_n_exps = null;
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
      EmailDashboardDataService.submitQuery(data, updateRecentQueries);
      $scope.resetForm();
      $scope.showSuccessMessage = true;
    };

    $scope.getNextRecentQueries = function() {
      if (EmailDashboardDataService.isNextPageAvailable()) {
        EmailDashboardDataService.getNextQueries(updateRecentQueries);
      }
    };

    $scope.getPreviousRecentQueries = function() {
      if (EmailDashboardDataService.isPreviousPageAvailable()) {
        $scope.recentQueries = EmailDashboardDataService.getPreviousQueries();
      }
    };

    $scope.showNextButton = function() {
      return EmailDashboardDataService.isNextPageAvailable();
    };

    $scope.showPreviousButton = function() {
      return EmailDashboardDataService.isPreviousPageAvailable();
    };

    $scope.recheckStatus = function(index) {
      EmailDashboardDataService.recheckQueryStatus(index, setQueryStatus);
    };
    EmailDashboardDataService.getNextQueries(updateRecentQueries);
  }
]);
