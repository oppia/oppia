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

require('domain/admin/admin-backend-api.service');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminJobsTab', [
  '$rootScope', '$timeout', 'AdminBackendApiService',
  'AdminDataService', 'UrlInterpolationService',
  function(
      $rootScope, $timeout, AdminBackendApiService,
      AdminDataService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/jobs-tab/admin-jobs-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.showJobOutput = function(jobId) {
          AdminBackendApiService.fetchJobOutputAsync(jobId)
            .then(function(jobOutput) {
              ctrl.showingJobOutput = true;
              ctrl.jobOutput = jobOutput;
              $timeout(function() {
                document.querySelector('#job-output').scrollIntoView();
              });
            }, function(errorMessage) {
              ctrl.setStatusMessage(
                'Server error: ' + errorMessage);
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        };

        ctrl.startNewJob = function(jobType) {
          ctrl.setStatusMessage('Starting new job...');

          AdminBackendApiService.startNewJobAsync(jobType)
            .then(function() {
              ctrl.setStatusMessage('Job started successfully.');
              window.location.reload();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, function(errorMessage) {
              ctrl.setStatusMessage(
                'Server error: ' + errorMessage);
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        };

        ctrl.cancelJob = function(jobId, jobType) {
          ctrl.setStatusMessage('Cancelling job...');

          AdminBackendApiService.cancelJobAsync(jobId, jobType)
            .then(function() {
              ctrl.setStatusMessage('Abort signal sent to job.');
              window.location.reload();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, function(errorMessage) {
              ctrl.setStatusMessage(
                'Server error: ' + errorMessage);
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        };

        ctrl.startComputation = function(computationType) {
          ctrl.setStatusMessage('Starting computation...');

          AdminBackendApiService.startComputationAsync(computationType)
            .then(function() {
              ctrl.setStatusMessage('Computation started successfully.');
              window.location.reload();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, function(errorMessage) {
              ctrl.setStatusMessage(
                'Server error: ' + errorMessage);
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        };

        ctrl.stopComputation = function(computationType) {
          ctrl.setStatusMessage('Stopping computation...');

          AdminBackendApiService.stopComputationAsync(computationType)
            .then(function() {
              ctrl.setStatusMessage('Abort signal sent to computation.');
              window.location.reload();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, function(errorMessage) {
              ctrl.setStatusMessage(
                'Server error: ' + errorMessage);
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            });
        };
        ctrl.$onInit = function() {
          ctrl.HUMAN_READABLE_CURRENT_TIME = '';
          ctrl.CONTINUOUS_COMPUTATIONS_DATA = {};
          ctrl.ONE_OFF_JOB_SPECS = {};
          ctrl.UNFINISHED_JOB_DATA = {};
          ctrl.AUDIT_JOB_SPECS = {};
          ctrl.RECENT_JOB_DATA = {};
          AdminDataService.getDataAsync().then(function(adminDataObject) {
            ctrl.HUMAN_READABLE_CURRENT_TIME = (
              adminDataObject.humanReadeableCurrentTime);
            ctrl.CONTINUOUS_COMPUTATIONS_DATA = (
              adminDataObject.continuousComputationsData);
            ctrl.ONE_OFF_JOB_SPECS = adminDataObject.oneOffJobStatusSummaries;
            ctrl.UNFINISHED_JOB_DATA = adminDataObject.unfinishedJobData;
            ctrl.AUDIT_JOB_SPECS = adminDataObject.auditJobStatusSummaries;
            ctrl.RECENT_JOB_DATA = adminDataObject.recentJobData;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          });

          ctrl.showingJobOutput = false;
        };
      }]
    };
  }
]);
