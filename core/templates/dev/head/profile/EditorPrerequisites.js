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
 * @fileoverview Data and controllers for the Oppia profile page.
 *
 * @author sfederwisch@google.com (Stephanie Federwisch)
 */

function EditorPrerequisites($scope, $http, $rootScope, warningsData, oppiaRequestCreator) {
  $scope.editorPrerequisitesDataUrl = '/editor_prerequisites_handler/data/';
  $rootScope.loadingMessage = 'Loading';

  $http.get($scope.editorPrerequisitesDataUrl).success(function(data) {
    $rootScope.loadingMessage = '';
    $scope.username = data.username;
    $scope.agreedToTerms = data.has_agreed_to_terms;
  });

  $scope.submitPrerequisitesForm = function(agreedToTerms, username) {
    if (!agreedToTerms) {
      warningsData.addWarning(
          'In order to edit explorations on this site, you will need to ' +
          'agree to the site terms.');
      return;
    }

    if (!$scope.hasUsername && !username) {
      warningsData.addWarning('Please choose a non-empty username.');
      return;
    }

    $http.post(
      '/editor_prerequisites_handler/data',
      oppiaRequestCreator.createRequest({
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
EditorPrerequisites.$inject = ['$scope', '$http', '$rootScope', 'warningsData', 'oppiaRequestCreator'];
