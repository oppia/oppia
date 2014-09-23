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

oppia.controller('EditorPrerequisites', [
    '$scope', '$http', '$rootScope', 'warningsData', 'urlService',
    function($scope, $http, $rootScope, warningsData, urlService) {
  $scope.editorPrerequisitesDataUrl = '/editor_prerequisites_handler/data/';
  $rootScope.loadingMessage = 'Loading';
  $scope.warningText = '';

  $http.get($scope.editorPrerequisitesDataUrl).success(function(data) {
    $rootScope.loadingMessage = '';
    $scope.username = data.username;
    $scope.agreedToTerms = data.has_agreed_to_terms;
    $scope.hasUsername = Boolean($scope.username);
  });

  $scope.blurredAtLeastOnce = false;

  $scope.isFormValid = function() {
    return (
      $scope.agreedToTerms &&
      ($scope.hasUsername || !$scope.getWarningText($scope.username))
    );
  };

  $scope.onUsernameInputFormBlur = function(username) {
    warningsData.clear();
    $scope.blurredAtLeastOnce = true;
    $scope.updateWarningText(username);
    if (!$scope.warningText) {
      $http.post('usernamehandler/data', {
        username: $scope.username
      }).success(function(data) {
        if (data.username_is_taken) {
          $scope.warningText = 'Sorry, this username is already taken.'
        }
      });
    }
  };

  // Returns the warning text corresponding to the validation error for the
  // given username, or an empty string if the username is valid.
  $scope.updateWarningText = function(username) {
    var alphanumeric = /^[A-Za-z0-9]+$/;
    var admin = /admin/i;

    if (!username) {
      $scope.warningText = 'Please choose a non-empty username.';
    } else if (username.indexOf(' ') !== -1) {
      $scope.warningText = 'Please ensure that your username has no spaces.';
    } else if (username.length > 50) {
      $scope.warningText = 'A username can have at most 50 characters.';
    } else if (!alphanumeric.test(username)) {
      $scope.warningText = 'Usernames can only have alphanumeric characters.';
    } else if (admin.test(username)) {
      $scope.warningText = 'User names with \'admin\' are reserved.';
    } else {
      $scope.warningText = '';
    }
  };

  $scope.submitPrerequisitesForm = function(agreedToTerms, username) {
    if (!agreedToTerms) {
      warningsData.addWarning(
          'In order to edit explorations on this site, you will need to ' +
          'agree to the site terms.');
      return;
    }

    if (!$scope.hasUsername && $scope.warningText) {
      return;
    }

    var requestParams = {
      agreed_to_terms: agreedToTerms
    };
    if (!$scope.hasUsername) {
      requestParams.username = username;
    }

    $http.post('/editor_prerequisites_handler/data', requestParams).success(function(data) {
      window.location = window.decodeURIComponent(urlService.getUrlParams().return_url);
    });
  };
}]);
