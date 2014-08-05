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

 oppia.controller('LearnGallery', ['$scope', '$http', '$rootScope', function(
    $scope, $http, $rootScope) {
  $scope.learnGalleryDataUrl = '/learnhandler/data';
  $scope.categoryList = [];
  $scope.categories = {};

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

    $scope.displayedCategoryList = angular.copy($scope.categoryList);
    $scope.displayedCategories = angular.copy($scope.categories);

    $rootScope.loadingMessage = '';
  });
}]);
