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
  '$scope', '$http', function($scope, $http) {
    var EMAIL_POST_HANDLER='/emaildashboardresult';

    $scope.submitEmail = function() {
      var postLink = EMAIL_POST_HANDLER + '/' + $scope.queryId;
      var invalidData = false;
      var data = {
        email_subject: $scope.email_subject,
        email_body: $scope.email_body,
        email_option: $scope.email_option,
        num_of_users_to_send: $scope.num_of_users_to_send
      };

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

      if(! invalidData) {
        $http.post(postLink, {
          data: data
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

    $scope.queryId =  GLOBALS.queryId;
    $scope.email_option = 'all';
    $scope.email_subject = '';
    $scope.email_body = '';
    $scope.invalid = {
      subject: false,
      body: false,
      num_users: false
    };
    $scope.num_of_users_to_send = null;
    $scope.email_intents = ['Marketing email']
  }
]);
