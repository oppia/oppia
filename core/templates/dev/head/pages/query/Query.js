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
 * @fileoverview Data and controllers for the Oppia admin page.
 */

oppia.controller('Query', [
  '$scope', '$http', function($scope, $http) {
    _QUERY_DATA_URL = '/querydatahandler';

    var _validate = function(data) {
      return !isNaN(data) || data === null;
    };
    $scope.recentQueryOffset = 0;
    var _baseOffset = 10;

    $scope.submitQuery = function() {
      if (_validate($scope.has_not_logged_in_for_n_days) &&
          _validate($scope.inactive_in_last_n_days) &&
          _validate($scope.created_at_least_n_exps) &&
          _validate($scope.created_fewer_than_n_exps) &&
          _validate($scope.edited_at_least_n_exps) &&
          _validate($scope.edited_fewer_than_n_exps)) {
        data = {
          has_not_logged_in_for_n_days: $scope.has_not_logged_in_for_n_days,
          inactive_in_last_n_days: $scope.inactive_in_last_n_days,
          created_at_least_n_exps: $scope.created_at_least_n_exps,
          created_fewer_than_n_exps: $scope.created_fewer_than_n_exps,
          edited_at_least_n_exps: $scope.edited_at_least_n_exps,
          edited_fewer_than_n_exps: $scope.edited_fewer_than_n_exps
        };

        $http.post(_QUERY_DATA_URL, {
          data: data
        });
        $scope.showSuccessMessage = true;
      } else {
        $scope.showWarning = true;
      }
    };

    var _fetchRecentQueries = function(offset) {
      $http.get(_QUERY_DATA_URL, {
        params: {
          offset: offset,
          base_offset: _baseOffset
        }
      }).then(function(response) {
        var data = response.data;
        if (data.recent_queries.length > 0) {
          $scope.recentQueries = data.recent_queries;
          $scope.displayRecentQueries = data.recent_queries.length;
          $scope.recentQueryOffset = offset;
        }
      });
    };

    $scope.refreshRecentQueries = function() {
      _fetchRecentQueries($scope.recentQueryOffset);
      $scope.showSuccessMessage = false;
    };

    $scope.nextRecentQueries = function() {
      var offset = $scope.recentQueryOffset + _baseOffset;
      _fetchRecentQueries(offset);
    };

    $scope.previousRecentQueries = function() {
      var offset = (($scope.recentQueryOffset - _baseOffset < 0) ? 0 :
        ($scope.recentQueryOffset - _baseOffset));
      _fetchRecentQueries(offset);
    };

    $scope.refreshRecentQueries();
  }
]);
