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
 */

oppia.controller('Signup', [
  '$scope', '$http', '$rootScope', '$modal', 'alertsService', 'urlService',
  'focusService', 'siteAnalyticsService',
  function(
      $scope, $http, $rootScope, $modal, alertsService, urlService,
      focusService, siteAnalyticsService) {
    var _SIGNUP_DATA_URL = '/signuphandler/data';
    $rootScope.loadingMessage = 'Loading';
    $scope.warningText = '';
    $scope.showEmailPreferencesForm = GLOBALS.CAN_SEND_EMAILS_TO_USERS;
    $scope.submissionInProcess = false;

    $http.get(_SIGNUP_DATA_URL).then(function(response) {
      var data = response.data;
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
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.close = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ]
      });
    };

    $scope.onUsernameInputFormBlur = function(username) {
      if ($scope.hasUsername) {
        return;
      }
      alertsService.clearWarnings();
      $scope.blurredAtLeastOnce = true;
      $scope.updateWarningText(username);
      if (!$scope.warningText) {
        $http.post('usernamehandler/data', {
          username: $scope.username
        }).then(function(response) {
          if (response.data.username_is_taken) {
            $scope.warningText = 'Sorry, this username is already taken.';
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
        $scope.warningText = 'Please choose a username.';
      } else if (username.indexOf(' ') !== -1) {
        $scope.warningText = 'Please ensure that your username has no spaces.';
      } else if (username.length > 50) {
        $scope.warningText = 'A username can have at most 50 characters.';
      } else if (!alphanumeric.test(username)) {
        $scope.warningText = 'Usernames can only have alphanumeric characters.';
      } else if (admin.test(username)) {
        $scope.warningText = 'User names with \'admin\' are reserved.';
      } else if (oppia.test(username)) {
        $scope.warningText = 'This user name is not available.';
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
        alertsService.addWarning(
          'In order to edit explorations on this site, you will need to ' +
          'agree to the site terms.');
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

      siteAnalyticsService.registerNewSignupEvent();

      $scope.submissionInProcess = true;
      $http.post(_SIGNUP_DATA_URL, requestParams).then(function() {
        window.location = window.decodeURIComponent(
          urlService.getUrlParams().return_url);
      }, function() {
        $scope.submissionInProcess = false;
      });
    };
  }
]);
