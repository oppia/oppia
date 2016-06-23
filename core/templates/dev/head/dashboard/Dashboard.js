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
 * @fileoverview Controllers for the creator dashboard.
 */

oppia.controller('Dashboard', [
  '$scope', '$rootScope', 'oppiaDatetimeFormatter', 'alertsService',
  'DashboardBackendApiService', 'RatingComputationService',
  'ExplorationCreationService', 'FATAL_ERROR_CODES',
  function(
    $scope, $rootScope, oppiaDatetimeFormatter, alertsService,
    DashboardBackendApiService, RatingComputationService,
    ExplorationCreationService, FATAL_ERROR_CODES) {
    $scope.getAverageRating = RatingComputationService.computeAverageRating;
    $scope.createNewExploration = (
      ExplorationCreationService.createNewExploration);
    $scope.getLocaleAbbreviatedDatetimeString = (
      oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);

    $scope.activeTab = 'myExplorations';
    $scope.setActiveTab = function(newActiveTabName) {
      $scope.activeTab = newActiveTabName;
    };

    $rootScope.loadingMessage = 'Loading';
    DashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        $scope.explorationsList = response.explorations_list;
        $scope.collectionsList = response.collections_list;
        $scope.dashboardStats = response.dashboard_stats;
        $rootScope.loadingMessage = '';
      },
      function(errorStatus) {
        if (FATAL_ERROR_CODES.indexOf(errorStatus) !== -1) {
          alertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }
]);
