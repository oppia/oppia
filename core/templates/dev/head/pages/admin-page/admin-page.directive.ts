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

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/focus-on.directive.ts');
require('pages/admin-page/navbar/admin-navbar.directive.ts');
require(
  'pages/admin-page/activities-tab/admin-dev-mode-activities-tab.directive.ts');
require(
  'pages/admin-page/activities-tab/' +
  'admin-prod-mode-activities-tab.directive.ts');
require('pages/admin-page/config-tab/admin-config-tab.directive.ts');
require('pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts');
require('pages/admin-page/misc-tab/admin-misc-tab.directive.ts');
require('pages/admin-page/roles-tab/admin-roles-tab.directive.ts');
require('value_generators/valueGeneratorsRequires.ts');

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-router.service.ts');
require('services/csrf-token.service.ts');
require('services/utils.service.ts');

angular.module('oppia').directive('adminPage', ['UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/admin-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$location', '$scope', 'AdminDataService',
        'AdminRouterService', 'CsrfTokenService', 'DEV_MODE',
        function($http, $location, $scope, AdminDataService,
            AdminRouterService, CsrfTokenService, DEV_MODE) {
          var ctrl = this;
          ctrl.userEmail = '';
          AdminDataService.getDataAsync().then(function(response) {
            ctrl.userEmail = response.user_email;
          });
          ctrl.inDevMode = DEV_MODE;

          ctrl.statusMessage = '';
          ctrl.isActivitiesTabOpen = function() {
            return AdminRouterService.isActivitiesTabOpen();
          };
          ctrl.isJobsTabOpen = function() {
            return AdminRouterService.isJobsTabOpen();
          };
          ctrl.isConfigTabOpen = function() {
            return AdminRouterService.isConfigTabOpen();
          };
          ctrl.isRolesTabOpen = function() {
            return AdminRouterService.isRolesTabOpen();
          };
          ctrl.isMiscTabOpen = function() {
            return AdminRouterService.isMiscTabOpen();
          };

          CsrfTokenService.initializeToken();

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
