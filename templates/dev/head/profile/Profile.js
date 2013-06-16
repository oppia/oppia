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
 * @fileoverview Data and controllers for the Oppia profile page.
 *
 * @author sfederwisch@google.com (Stephanie Federwisch)
 */

function Profile($scope, $http, warningsData) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;
  $scope.profileUrl = '/profile/data/';

  // Retrieves profile data from the server.
  $http.get($scope.profileUrl).success(function(profileData) {
    $scope.explorations = profileData.explorations;
    $scope.exploration_rows = [];
    var i = 0;
    while ((i * 3) < $scope.explorations.length) {
        $scope.exploration_rows[i] = [
          $scope.explorations[i*3],
          $scope.explorations[(i*3)+1],
          $scope.explorations[(i*3)+2]
        ];
        i++;
    }
    $scope.improvable = profileData.improvable;
  });
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Profile.$inject = ['$scope', '$http', 'warningsData'];
