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

oppia.controller('ContributeGallery', [
    '$scope', '$http', '$rootScope', 'createExplorationButtonService',
    function($scope, $http, $rootScope, createExplorationButtonService) {
  $scope.contributeGalleryDataUrl = '/contributehandler/data';
  $scope.categoryList = [];
  $scope.categories = {};

  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = (
    createExplorationButtonService.showCreateExplorationModal);
  $scope.showUploadExplorationModal = (
    createExplorationButtonService.showUploadExplorationModal);

  // Retrieves gallery data from the server.
  $http.get($scope.contributeGalleryDataUrl).success(function(data) {
    $scope.categories = data.categories;

    // Put the category names in a list.
    for (var category in $scope.categories) {
      $scope.categoryList.push(category);
    }

    $rootScope.loadingMessage = '';
  });
}]);
