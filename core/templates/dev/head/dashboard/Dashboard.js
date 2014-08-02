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

function Dashboard(
    $scope, $http, $rootScope, warningsData, oppiaRequestCreator, createExplorationButtonService) {
  var EXPLORATION_STATUS_PRIVATE = 'private';
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
    'Statistics',
  ];

  $scope.dashboardDataUrl = '/dashboardhandler/data';
  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = function() {
    createExplorationButtonService.showCreateExplorationModal(CATEGORY_LIST);
  };

  var computeExplorationStats = function(data) {
    var result = {};
    var count = function(exps, totalProperty, privateProperty) {
      var totalCount = 0;
      var privateCount = 0;
      for (var id in exps) {
        totalCount++;
        if (exps[id].rights.status == EXPLORATION_STATUS_PRIVATE) {
          privateCount++;
        }
      }
      result[totalProperty] = totalCount;
      result[privateProperty] = privateCount;
    };
    count(data.owned, 'owned', 'owned_private');
    count(data.editable, 'editable', 'editable_private');
    count(data.viewable, 'viewable', 'viewable_private');
    return result;
  };

  // Retrieves dashboard data from the server.
  $http.get($scope.dashboardDataUrl).success(function(data) {
    $scope.explorationStats = computeExplorationStats(data);
    $scope.ownedExplorations = data.owned;
    $scope.editableExplorations = data.editable;
    $scope.viewableExplorations = data.viewable;

    $rootScope.loadingMessage = '';
  }).error(function(data) {
    warningsData.addWarning(data.error || 'Error communicating with server.');
  });
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Dashboard.$inject = [
  '$scope', '$http', '$rootScope', 'warningsData', 'oppiaRequestCreator',
  'createExplorationButtonService'];
