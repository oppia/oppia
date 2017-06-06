// Copyright 2017 The Oppia Authors. All Rights Reserved.
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

oppia.directive('adminRolesTab', [
  '$http', 'ADMIN_HANDLER_URL', 'UrlInterpolationService',
  function(
    $http, ADMIN_HANDLER_URL, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/roles_tab/' +
        'roles_tab_directive.html'),
      controller: ['$scope', function($scope) {

        console.log('hello');
        //defining the scope variables from Globals to be used here.
        $scope.HUMAN_READABLE_CURRENT_TIME = (
          GLOBALS.HUMAN_READABLE_CURRENT_TIME);

    //     $scope.showJobOutput = function(jobId) {
    //       var adminJobOutputUrl = UrlInterpolationService.interpolateUrl(
    //         ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
    //           jobId: jobId
    //         });
    //       $http.get(adminJobOutputUrl).then(function(response) {
    //         $scope.showingJobOutput = true;
    //         $scope.jobOutput = response.data.output || [];
    //         $scope.jobOutput.sort();
    //         $timeout(function() {
    //           document.querySelector('#job-output').scrollIntoView();
    //         });
    //       });
    //     };

    //     $scope.startNewJob = function(jobType) {
    //       $scope.setStatusMessage('Starting new job...');

    //       $http.post(ADMIN_HANDLER_URL, {
    //         action: 'start_new_job',
    //         job_type: jobType
    //       }).then(function() {
    //         $scope.setStatusMessage('Job started successfully.');
    //         window.location.reload();
    //       }, function(errorResponse) {
    //         $scope.setStatusMessage(
    //           'Server error: ' + errorResponse.data.error);
    //       });
    //     };

    //     $scope.cancelJob = function(jobId, jobType) {
    //       $scope.setStatusMessage('Cancelling job...');

    //       $http.post(ADMIN_HANDLER_URL, {
    //         action: 'cancel_job',
    //         job_id: jobId,
    //         job_type: jobType
    //       }).then(function() {
    //         $scope.setStatusMessage('Abort signal sent to job.');
    //         window.location.reload();
    //       }, function(errorResponse) {
    //         $scope.setStatusMessage(
    //           'Server error: ' + errorResponse.data.error);
    //       });
    //     };

    //     $scope.startComputation = function(computationType) {
    //       $scope.setStatusMessage('Starting computation...');

    //       $http.post(ADMIN_HANDLER_URL, {
    //         action: 'start_computation',
    //         computation_type: computationType
    //       }).then(function() {
    //         $scope.setStatusMessage('Computation started successfully.');
    //         window.location.reload();
    //       }, function(errorResponse) {
    //         $scope.setStatusMessage(
    //           'Server error: ' + errorResponse.data.error);
    //       });
    //     };

        // $scope.stopComputation = function(computationType) {
        //   $scope.setStatusMessage('Stopping computation...');

        //   $http.post(ADMIN_HANDLER_URL, {
        //     action: 'stop_computation',
        //     computation_type: computationType
        //   }).then(function() {
        //     $scope.setStatusMessage('Abort signal sent to computation.');
        //     window.location.reload();
        //   }, function(errorResponse) {
        //     $scope.setStatusMessage(
        //       'Server error: ' + errorResponse.data.error);
        //    });
        //  };

        $scope.role_options = [
          'BANNED_USER', 'COLLECTION_EDITOR', 'MODERATOR',
          'ADMIN'
        ]

        $scope.all_roles = [
          'BANNED_USER', 'EXPLORATION_EDITOR', 'COLLECTION_EDITOR',
          'MODERATOR', 'ADMIN'
        ]

        $scope.show_result_roles = 0;
        $scope.result = {};

        $scope.SubmitRoleViewForm = function(values) {
            $scope.result = {};
            if(values.method == 'role') {
                console.log(values.method + " " + values.role);
                $scope.result['yogesh'] = values.role;
                $scope.result['dumbo'] = values.role;
                $scope.result['kuchh bhi'] = values.role;
                $scope.show_result_roles = 1;
            }
            else if(values.method == 'username') {
                console.log(values.method + " " + values.username);
                $scope.result[values.username] = 'BANNED_USER'; 
            }
        }

        $scope.SubmitUpdateRoleForm = function(values) {
            console.log(values.username + " " + values.newrole);
        }

        $scope.graphData = function() {
          return {
            finalStateIds: ['SUPER_ADMIN'],
            initStateId: 'GUEST_USER',
            links: [
              {source: 'GUEST_USER', target: 'BANNED_USER', isFallback:false},
              {source: 'GUEST_USER', target: 'EXPLORATION_EDITOR', isFallback:false},
              {source: 'EXPLORATION_EDITOR', target: 'COLLECTION_EDITOR', isFallback:false},
              {source: 'COLLECTION_EDITOR', target: 'MODERATOR', isFallback:false},
              {source: 'MODERATOR', target: 'ADMIN', isFallback:false},
              {source: 'ADMIN', target: 'SUPER_ADMIN', isFallback:false},
            ],
            nodes: {
              GUEST_USER: 'guest user',
              BANNED_USER: 'banned user',
              EXPLORATION_EDITOR: 'exploration editor',
              COLLECTION_EDITOR: 'collection editor',
              MODERATOR: 'moderator',
              ADMIN: 'admin',
              SUPER_ADMIN: 'super admin'
            }
          }
        }

      }]
    };
  }
]);
