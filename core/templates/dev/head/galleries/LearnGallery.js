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
 * @fileoverview Data and controllers for the Oppia learners' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

function LearnGallery($scope, $http, $rootScope, warningsData, oppiaRequestCreator) {
  $scope.learnGalleryDataUrl = '/learnhandler/data';
  $scope.categoryList = [];
  $scope.categories = {};
  // The default is to show only explorations that have moved out of beta or
  // that this user has been invited to playtest.
  $scope.areAllBetaExplorationsShown = false;

  $scope.displayedCategoryList = [];
  $scope.displayedCategories = {};

  $rootScope.loadingMessage = 'Loading';

  // Retrieves gallery data from the server.
  $http.get($scope.learnGalleryDataUrl).success(function(data) {
    $scope.categories = data.categories;

    // Put the category names in a list.
    for (var category in $scope.categories) {
      $scope.categoryList.push(category);
    }

    $scope.initializeDisplay();

    $rootScope.loadingMessage = '';
  }).error(function(data) {
    warningsData.addWarning(data.error || 'Error communicating with server.');
  });

  // TODO(sll): If there is no difference between the two types of displays,
  // hide the 'Show All' button.
  $scope.initializeDisplay = function() {
    if ($scope.areAllBetaExplorationsShown) {
      $scope.displayedCategoryList = angular.copy($scope.categoryList);
      $scope.displayedCategories = angular.copy($scope.categories);
    } else {
      $scope.displayedCategoryList = [];
      $scope.displayedCategories = {};

      for (var category in $scope.categories) {
        var validExplorationCount = 0;
        var filteredExplorations = {};
        for (var exploration in $scope.categories[category]) {
          if ($scope.categories[category][exploration].to_playtest ||
              $scope.categories[category][exploration].is_publicized) {
            filteredExplorations[exploration] = $scope.categories[category][exploration];
            validExplorationCount++;
          }
        }
        if (validExplorationCount > 0) {
          $scope.displayedCategories[category] = filteredExplorations;
          $scope.displayedCategoryList.push(category);
        }
      }
    }
  };

  $scope.showBetaExplorations = function() {
    $scope.areAllBetaExplorationsShown = true;
    $scope.initializeDisplay();
  };

  $scope.hideBetaExplorations = function() {
    $scope.areAllBetaExplorationsShown = false;
    $scope.initializeDisplay();
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
LearnGallery.$inject = ['$scope', '$http', '$rootScope', 'warningsData', 'oppiaRequestCreator'];
