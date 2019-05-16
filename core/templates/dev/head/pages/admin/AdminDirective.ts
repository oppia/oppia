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
 * @fileoverview Data and directive for the Oppia admin page.
 */

oppia.constant('ADMIN_HANDLER_URL', '/adminhandler');
oppia.constant('ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');
oppia.constant('PROFILE_URL_TEMPLATE', '/profile/<username>');
oppia.constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');
oppia.constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');

oppia.directive('admin', ['UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/admin_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$location', '$scope ', 'AdminRouterService', 'DEV_MODE',
        function($http, $location, $scope, AdminRouterService, DEV_MODE) {
          var ctrl = this;
          ctrl.userEmail = GLOBALS.USER_EMAIL;
          ctrl.inDevMode = DEV_MODE;

          ctrl.statusMessage = '';
          ctrl.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
          ctrl.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
          ctrl.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
          ctrl.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
          ctrl.isMiscTabOpen = AdminRouterService.isMiscTabOpen;

          ctrl.setStatusMessage = function(statusMessage) {
            ctrl.statusMessage = statusMessage;
          };

          $scope.$on('$locationChangeSuccess', function() {
            AdminRouterService.showTab($location.path().replace('/', '#'));
          });
        }
      ]
    };
  }
]);
