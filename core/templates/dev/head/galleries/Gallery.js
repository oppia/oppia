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
 * @fileoverview Data and controllers for the Oppia contributors' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.filter('selectedCategoriesFilter', function() {
  return function(items, categories) {
    if (!items) {
      return [];
    }

    return items.filter(function(item) {
      return categories[item.category];
    });
  };
});

oppia.controller('Gallery', [
    '$scope', '$http', '$rootScope', 'createExplorationButtonService',
    'oppiaDatetimeFormatter',
    function($scope, $http, $rootScope, createExplorationButtonService,
             oppiaDatetimeFormatter) {
  $scope.galleryDataUrl = '/galleryhandler/data';
  $scope.categoryList = [];

  $scope.selectedCategories = {};

  $scope.getFormattedObjective = function(objective) {
    objective = objective.trim();
    return objective.charAt(0).toUpperCase() + objective.slice(1);
  };

  $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  };

  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = (
    createExplorationButtonService.showCreateExplorationModal);
  $scope.showUploadExplorationModal = (
    createExplorationButtonService.showUploadExplorationModal);

  // Retrieves gallery data from the server.
  $http.get($scope.galleryDataUrl).success(function(data) {
    $scope.releasedExplorations = data.released;
    $scope.betaExplorations = data.beta;

    $scope.categoryList = [];
    $scope.releasedExplorations.map(function(expDict) {
      if ($scope.categoryList.indexOf(expDict.category) === -1) {
        $scope.categoryList.push(expDict.category);
      }
    });
    $scope.betaExplorations.map(function(expDict) {
      if ($scope.categoryList.indexOf(expDict.category) === -1) {
        $scope.categoryList.push(expDict.category);
      }
    });
    $scope.categoryList.sort();

    $scope.selectedCategories = {};
    for (var i = 0; i < $scope.categoryList.length; i++) {
      $scope.selectedCategories[$scope.categoryList[i]] = true;
    }

    $scope.allExplorationsInOrder = (
      $scope.releasedExplorations.concat($scope.betaExplorations));

    $rootScope.loadingMessage = '';
  });
}]);
