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
  '$scope', '$rootScope', '$window', 'oppiaDatetimeFormatter', 'alertsService',
  'DashboardBackendApiService', 'RatingComputationService',
  'ExplorationCreationService', 'FATAL_ERROR_CODES', 'UrlInterpolationService',
  function(
      $scope, $rootScope, $window, oppiaDatetimeFormatter, alertsService,
      DashboardBackendApiService, RatingComputationService,
      ExplorationCreationService, FATAL_ERROR_CODES, UrlInterpolationService) {
    var EXP_PUBLISH_TEXTS = {
      defaultText: (
        'This exploration is private. Publish it to receive statistics.'),
      smText: 'Publish the exploration to receive statistics.'
    };

    $scope.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD = (
        GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD);
    $scope.getAverageRating = RatingComputationService.computeAverageRating;
    $scope.createNewExploration = (
      ExplorationCreationService.createNewExploration);
    $scope.getLocaleAbbreviatedDatetimeString = (
      oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);

    $scope.emptyDashboardImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/empty_dashboard.svg');

    $scope.activeTab = 'myExplorations';
    $scope.setActiveTab = function(newActiveTabName) {
      $scope.activeTab = newActiveTabName;
    };

    $scope.showExplorationEditor = function(explorationId) {
      $window.location = '/create/' + explorationId;
    };

    $scope.myExplorationsView = 'card';
    $scope.setMyExplorationsView = function(viewType) {
      $scope.myExplorationsView = viewType;
    };

    $scope.checkForMobileView = function() {
      if ($window.innerWidth < 500) {
        $scope.myExplorationsView = 'card';
        $scope.publishText = EXP_PUBLISH_TEXTS.smText;
      } else {
        $scope.publishText = EXP_PUBLISH_TEXTS.defaultText;
      }
    };

    $scope.checkForMobileView();
    angular.element($window).bind('resize', function() {
      $scope.checkForMobileView();
    });

    $rootScope.loadingMessage = 'Loading';
    DashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        $scope.explorationsList = response.explorations_list.sort(
          function(a, b) {
            return (a.title === '' ? 1 :
              b.title === '' ? -1 :
              a.title < b.title ? -1 :
              a.title > b.title ? 1 : 0);
          }
        );
        $scope.collectionsList = response.collections_list;
        $scope.dashboardStats = response.dashboard_stats;
        $scope.lastWeekStats = response.last_week_stats;
        if ($scope.dashboardStats && $scope.lastWeekStats) {
          $scope.relativeChangeInTotalPlays = (
            $scope.dashboardStats.total_plays - $scope.lastWeekStats.total_plays
          );
        }
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
