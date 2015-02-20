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

  var EXPLORATION_STATUS_PRIVATE = 'private';
  var EXPLORATION_STATUS_PUBLIC = 'public';
  var EXPLORATION_STATUS_FEATURED = 'publicized';

  $scope.navigateToItem = function(activityId, updateType) {
    window.location.href = (
      '/create/' + activityId + (updateType === 'feedback_thread' ? '#/feedback': ''));
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

    $scope.privateExplorationIds = [];
    $scope.publicExplorationIds = [];
    $scope.featuredExplorationIds = [];
    $scope.explorations = data.explorations;

    for (var expId in $scope.explorations) {
      var status = $scope.explorations[expId].status;
      if (status == EXPLORATION_STATUS_PRIVATE) {
        $scope.privateExplorationIds.push(expId);
      } else if (status == EXPLORATION_STATUS_PUBLIC) {
        $scope.publicExplorationIds.push(expId);
      } else if (status == EXPLORATION_STATUS_FEATURED) {
        $scope.featuredExplorationIds.push(expId);
      } else {
        throw ('Error: Invalid exploration status ' + status);
      }
    }

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
