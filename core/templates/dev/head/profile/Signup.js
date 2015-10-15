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

oppia.controller('Signup', [
    '$scope', '$http', '$rootScope', '$modal', '$translate',
    '$translatePartialLoader', 'warningsData', 'urlService',
    'focusService',
    function($scope, $http, $rootScope, $modal, $translate,
             $translatePartialLoader, warningsData, urlService,
             focusService) {

  $translatePartialLoader.addPart('sign_up');
  $translate.refresh();

  var _SIGNUP_DATA_URL = '/signuphandler/data';
  $rootScope.loadingMessage = 'Loading';
  $scope.warningText = '';
  $scope.showEmailPreferencesForm = GLOBALS.CAN_SEND_EMAILS_TO_USERS;
  $scope.submissionInProcess = false;

  $http.get(_SIGNUP_DATA_URL).success(function(data) {
    $rootScope.loadingMessage = '';
    $scope.username = data.username;
    $scope.hasEverRegistered = data.has_ever_registered;
    $scope.hasAgreedToLatestTerms = data.has_agreed_to_latest_terms;
    $scope.hasUsername = Boolean($scope.username);
    focusService.setFocus('usernameInputField');
  });

  $scope.blurredAtLeastOnce = false;
  $scope.canReceiveEmailUpdates = null;

  $scope.isFormValid = function() {
    return (
      $scope.hasAgreedToLatestTerms &&
      ($scope.hasUsername || !$scope.getWarningText($scope.username))
    );
  };

  $scope.showLicenseExplanationModal = function() {
    $modal.open({
      templateUrl: 'modals/licenseExplanation',
      backdrop: true,
      resolve: {},
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.close = function() {
          $modalInstance.dismiss('cancel');
        };
      }]
    });
  };

  $scope.onUsernameInputFormBlur = function(username) {
    if ($scope.hasUsername) {
      return;
    }
    warningsData.clear();
    $scope.blurredAtLeastOnce = true;
    $scope.updateWarningText(username);
    if (!$scope.warningText) {
      $http.post('usernamehandler/data', {
        username: $scope.username
      }).success(function(data) {
        if (data.username_is_taken) {
          $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_TAKEN'
        }
      });
    }
  };

  // Returns the warning text corresponding to the validation error for the
  // given username, or an empty string if the username is valid.
  $scope.updateWarningText = function(username) {
    var alphanumeric = /^[A-Za-z0-9]+$/;
    var admin = /admin/i;
    var oppia = /oppia/i;

    if (!username) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_NO_USERNAME';
    } else if (username.indexOf(' ') !== -1) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES';
    } else if (username.length > 50) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS';
    } else if (!alphanumeric.test(username)) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM';
    } else if (admin.test(username)) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN';
    } else if (oppia.test(username)) {
      $scope.warningText = 'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE';
    } else {
      $scope.warningText = '';
    }
  };

  $scope.onSelectEmailPreference = function() {
    $scope.emailPreferencesWarningText = '';
  };

  $scope.submitPrerequisitesForm = function(
      agreedToTerms, username, canReceiveEmailUpdates) {
    if (!agreedToTerms) {
      warningsData.addWarning('I18N_SIGNUP_ERROR_MUST_AGREE_WITH_TERMS');
      return;
    }

    if (!$scope.hasUsername && $scope.warningText) {
      return;
    }

    var requestParams = {
      agreed_to_terms: agreedToTerms,
      can_receive_email_updates: null
    };
    if (!$scope.hasUsername) {
      requestParams.username = username;
    }

    if (GLOBALS.CAN_SEND_EMAILS_TO_USERS && !$scope.hasUsername) {
      if (canReceiveEmailUpdates === null) {
        $scope.emailPreferencesWarningText = 'This field is required.';
        return;
      }

      if (canReceiveEmailUpdates === 'yes') {
        requestParams.can_receive_email_updates = true;
      } else if (canReceiveEmailUpdates === 'no') {
        requestParams.can_receive_email_updates = false;
      } else {
        throw Error(
          'Invalid value for email preferences: ' + canReceiveEmailUpdates);
      }
    }

    $scope.submissionInProcess = true;
    $http.post(_SIGNUP_DATA_URL, requestParams).success(function(data) {
      window.location = window.decodeURIComponent(urlService.getUrlParams().return_url);
    }).error(function(data) {
      $scope.submissionInProcess = false;
    });
  };
}]);
