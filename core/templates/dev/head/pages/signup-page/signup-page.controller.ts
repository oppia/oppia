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

require('base_components/BaseContentDirective.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');
require('services/IdGenerationService.ts');
require('services/SiteAnalyticsService.ts');
require('services/UserService.ts');
require('services/contextual/UrlService.ts');
require('services/stateful/FocusManagerService.ts');

angular.module('oppia').directive('signupPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/signup-page/signup-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', '$uibModal', 'AlertsService',
        'FocusManagerService',
        'SiteAnalyticsService', 'UrlInterpolationService', 'UrlService',
        'SITE_NAME',
        function(
            $http, $rootScope, $uibModal, AlertsService,
            FocusManagerService,
            SiteAnalyticsService, UrlInterpolationService, UrlService,
            SITE_NAME) {
          var ctrl = this;
          var _SIGNUP_DATA_URL = '/signuphandler/data';
          $rootScope.loadingMessage = 'I18N_SIGNUP_LOADING';
          ctrl.warningI18nCode = '';
          ctrl.siteName = SITE_NAME;
          ctrl.submissionInProcess = false;

          $http.get(_SIGNUP_DATA_URL).then(function(response) {
            var data = response.data;
            $rootScope.loadingMessage = '';
            ctrl.username = data.username;
            ctrl.hasEverRegistered = data.has_ever_registered;
            ctrl.hasAgreedToLatestTerms = data.has_agreed_to_latest_terms;
            ctrl.showEmailPreferencesForm = data.can_send_emails;
            ctrl.hasUsername = Boolean(ctrl.username);
            FocusManagerService.setFocus('usernameInputField');
          });

          ctrl.blurredAtLeastOnce = false;
          ctrl.canReceiveEmailUpdates = null;

          ctrl.isFormValid = function() {
            return (
              ctrl.hasAgreedToLatestTerms &&
              (ctrl.hasUsername || !ctrl.getWarningText(ctrl.username))
            );
          };

          ctrl.showLicenseExplanationModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/signup-page/modal-templates/' +
                'licence-explanation-modal.template.directive.html'),
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

          ctrl.onUsernameInputFormBlur = function(username) {
            if (ctrl.hasUsername) {
              return;
            }
            AlertsService.clearWarnings();
            ctrl.blurredAtLeastOnce = true;
            ctrl.updateWarningText(username);
            if (!ctrl.warningI18nCode) {
              $http.post('usernamehandler/data', {
                username: ctrl.username
              }).then(function(response) {
                if (response.data.username_is_taken) {
                  ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_TAKEN';
                }
              });
            }
          };

          // Returns the warning text corresponding to the validation error for
          // the given username, or an empty string if the username is valid.
          ctrl.updateWarningText = function(username) {
            var alphanumeric = /^[A-Za-z0-9]+$/;
            var admin = /admin/i;
            var oppia = /oppia/i;

            if (!username) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_NO_USERNAME';
            } else if (username.indexOf(' ') !== -1) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES';
            } else if (username.length > 50) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS';
            } else if (!alphanumeric.test(username)) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM';
            } else if (admin.test(username)) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN';
            } else if (oppia.test(username)) {
              ctrl.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE';
            } else {
              ctrl.warningI18nCode = '';
            }
          };

          ctrl.onSelectEmailPreference = function() {
            ctrl.emailPreferencesWarningText = '';
          };

          ctrl.submitPrerequisitesForm = function(
              agreedToTerms, username, canReceiveEmailUpdates) {
            if (!agreedToTerms) {
              AlertsService.addWarning('I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
              return;
            }

            if (!ctrl.hasUsername && ctrl.warningI18nCode) {
              return;
            }

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
              default_dashboard: defaultDashboard,
              username: null
            };

            if (!ctrl.hasUsername) {
              requestParams.username = username;
            }

            if (ctrl.showEmailPreferencesForm && !ctrl.hasUsername) {
              if (canReceiveEmailUpdates === null) {
                ctrl.emailPreferencesWarningText = 'I18N_SIGNUP_FIELD_REQUIRED';
                return;
              }

              if (canReceiveEmailUpdates === 'yes') {
                requestParams.can_receive_email_updates = true;
              } else if (canReceiveEmailUpdates === 'no') {
                requestParams.can_receive_email_updates = false;
              } else {
                throw Error(
                  'Invalid value for email preferences: ' +
                  canReceiveEmailUpdates);
              }
            }

            SiteAnalyticsService.registerNewSignupEvent();

            ctrl.submissionInProcess = true;
            $http.post(_SIGNUP_DATA_URL, requestParams).then(function() {
              window.location = window.decodeURIComponent(
                UrlService.getUrlParams().return_url);
            }, function(rejection) {
              if (
                rejection.data && rejection.data.status_code === 401) {
                ctrl.showRegistrationSessionExpiredModal();
              }
              ctrl.submissionInProcess = false;
            });
          };

          ctrl.showRegistrationSessionExpiredModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/signup-page/modal-templates/' +
                'registration-session-expired-modal.template.html'),
              backdrop: 'static',
              keyboard: false,
              resolve: {},
              controller: [
                '$scope', '$uibModalInstance', 'SiteAnalyticsService',
                'UserService', '$timeout', '$window',
                function($scope, $uibModalInstance, SiteAnalyticsService,
                    UserService, $timeout, $window) {
                  $scope.continueRegistration = function() {
                    UserService.getLoginUrlAsync().then(
                      function(loginUrl) {
                        if (loginUrl) {
                          $timeout(function() {
                            $window.location = loginUrl;
                          }, 150);
                        } else {
                          throw Error('Login url not found.');
                        }
                      }
                    );
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });
          };
        }
      ]
    };
  }]);
