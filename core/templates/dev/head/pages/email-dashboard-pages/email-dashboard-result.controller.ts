// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for oppia email dashboard page.
 */

require('base_components/BaseContentDirective.ts');

require('domain/utilities/UrlInterpolationService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('emailDashboardResultPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/email_dashboard/email_dashboard_result_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$timeout', '$window', 'UrlInterpolationService',
        function($http, $timeout, $window, UrlInterpolationService) {
          var ctrl = this;
          var RESULT_HANDLER_URL = '/emaildashboardresult/<query_id>';
          var CANCEL_EMAIL_HANDLER_URL =
            '/emaildashboardcancelresult/<query_id>';
          var EMAIL_DASHBOARD_PAGE = '/emaildashboard';
          var TEST_BULK_EMAIL_URL =
            '/emaildashboardtestbulkemailhandler/<query_id>';

          var getQueryId = function() {
            return $window.location.pathname.split('/').slice(-1)[0];
          };

          var validateEmailSubjectAndBody = function() {
            var dataIsValid = true;
            if (ctrl.emailSubject.length === 0) {
              ctrl.invalid.subject = true;
              dataIsValid = false;
            }
            if (ctrl.emailBody.length === 0) {
              ctrl.invalid.body = true;
              dataIsValid = false;
            }
            return dataIsValid;
          };

          ctrl.submitEmail = function() {
            var resultHandlerUrl = UrlInterpolationService.interpolateUrl(
              RESULT_HANDLER_URL, {
                query_id: getQueryId()
              });
            var dataIsValid = validateEmailSubjectAndBody();

            if (ctrl.emailOption === 'custom' &&
              ctrl.maxRecipients === null) {
              ctrl.invalid.maxRecipients = true;
              dataIsValid = false;
            }

            if (dataIsValid) {
              ctrl.submitIsInProgress = true;
              var data = {
                email_subject: ctrl.emailSubject,
                email_body: ctrl.emailBody,
                email_intent: ctrl.emailIntent,
                max_recipients: (
                  ctrl.emailOption !== 'all' ? ctrl.max_recipients : null)
              };

              $http.post(resultHandlerUrl, {
                data: data
              }).success(function() {
                ctrl.emailSubmitted = true;
                $timeout(function() {
                  $window.location.href = EMAIL_DASHBOARD_PAGE;
                }, 4000);
              }).error(function() {
                ctrl.errorHasOccurred = true;
                ctrl.submitIsInProgress = false;
              });
              ctrl.invalid.subject = false;
              ctrl.invalid.body = false;
              ctrl.invalid.maxRecipients = false;
            }
          };

          ctrl.resetForm = function() {
            ctrl.emailSubject = '';
            ctrl.emailBody = '';
            ctrl.emailOption = 'all';
          };

          ctrl.cancelEmail = function() {
            ctrl.submitIsInProgress = true;
            var cancelUrlHandler = UrlInterpolationService.interpolateUrl(
              CANCEL_EMAIL_HANDLER_URL, {
                query_id: getQueryId()
              });

            $http.post(cancelUrlHandler).success(function() {
              ctrl.emailCancelled = true;
              $timeout(function() {
                $window.location.href = EMAIL_DASHBOARD_PAGE;
              }, 4000);
            }).error(function() {
              ctrl.errorHasOccurred = true;
              ctrl.submitIsInProgress = false;
            });
          };

          ctrl.sendTestEmail = function() {
            var testEmailHandlerUrl = UrlInterpolationService.interpolateUrl(
              TEST_BULK_EMAIL_URL, {
                query_id: getQueryId()
              });
            var dataIsValid = validateEmailSubjectAndBody();

            if (dataIsValid) {
              $http.post(testEmailHandlerUrl, {
                email_subject: ctrl.emailSubject,
                email_body: ctrl.emailBody
              }).success(function() {
                ctrl.testEmailSentSuccesfully = true;
              });
              ctrl.invalid.subject = false;
              ctrl.invalid.body = false;
              ctrl.invalid.maxRecipients = false;
            }
          };

          ctrl.emailOption = 'all';
          ctrl.emailSubject = '';
          ctrl.emailBody = '';
          ctrl.invalid = {
            subject: false,
            body: false,
            maxRecipients: false
          };
          ctrl.maxRecipients = null;
          ctrl.POSSIBLE_EMAIL_INTENTS = [
            'bulk_email_marketing', 'bulk_email_improve_exploration',
            'bulk_email_create_exploration', 'bulk_email_creator_reengagement',
            'bulk_email_learner_reengagement'];
          ctrl.emailIntent = ctrl.POSSIBLE_EMAIL_INTENTS[0];
          ctrl.emailSubmitted = false;
          ctrl.submitIsInProgress = false;
          ctrl.errorHasOccurred = false;
          ctrl.testEmailSentSuccesfully = false;
        }
      ]};
  }]);
