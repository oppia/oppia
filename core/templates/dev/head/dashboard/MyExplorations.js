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
 * @fileoverview Controllers for the page showing the user's explorations.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('MyExplorations', [
  '$scope', '$http', '$rootScope', 'oppiaDatetimeFormatter',
  'RatingComputationService',
  function(
      $scope, $http, $rootScope, oppiaDatetimeFormatter,
      RatingComputationService) {
    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.getAverageRating = function(ratings) {
      return RatingComputationService.computeAverageRating(ratings);
    };

    $rootScope.loadingMessage = 'Loading';
    $http.get('/myexplorationshandler/data').success(function(data) {
      $scope.explorationsList = data.explorations_list;
      $rootScope.loadingMessage = '';
    });
  }
]);

oppia.controller('CreateExplorationButton', [
  '$scope', 'CATEGORY_LIST', 'ExplorationCreationButtonService',
  function($scope, CATEGORY_LIST, ExplorationCreationButtonService) {
    $scope.showCreateExplorationModal = function() {
      ExplorationCreationButtonService.showCreateExplorationModal(
        CATEGORY_LIST);
    };
  }
]);
