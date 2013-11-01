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

function Profile($scope, $http, warningsData, requestCreator) {
  $scope.profileUrl = '/profile/data/';
  $scope.pageLoaded = false;

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
    $scope.categoryList = profileData.category_list;
    $scope.pageLoaded = true;
  });

  $scope.createUsername = function(username) {
    $http.post(
      '/profile/create_user_name',
      requestCreator.createRequest({
        username: username,
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).error(function(data) {
        warningsData.addWarning(data.error);
      }
    );
  }
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Profile.$inject = ['$scope', '$http', 'warningsData', 'requestCreator'];
