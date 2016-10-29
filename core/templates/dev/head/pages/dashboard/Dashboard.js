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

oppia.constant('EXPLORATION_DROPDOWN_STATS', {
  OPEN_FEEDBACK: 'open_feedback',
  TOP_UNRESOLVED_ANSWERS: 'top_unresolved_answers'
});

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
  'ExplorationCreationService', 'UrlInterpolationService', 'FATAL_ERROR_CODES',
  'EXPLORATION_DROPDOWN_STATS', 'EXPLORATIONS_SORT_BY_KEYS',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS',
  function(
      $scope, $rootScope, $window, oppiaDatetimeFormatter, alertsService,
      DashboardBackendApiService, RatingComputationService,
      ExplorationCreationService, UrlInterpolationService, FATAL_ERROR_CODES,
      EXPLORATION_DROPDOWN_STATS, EXPLORATIONS_SORT_BY_KEYS,
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS) {
    var EXP_PUBLISH_TEXTS = {
      defaultText: (
        'This exploration is private. Publish it to receive statistics.'),
      smText: 'Publish the exploration to receive statistics.'
    };

    $scope.explorationStats = {};
    $scope.activeExplorationId = '';
    // Keeps track of the sub-dropdown that is opened in the main exploration
    // dropdown.
    $scope.activeSubDropdown = '';

    $scope.EXPLORATION_DROPDOWN_STATS = EXPLORATION_DROPDOWN_STATS;
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

    $scope.getExplorationUrl = function(explorationId) {
      return '/create/' + explorationId;
    };

    $scope.getCollectionUrl = function(collectionId) {
      return '/collection_editor/create/' + collectionId;
    };

    $scope.getStatsForNonPrivateExp = function(status, explorationId) {
      if (status !== 'private') {
        DashboardBackendApiService.fetchExplorationStats(explorationId).then(
          function(response) {
            $scope.explorationStats[explorationId] = response.data;
          }, function(errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
              alertsService.addWarning(
                'Failed to get statistics for this exploration');
            }
          }
        );
        $scope.activeSubDropdown = '';
        $scope.activeExplorationId = (
          ($scope.activeExplorationId === explorationId) ? '' : explorationId);
      }
    };

    $scope.myExplorationsView = 'card';
    $scope.setMyExplorationsView = function(viewType) {
      $scope.myExplorationsView = viewType;
    };

    $scope.checkMobileView = function() {
      return ($window.innerWidth < 500);
    };

    $scope.updatesGivenScreenWidth = function() {
      if ($scope.checkMobileView()) {
        $scope.myExplorationsView = 'card';
        $scope.publishText = EXP_PUBLISH_TEXTS.smText;
      } else {
        $scope.publishText = EXP_PUBLISH_TEXTS.defaultText;
      }
    };

    $scope.activeExplorationIdOnMobile = function(explorationId) {
      return ($scope.checkMobileView() &&
              $scope.activeExplorationId === explorationId);
    };

    $scope.updatesGivenScreenWidth();
    angular.element($window).bind('resize', function() {
      $scope.updatesGivenScreenWidth();
    });

    // Used to toggle between the sub dropdowns that appear for displaying
    // statistics within the main dropdown for an exploration. The argument
    // 'type' can take values out of values of EXPLORATION_DROPDOWN_STATS.
    $scope.toggleSubDropdown = function(type, event) {
      event.stopPropagation();
      $scope.activeSubDropdown = (
        (type === $scope.activeSubDropdown) ? '' : type);
    };

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
      if (entity.status === 'private') {
        if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.TITLE &&
            value === '') {
          return DEFAULT_TEXT_EMPTY_TITLE;
        } else if ($scope.currentSortType !==
                   EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED) {
          return (-1 * $scope.explorationsList.indexOf(entity));
        }
      } else if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.RATING) {
        if (!$scope.getAverageRating(value)) {
          return (
            $scope.isCurrentSortDescending ?
              (-1 * $scope.explorationsList.indexOf(entity)) :
              $scope.explorationsList.indexOf(entity));
        }
        return $scope.getAverageRating(value);
      }
      return value;
    };

    $scope.topUnresolvedAnswersCount = function(exploration) {
      var topUnresolvedAnswersCount = 0;
      exploration.top_unresolved_answers.forEach(function(answer) {
        topUnresolvedAnswersCount += answer.count;
      });
      return topUnresolvedAnswersCount;
    };

    $rootScope.loadingMessage = 'Loading';
    DashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        var responseData = response.data;
        $scope.currentSortType = EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK;
        $scope.isCurrentSortDescending = true;
        $scope.explorationsList = responseData.explorations_list;
        $scope.collectionsList = responseData.collections_list;
        $scope.dashboardStats = responseData.dashboard_stats;
        $scope.lastWeekStats = responseData.last_week_stats;
        if ($scope.dashboardStats && $scope.lastWeekStats) {
          $scope.relativeChangeInTotalPlays = (
            $scope.dashboardStats.total_plays - $scope.lastWeekStats.total_plays
          );
        }
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          alertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }
]);
