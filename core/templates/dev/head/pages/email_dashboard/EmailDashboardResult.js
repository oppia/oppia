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

oppia.controller('EmailDashboardResult', [
  '$scope', '$http', '$window', '$timeout',
  function($scope, $http, $window, $timeout) {
    var RESULT_HANDLER_URL_PREFIX = '/emaildashboardresult';
    var CANCEL_EMAIL_HANDLER_URL_PREFIX = '/emaildashboardcancelresult';
    var EMAIL_DASHBOARD_PAGE = '/emaildashboard';

    var getQueryId = function() {
      return $window.location.pathname.split('/').slice(-1)[0];
    };

    $scope.submitEmail = function() {
      var resultHandlerUrl = RESULT_HANDLER_URL_PREFIX + '/' + getQueryId();
      var invalidData = false;

      if ($scope.emailSubject.length === 0) {
        $scope.invalid.subject = true;
        invalidData = true;
      }
      if ($scope.emailBody.length === 0) {
        $scope.invalid.body = true;
        invalidData = true;
      }
      if ($scope.emailOption === 'custom' &&
        $scope.maxRecipients === null) {
        $scope.invalid.maxRecipients = true;
        invalidData = true;
      }

      if (!invalidData) {
        $scope.submitIsInProgress = true;
        var data = {
          email_subject: $scope.emailSubject,
          email_body: $scope.emailBody,
          email_intent: $scope.emailIntent,
          max_recipients: (
            $scope.emailOption !== 'all' ? $scope.max_recipients : null)
        };

        $http.post(resultHandlerUrl, {
          data: data
        }).success(function() {
          $scope.emailSubmitted = true;
          $timeout(function() {
            $window.location.href = EMAIL_DASHBOARD_PAGE;
          }, 4000);
        }).error(function() {
          $scope.errorHasOccurred = true;
          $scope.submitIsInProgress = false;
        });
        $scope.invalid.subject = false;
        $scope.invalid.body = false;
        $scope.invalid.maxRecipients = false;
      }
    };

    $scope.resetForm = function() {
      $scope.emailSubject = '';
      $scope.emailBody = '';
      $scope.emailOption = 'all';
    };

    $scope.cancelEmail = function() {
      $scope.submitIsInProgress = true;
      var cancelUrlHandler = (
        CANCEL_EMAIL_HANDLER_URL_PREFIX + '/' + getQueryId());
      $http.post(cancelUrlHandler).success(function() {
        $scope.emailCancelled = true;
        $timeout(function() {
          $window.location.href = EMAIL_DASHBOARD_PAGE;
        }, 4000);
      }).error(function() {
        $scope.errorHasOccurred = true;
        $scope.submitIsInProgress = false;
      });
    };

    $scope.emailOption = 'all';
    $scope.emailSubject = '';
    $scope.emailBody = '';
    $scope.invalid = {
      subject: false,
      body: false,
      maxRecipients: false
    };
    $scope.maxRecipients = null;
    $scope.POSSIBLE_EMAIL_INTENTS = [
      'bulk_email_marketing', 'bulk_email_improve_exploration',
      'bulk_email_create_exploration', 'bulk_email_creator_reengagement',
      'bulk_email_learner_reengagement'];
    $scope.emailIntent = $scope.POSSIBLE_EMAIL_INTENTS[0];
    $scope.emailSubmitted = false;
    $scope.submitIsInProgress = false;
    $scope.errorHasOccurred = false;
  }
]);
