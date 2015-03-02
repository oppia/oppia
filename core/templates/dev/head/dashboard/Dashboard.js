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
 * @fileoverview Data and controllers for the user dashboard.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.constant('DEFAULT_DASHBOARD_TAB_NAME', 'timeline');


oppia.controller('Dashboard', [
    '$scope', '$http', '$rootScope', 'warningsData', 'oppiaDatetimeFormatter',
    'DEFAULT_DASHBOARD_TAB_NAME',
    function($scope, $http, $rootScope, warningsData, oppiaDatetimeFormatter,
             DEFAULT_DASHBOARD_TAB_NAME) {
  $scope.activeTab = DEFAULT_DASHBOARD_TAB_NAME;

  $scope.$on('activeTabChanged', function(evt, tabName) {
    $scope.activeTab = tabName;
  });

  // Default color.
  var _COLOR_TEAL = 'teal';
  // Social sciences.
  var _COLOR_SALMON = 'salmon';
  // Art.
  var _COLOR_SUNNYSIDE = 'sunnyside';
  // Mathematics and computing.
  var _COLOR_SHARKFIN = 'sharkfin';
  // Science.
  var _COLOR_GUNMETAL = 'gunmetal';

  var CATEGORY_TO_DEFAULT_COLOR = {
    'Architecture': _COLOR_SUNNYSIDE,
    'Art': _COLOR_SUNNYSIDE,
    'Biology': _COLOR_GUNMETAL,
    'Business': _COLOR_SALMON,
    'Chemistry': _COLOR_GUNMETAL,
    'Computing': _COLOR_SHARKFIN,
    'Economics': _COLOR_SALMON,
    'Education': _COLOR_TEAL,
    'Engineering': _COLOR_GUNMETAL,
    'Environment': _COLOR_GUNMETAL,
    'Geography': _COLOR_SALMON,
    'Government': _COLOR_SALMON,
    'Hobbies': _COLOR_TEAL,
    'Languages': _COLOR_SUNNYSIDE,
    'Law': _COLOR_SALMON,
    'Life Skills': _COLOR_TEAL,
    'Mathematics': _COLOR_SHARKFIN,
    'Medicine': _COLOR_GUNMETAL,
    'Music': _COLOR_SUNNYSIDE,
    'Philosophy': _COLOR_SALMON,
    'Physics': _COLOR_GUNMETAL,
    'Programming': _COLOR_SHARKFIN,
    'Psychology': _COLOR_SALMON,
    'Puzzles': _COLOR_TEAL,
    'Reading': _COLOR_TEAL,
    'Religion': _COLOR_SALMON,
    'Sport': _COLOR_SUNNYSIDE,
    'Statistics': _COLOR_SHARKFIN,
    'Welcome': _COLOR_TEAL
  };

  $scope.navigateToItem = function(activityId, updateType) {
    window.location.href = (
      '/create/' + activityId + (updateType === 'feedback_thread' ? '#/feedback': ''));
  };

  $scope.getFormattedObjective = function(objective) {
    objective = objective.trim();
    return objective.charAt(0).toUpperCase() + objective.slice(1);
  };

  $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch);
  };

  $scope.dashboardDataUrl = '/dashboardhandler/data';
  $rootScope.loadingMessage = 'Loading';

  $scope.getEditorPageUrl = function(activityId, locationHash) {
    return '/create/' + activityId + (locationHash ? '#' + locationHash : '');
  };

  // Retrieves dashboard data from the server.
  $http.get($scope.dashboardDataUrl).success(function(data) {
    $scope.recentUpdates = data.recent_updates;
    $scope.jobQueuedMsec = data.job_queued_msec;
    $scope.lastSeenMsec = data.last_seen_msec || 0.0;
    $scope.currentUsername = data.username;

    $scope.explorationsList = data.explorations;

    $rootScope.loadingMessage = '';
  });
}]);


oppia.controller('DashboardNavbarBreadcrumb', [
    '$scope', 'DEFAULT_DASHBOARD_TAB_NAME', function($scope, DEFAULT_DASHBOARD_TAB_NAME) {
  $scope.activeTab = DEFAULT_DASHBOARD_TAB_NAME;

  $scope.activeTabNames = {
    'timeline': 'Timeline',
    'myExplorations': 'My Explorations'
  };

  $scope.$on('activeTabChanged', function(evt, tabName) {
    $scope.activeTab = tabName;
  });
}]);


oppia.controller('DashboardLocalNav', [
    '$scope', '$rootScope', 'DEFAULT_DASHBOARD_TAB_NAME',
    function($scope, $rootScope, DEFAULT_DASHBOARD_TAB_NAME) {

  $scope.activeTab = DEFAULT_DASHBOARD_TAB_NAME;

  $scope.setActiveTab = function(tabName) {
    $scope.activeTab = tabName;
    $rootScope.$broadcast('activeTabChanged', tabName);
  };
}]);


oppia.controller('CreateExplorationButton', [
    '$scope', 'CATEGORY_LIST', 'createExplorationButtonService',
    function($scope, CATEGORY_LIST, createExplorationButtonService) {
  $scope.showCreateExplorationModal = function() {
    createExplorationButtonService.showCreateExplorationModal(CATEGORY_LIST);
  };
}]);
