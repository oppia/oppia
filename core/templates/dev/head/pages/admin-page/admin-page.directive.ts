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

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('directives/FocusOnDirective.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require('components/forms/custom-forms-directives/object-editor.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
// ^^^ this block of requires should be removed ^^^

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
require('domain/utilities/UrlInterpolationService.ts');
require('pages/admin-page/services/admin-router.service.ts');
require('services/CsrfTokenService.ts');
require('services/UtilsService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('adminPage', ['UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/admin-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$location', '$scope', 'AdminRouterService',
        'CsrfTokenService', 'DEV_MODE',
        function($http, $location, $scope, AdminRouterService,
            CsrfTokenService, DEV_MODE) {
          var ctrl = this;
          ctrl.userEmail = GLOBALS.USER_EMAIL;
          ctrl.inDevMode = DEV_MODE;

          ctrl.statusMessage = '';
          ctrl.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
          ctrl.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
          ctrl.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
          ctrl.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
          ctrl.isMiscTabOpen = AdminRouterService.isMiscTabOpen;

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
