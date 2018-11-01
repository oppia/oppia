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
  '$scope', '$rootDirective', 'EmailDashboardDataService', 'UserService',
  function($scope, $rootDirective, EmailDashboardDataService, UserService) {
    $scope.username = '';
    $rootScope.loadingMessage = 'Loading';
    UserService.getUserInfoAsync().then(function(userInfo) {
      $scope.username = userInfo.getUsername();
      $rootScope.loadingMessage = '';
    });

    $scope.currentPageOfQueries = [];

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
      EmailDashboardDataService.submitQuery(data).then(function(queries) {
        $scope.currentPageOfQueries = queries;
      });
      $scope.resetForm();
      $scope.showSuccessMessage = true;
    };

    $scope.getNextPageOfQueries = function() {
      if (EmailDashboardDataService.isNextPageAvailable()) {
        EmailDashboardDataService.getNextQueries().then(function(queries) {
          $scope.currentPageOfQueries = queries;
        });
      }
    };

    $scope.getPreviousPageOfQueries = function() {
      if (EmailDashboardDataService.isPreviousPageAvailable()) {
        $scope.currentPageOfQueries = (
          EmailDashboardDataService.getPreviousQueries());
      }
    };

    $scope.showNextButton = function() {
      return EmailDashboardDataService.isNextPageAvailable();
    };

    $scope.showPreviousButton = function() {
      return EmailDashboardDataService.isPreviousPageAvailable();
    };

    $scope.recheckStatus = function(index) {
      var queryId = $scope.currentPageOfQueries[index].id;
      EmailDashboardDataService.fetchQuery(queryId).then(function(query) {
        $scope.currentPageOfQueries[index] = query;
      });
    };

    $scope.showLinkToResultPage = function(submitter, status) {
      return (submitter === $scope.username) && (status === 'completed');
    };

    EmailDashboardDataService.getNextQueries().then(function(queries) {
      $scope.currentPageOfQueries = queries;
    });
  }
]);
