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
 * @fileoverview Directive for the jobs tab in the admin panel.
 */

oppia.directive('adminJobsTab', [
  '$http', '$timeout', 'UrlInterpolationService', 'ADMIN_HANDLER_URL',
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE',
  function(
      $http, $timeout, UrlInterpolationService, ADMIN_HANDLER_URL,
      ADMIN_JOB_OUTPUT_URL_TEMPLATE) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: 'admin/jobsTab',
      controller: ['$scope', function($scope) {
        $scope.HUMAN_READABLE_CURRENT_TIME = (
          GLOBALS.HUMAN_READABLE_CURRENT_TIME);
        $scope.CONTINUOUS_COMPUTATIONS_DATA = (
          GLOBALS.CONTINUOUS_COMPUTATIONS_DATA);
        $scope.ONE_OFF_JOB_SPECS = GLOBALS.ONE_OFF_JOB_SPECS;
        $scope.UNFINISHED_JOB_DATA = GLOBALS.UNFINISHED_JOB_DATA;
        $scope.RECENT_JOB_DATA = GLOBALS.RECENT_JOB_DATA;

        $scope.showingJobOutput = false;
        $scope.showJobOutput = function(jobId) {
          var adminJobOutputUrl = UrlInterpolationService.interpolateUrl(
            ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
              jobId: jobId
            });
          $http.get(adminJobOutputUrl).then(function(response) {
            $scope.showingJobOutput = true;
            $scope.jobOutput = response.data.output;
            $timeout(function() {
              document.querySelector('#job-output').scrollIntoView();
            });
          });
        };

        $scope.startNewJob = function(jobType) {
          $scope.setStatusMessage('Starting new job...');

          $http.post(ADMIN_HANDLER_URL, {
            action: 'start_new_job',
            job_type: jobType
          }).then(function() {
            $scope.setStatusMessage('Job started successfully.');
            window.location.reload();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };

        $scope.cancelJob = function(jobId, jobType) {
          $scope.setStatusMessage('Cancelling job...');

          $http.post(ADMIN_HANDLER_URL, {
            action: 'cancel_job',
            job_id: jobId,
            job_type: jobType
          }).then(function() {
            $scope.setStatusMessage('Abort signal sent to job.');
            window.location.reload();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };

        $scope.startComputation = function(computationType) {
          $scope.setStatusMessage('Starting computation...');

          $http.post(ADMIN_HANDLER_URL, {
            action: 'start_computation',
            computation_type: computationType
          }).then(function() {
            $scope.setStatusMessage('Computation started successfully.');
            window.location.reload();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };

        $scope.stopComputation = function(computationType) {
          $scope.setStatusMessage('Stopping computation...');

          $http.post(ADMIN_HANDLER_URL, {
            action: 'stop_computation',
            computation_type: computationType
          }).then(function() {
            $scope.setStatusMessage('Abort signal sent to computation.');
            window.location.reload();
          }, function(errorResponse) {
            $scope.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
          });
        };
      }]
    };
  }
]);
