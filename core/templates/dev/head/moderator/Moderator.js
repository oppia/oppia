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
* @fileoverview Data and controllers for the Oppia moderator page.
*
* @author yanamal@google.com (Yana Malysheva)
*/

function Moderator($scope, $http, $rootScope, warningsData, oppiaRequestCreator) {
  
  $scope.submitUserEmailRequest = function(username) {
    $scope.username = username;
    $scope.last_submitted_username = username;
    $http.post(
      '/moderatorhandler/user_services',
      oppiaRequestCreator.createRequest({
        username: username
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      $scope.userEmail = data.user_email; 
    }).error(function(data) {
      warningsData.addWarning(data.error);
    });
  }
}

/**
* Injects dependencies in a way that is preserved by minification.
*/
Moderator.$inject = ['$scope', '$http', '$rootScope', 'warningsData', 'oppiaRequestCreator'];
