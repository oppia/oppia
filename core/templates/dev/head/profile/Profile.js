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
 * @fileoverview Data and controllers for the Oppia profile page.
 *
 * @author sfederwisch@google.com (Stephanie Federwisch)
 */

oppia.controller('Profile', ['$scope', '$http', '$rootScope', function(
    $scope, $http, $rootScope) {
  var EXPLORATION_STATUS_PRIVATE = 'private';
  $scope.profileDataUrl = '/profilehandler/data/';
  $rootScope.loadingMessage = 'Loading';

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

  // Retrieves profile data from the server.
  $http.get($scope.profileDataUrl).success(function(data) {
    $scope.explorationStats = computeExplorationStats(data);
    $scope.ownedExplorations = data.owned;
    $scope.editableExplorations = data.editable;
    $scope.viewableExplorations = data.viewable;

    $rootScope.loadingMessage = '';
  });
}]);
