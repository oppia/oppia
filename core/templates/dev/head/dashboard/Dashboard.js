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

oppia.controller('Dashboard', [
    '$scope', '$http', '$rootScope', 'warningsData', 'createExplorationButtonService',
    function($scope, $http, $rootScope, warningsData, createExplorationButtonService) {
  var EXPLORATION_STATUS_PRIVATE = 'private';
  var EXPLORATION_STATUS_BETA = 'public';
  var EXPLORATION_STATUS_RELEASED = 'publicized';
  // TODO(sll): Consider replacing this with an actual list of categories when
  // we have found a way to do this that does not involve iterating through all
  // explorations.
  var CATEGORY_LIST = [
    'Architecture',
    'Art',
    'Biology',
    'Business',
    'Chemistry',
    'Computing',
    'Earth Science',
    'Education',
    'Geography',
    'Languages',
    'Law',
    'Life Skills',
    'Mathematics',
    'Music',
    'Philosophy',
    'Physics',
    'Programming',
    'Statistics'
  ];

  $scope.dashboardDataUrl = '/dashboardhandler/data';
  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = function() {
    createExplorationButtonService.showCreateExplorationModal(CATEGORY_LIST);
  };

  // Retrieves dashboard data from the server.
  $http.get($scope.dashboardDataUrl).success(function(data) {
    $scope.privateExplorationIds = [];
    $scope.betaExplorationIds = [];
    $scope.releasedExplorationIds = [];
    $scope.explorations = data.explorations;

    for (var expId in $scope.explorations) {
      var status = $scope.explorations[expId].status;
      if (status == EXPLORATION_STATUS_PRIVATE) {
        $scope.privateExplorationIds.push(expId);
      } else if (status == EXPLORATION_STATUS_BETA) {
        $scope.betaExplorationIds.push(expId);
      } else if (status == EXPLORATION_STATUS_RELEASED) {
        $scope.releasedExplorationIds.push(expId);
      } else {
        throw ('Error: Invalid exploration status ' + status);
      }
    }

    $rootScope.loadingMessage = '';
  });
}]);
