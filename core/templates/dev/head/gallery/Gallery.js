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
 * @fileoverview Data and controllers for the Oppia gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

function Gallery($scope, $http, $modal, warningsData, oppiaRequestCreator) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;
  $scope.galleryDataUrl = '/gallery/data/';
  $scope.categoryList = [];

  // Retrieves gallery data from the server.
  $http.get($scope.galleryDataUrl).success(function(galleryData) {
    $scope.categories = galleryData.categories;

    // Put the category names in a list.
    for (var category in $scope.categories) {
      $scope.categoryList.push(category);
    }
  });

  /**
   * Displays a modal explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
  $scope.showEmbedModal = function(explorationId) {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/galleryEmbed',
      backdrop: 'static',
      resolve: {
        currentId: function() {
          return explorationId;
        },
        root: function() {
          return $scope.root;
        },
        isDemoServer: $scope.isDemoServer
      },
      controller: function($scope, $modalInstance, currentId, root, isDemoServer) {
        $scope.isDemoServer = isDemoServer;
        $scope.root = root;
        $scope.currentId = currentId;

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });
  };

  $scope.forkExploration = function(explorationId) {
    $http.post(
        '/fork',
        oppiaRequestCreator.createRequest({exploration_id: explorationId}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              warningsData.addWarning(data.error ? data.error :
                  'Error: Could not add new exploration.');
            });
  };

  /*********************************************************************
  * Variables and methods for storing and applying user preferences.
  *********************************************************************/
  $scope.canViewExploration = function(exploration) {
    return !$scope.showMyExplorations || exploration.is_owner || exploration.can_edit;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Gallery.$inject = ['$scope', '$http', '$modal', 'warningsData', 'oppiaRequestCreator'];
