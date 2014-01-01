// Copyright 2012 Google Inc. All Rights Reserved.
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

function ContributeGallery($scope, $http, $rootScope, warningsData, oppiaRequestCreator) {
  $scope.contributeGalleryDataUrl = '/contributehandler/data';
  $scope.cloneExplorationUrl = '/contributehandler/clone';
  $scope.categoryList = [];

  $rootScope.loadingMessage = 'Loading';

  // Retrieves gallery data from the server.
  $http.get($scope.contributeGalleryDataUrl).success(function(data) {
    $scope.categories = data.categories;

    // Put the category names in a list.
    for (var category in $scope.categories) {
      $scope.categoryList.push(category);
    }

    $rootScope.loadingMessage = '';
  }).error(function(data) {
    warningsData.addWarning(data.error || 'Error communicating with server.');
  });

  $scope.cloneExploration = function(explorationId) {
    $rootScope.loadingMessage = 'Cloning exploration';
    $http.post(
      $scope.cloneExplorationUrl,
      oppiaRequestCreator.createRequest({exploration_id: explorationId}),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
        success(function(data) {
          window.location = '/create/' + data.explorationId;
        }).error(function(data) {
          warningsData.addWarning(data.error ? data.error :
            'Error: Could not add new exploration.');
          $rootScope.loadingMessage = '';
        });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ContributeGallery.$inject = ['$scope', '$http', '$rootScope', 'warningsData', 'oppiaRequestCreator'];
