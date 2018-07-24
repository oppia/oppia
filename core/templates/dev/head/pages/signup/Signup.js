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
  '$scope', '$http', '$rootScope', '$uibModal', 'AlertsService', 'UrlService',
  'FocusManagerService', 'siteAnalyticsService', 'UrlInterpolationService',
  'SITE_NAME',
  function(
      $scope, $http, $rootScope, $uibModal, AlertsService, UrlService,
      FocusManagerService, siteAnalyticsService, UrlInterpolationService,
      SITE_NAME) {
    var _SIGNUP_DATA_URL = '/signuphandler/data';
    $rootScope.loadingMessage = 'I18N_SIGNUP_LOADING';
    $scope.warningI18nCode = '';
    $scope.siteName = SITE_NAME;
    $scope.showEmailPreferencesForm = GLOBALS.CAN_SEND_EMAILS;
    $scope.submissionInProcess = false;

    $http.get(_SIGNUP_DATA_URL).then(function(response) {
      var data = response.data;
      $rootScope.loadingMessage = '';
      $scope.username = data.username;
      $scope.hasEverRegistered = data.has_ever_registered;
      $scope.hasAgreedToLatestTerms = data.has_agreed_to_latest_terms;
      $scope.hasUsername = Boolean($scope.username);
      FocusManagerService.setFocus('usernameInputField');
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
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/signup/licence_explanation_modal_directive.html'),
        backdrop: true,
        resolve: {},
        controller: [
          '$scope', '$uibModalInstance', 'SITE_NAME',
          function($scope, $uibModalInstance, SITE_NAME) {
            $scope.siteName = SITE_NAME;
            $scope.close = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      });
    };

    $scope.onUsernameInputFormBlur = function(username) {
      if ($scope.hasUsername) {
        return;
      }
      AlertsService.clearWarnings();
      $scope.blurredAtLeastOnce = true;
      $scope.updateWarningText(username);
      if (!$scope.warningI18nCode) {
        $http.post('usernamehandler/data', {
          username: $scope.username
        }).then(function(response) {
          if (response.data.username_is_taken) {
            $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_TAKEN';
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
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_NO_USERNAME';
      } else if (username.indexOf(' ') !== -1) {
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES';
      } else if (username.length > 50) {
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS';
      } else if (!alphanumeric.test(username)) {
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM';
      } else if (admin.test(username)) {
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN';
      } else if (oppia.test(username)) {
        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE';
      } else {
        $scope.warningI18nCode = '';
      }
    };

    $scope.onSelectEmailPreference = function() {
      $scope.emailPreferencesWarningText = '';
    };

    $scope.submitPrerequisitesForm = function(
        agreedToTerms, username, canReceiveEmailUpdates) {
      if (!agreedToTerms) {
        AlertsService.addWarning('I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
        return;
      }

      if (!$scope.hasUsername && $scope.warningI18nCode) {
        return;
      }

      var requestParams = {
        agreed_to_terms: agreedToTerms,
        can_receive_email_updates: null
      };

      var defaultDashboard = constants.DASHBOARD_TYPE_LEARNER;
      var returnUrl = window.decodeURIComponent(
        UrlService.getUrlParams().return_url);

      if (returnUrl.indexOf('creator_dashboard') !== -1) {
        defaultDashboard = constants.DASHBOARD_TYPE_CREATOR;
      } else {
        defaultDashboard = constants.DASHBOARD_TYPE_LEARNER;
      }

      var requestParams = {
        agreed_to_terms: agreedToTerms,
        can_receive_email_updates: null,
        default_dashboard: defaultDashboard
      };

      if (!$scope.hasUsername) {
        requestParams.username = username;
      }

      if (GLOBALS.CAN_SEND_EMAILS && !$scope.hasUsername) {
        if (canReceiveEmailUpdates === null) {
          $scope.emailPreferencesWarningText = 'I18N_SIGNUP_FIELD_REQUIRED';
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
          UrlService.getUrlParams().return_url);
      }, function() {
        $scope.submissionInProcess = false;
      });
    };
  }
]);
