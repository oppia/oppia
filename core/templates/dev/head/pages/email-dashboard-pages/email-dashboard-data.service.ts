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
 * @fileoverview Services for oppia email dashboard page.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('EmailDashboardDataService', [
  '$http', '$q', function($http, $q) {
    var QUERY_DATA_URL = '/emaildashboarddatahandler';
    var QUERY_STATUS_CHECK_URL = '/querystatuscheck';
    // No. of query results to display on a single page.
    var QUERIES_PER_PAGE = 10;
    // Store latest cursor value for fetching next query page.
    var latestCursor = null;
    // Array containing all fetched queries.
    var queries = [];
    // Index of currently-shown page of query results.
    var currentPageIndex = -1;

    var fetchQueriesPage = function(pageSize, cursor) {
      return $http.get(QUERY_DATA_URL, {
        params: {
          num_queries_to_fetch: pageSize,
          cursor: cursor
        }
      }).then(function(response) {
        return response.data;
      });
    };

    return {
      getQueries: function() {
        return queries;
      },

      getCurrentPageIndex: function() {
        return currentPageIndex;
      },

      getLatestCursor: function() {
        return latestCursor;
      },

      submitQuery: function(data) {
        var startQueryIndex = currentPageIndex * QUERIES_PER_PAGE;
        var endQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;

        return $http.post(QUERY_DATA_URL, {
          data: data
        }).then(function(response) {
          var data = response.data;
          var newQueries = [data.query];
          queries = newQueries.concat(queries);
          return queries.slice(startQueryIndex, endQueryIndex);
        });
      },

      getNextQueries: function() {
        var startQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
        var endQueryIndex = (currentPageIndex + 2) * QUERIES_PER_PAGE;

        if (queries.length >= endQueryIndex ||
            (latestCursor === null && currentPageIndex !== -1)) {
          currentPageIndex = currentPageIndex + 1;
          return $q(function(resolver) {
            resolver(queries.slice(startQueryIndex, endQueryIndex));
          });
        } else {
          currentPageIndex = currentPageIndex + 1;
          return fetchQueriesPage(QUERIES_PER_PAGE, latestCursor)
            .then(function(data) {
              queries = queries.concat(data.recent_queries);
              latestCursor = data.cursor;
              return queries.slice(startQueryIndex, endQueryIndex);
            });
        }
      },

      getPreviousQueries: function() {
        var startQueryIndex = (currentPageIndex - 1) * QUERIES_PER_PAGE;
        var endQueryIndex = currentPageIndex * QUERIES_PER_PAGE;
        currentPageIndex = currentPageIndex - 1;
        return queries.slice(startQueryIndex, endQueryIndex);
      },

      isNextPageAvailable: function() {
        var nextQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
        return (queries.length > nextQueryIndex) || Boolean(latestCursor);
      },

      isPreviousPageAvailable: function() {
        return (currentPageIndex > 0);
      },

      fetchQuery: function(queryId) {
        return $http.get(QUERY_STATUS_CHECK_URL, {
          params: {
            query_id: queryId
          }
        }).then(function(response) {
          var data = response.data;
          queries.forEach(function(query, index, queries) {
            if (query.id === queryId) {
              queries[index] = data.query;
            }
          });
          return data.query;
        });
      }
    };
  }
]);
