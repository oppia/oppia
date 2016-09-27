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

oppia.constant('EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'title',
  RATING: 'ratings',
  NUM_VIEWS: 'num_views',
  OPEN_FEEDBACK: 'num_open_threads',
  UNRESOLVED_ANSWERS: 'num_unresolved_answers',
  LAST_UPDATED: 'last_updated_msec'
});

oppia.constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'Title',
  RATING: 'Average Rating',
  NUM_VIEWS: 'Total Plays',
  OPEN_FEEDBACK: 'Open Feedback',
  UNRESOLVED_ANSWERS: 'Unresolved Answers',
  LAST_UPDATED: 'Last Updated'
});

oppia.controller('Dashboard', [
  '$scope', '$rootScope', '$window', 'oppiaDatetimeFormatter', 'alertsService',
  'DashboardBackendApiService', 'RatingComputationService',
  'ExplorationCreationService', 'FATAL_ERROR_CODES', 'UrlInterpolationService',
  'EXPLORATIONS_SORT_BY_KEYS', 'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS',
  function(
      $scope, $rootScope, $window, oppiaDatetimeFormatter, alertsService,
      DashboardBackendApiService, RatingComputationService,
      ExplorationCreationService, FATAL_ERROR_CODES, UrlInterpolationService,
      EXPLORATIONS_SORT_BY_KEYS, HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS) {
    var EXP_PUBLISH_TEXTS = {
      defaultText: (
        'This exploration is private. Publish it to receive statistics.'),
      smText: 'Publish the exploration to receive statistics.'
    };

    $scope.EXPLORATIONS_SORT_BY_KEYS = EXPLORATIONS_SORT_BY_KEYS;
    $scope.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS = (
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS);
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

    $scope.showCollectionEditor = function(collectionId) {
      $window.location = '/collection_editor/create/' + collectionId;
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

    $scope.setExplorationsSortingOptions = function(sortType) {
      if (sortType === $scope.currentSortType) {
        $scope.isCurrentSortDescending = !$scope.isCurrentSortDescending;
      } else {
        $scope.currentSortType = sortType;
      }
    };

    $scope.sortByFunction = function(entity) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting explorations.
      var value = entity[$scope.currentSortType];
      var DEFAULT_TEXT_EMPTY_TITLE = 'Untitled';
      if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.TITLE) {
        if (!value) {
          return DEFAULT_TEXT_EMPTY_TITLE;
        }
      } else if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.RATING) {
        if (!$scope.getAverageRating(value)) {
          return (
            $scope.isCurrentSortDescending ?
              (-1 * $scope.explorationsList.indexOf(entity)) :
              $scope.explorationsList.indexOf(entity));
        }
        return $scope.getAverageRating(value);
      } else if (!value) {
        return ($scope.isCurrentSortDescending ?
                (-1 * $scope.explorationsList.indexOf(entity)) :
                $scope.explorationsList.indexOf(entity));
      }
      return value;
    };

    $rootScope.loadingMessage = 'Loading';
    DashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        $scope.currentSortType = EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK;
        $scope.isCurrentSortDescending = true;
        $scope.explorationsList = response.explorations_list;
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
