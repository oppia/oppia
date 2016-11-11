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
    var EMAIL_POST_HANDLER = '/emaildashboardresult';

    $scope.submitEmail = function() {
      var postLink = EMAIL_POST_HANDLER + '/' + $scope.queryId;
      var invalidData = false;
      var EMAIL_DASHBOARD_PAGE = '/emaildashboard';

      if ($scope.email_option !== 'cancel') {
        if ($scope.email_subject.length === 0) {
          $scope.invalid.subject = true;
          invalidData = true;
        }
        if ($scope.email_body.length === 0) {
          $scope.invalid.body = true;
          invalidData = true;
        }
      }
      if ($scope.email_option === 'custom' &&
        $scope.num_of_users_to_send === null) {
        $scope.invalid.num_users = true;
        invalidData = true;
      }

      if (!invalidData) {
        var data = {
          email_subject: $scope.email_subject,
          email_body: $scope.email_body,
          email_option: $scope.email_option,
          num_of_users_to_send: $scope.num_of_users_to_send,
          email_intent: $scope.email_intent
        };

        $http.post(postLink, {
          data: data
        }).success(function() {
          $scope.emailSubmitted = true;
          $timeout(function() {
            $window.location.href = EMAIL_DASHBOARD_PAGE;
          }, 4000);
        });
        $scope.invalid.subject = false;
        $scope.invalid.body = false;
        $scope.invalid.num_users = false;
      }
    };

    $scope.resetEmail = function() {
      $scope.email_subject = '';
      $scope.email_body = '';
      $scope.email_option = 'all';
    };

    $scope.queryId = GLOBALS.queryId;
    $scope.email_option = 'all';
    $scope.email_subject = '';
    $scope.email_body = '';
    $scope.invalid = {
      subject: false,
      body: false,
      num_users: false
    };
    $scope.num_of_users_to_send = null;
    $scope.possible_email_intents = [
      'bulk_email_marketing', 'bulk_email_improve_exploration',
      'bulk_email_create_exploration', 'bulk_email_creator_reengagement',
      'bulk_email_learner_reengagement'];
    $scope.email_intent = $scope.possible_email_intents[0];
    $scope.emailSubmitted = false;
  }
]);
