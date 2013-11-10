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

function EditorPrerequisites($scope, $http, warningsData, requestCreator) {
  $scope.urlParams = $scope.getUrlParams();
  $scope.hasUsername = $scope.urlParams.has_username ? true : false;

  $scope.submitPrerequisitesForm = function(agreedToTerms, username) {
    if (!agreedToTerms) {
      warningsData.addWarning(
          'In order to edit explorations on this site, you will need to ' +
          'agree to the terms of the license.');
      return;
    }

    if (!$scope.hasUsername && !username) {
      warningsData.addWarning('Please choose a non-empty username.');
      return;
    }

    $http.post(
      '/profile/editor_prerequisites',
      requestCreator.createRequest({
        agreed_to_terms: agreedToTerms,
        username: username
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      window.location = window.decodeURIComponent($scope.getUrlParams().return_url);
    }).error(function(data) {
      warningsData.addWarning(data.error);
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorPrerequisites.$inject = ['$scope', '$http', 'warningsData', 'requestCreator'];
