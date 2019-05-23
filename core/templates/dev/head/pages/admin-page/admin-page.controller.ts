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
 * @fileoverview Controllers for the Oppia admin page.
 */

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('directives/FocusOnDirective.ts');
require('components/forms/forms-validators/is-at-least.filter.ts');
require('components/forms/forms-validators/is-at-most.filter.ts');
require('components/forms/forms-validators/is-float.filter.ts');
require('components/forms/forms-validators/is-integer.filter.ts');
require('components/forms/forms-validators/is-nonempty.filter.ts');
require(
  'components/forms/forms-directives/apply-validation/' +
  'apply-validation.directive.ts');
require(
  'components/forms/forms-directives/object-editor/' +
  'object-editor.directive.ts');
require(
  'components/forms/forms-directives/require-is-float/' +
  'require-is-float.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-bool-editor/schema-based-bool-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-choices-editor/schema-based-choices-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-custom-editor/schema-based-custom-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-dict-editor/schema-based-dict-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-float-editor/schema-based-float-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-html-editor/schema-based-html-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-int-editor/schema-based-int-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-list-editor/schema-based-list-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-unicode-editor/schema-based-unicode-editor.directive.ts');
// ^^^ this block of requires should be removed ^^^

require('pages/admin-page/admin-navbar/admin-navbar.directive.ts');
require(
  'pages/admin-page/activities-tab/admin-dev-mode-activities-tab/' +
  'admin-dev-mode-activities-tab.directive.ts');
require(
  'pages/admin-page/activities-tab/admin-prod-mode-activities-tab/' +
  'admin-prod-mode-activities-tab.directive.ts');
require('pages/admin-page/config-tab/admin-config-tab.directive.ts');
require('pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts');
require('pages/admin-page/misc-tab/admin-misc-tab.directive.ts');
require('pages/admin-page/roles-tab/admin-roles-tab.directive.ts');

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/admin-page/admin-page-services/admin-router/admin-router.service.ts');
require('services/UtilsService.ts');

oppia.controller('Admin', [
    '$http', '$location', '$scope', 'AdminRouterService', 'DEV_MODE',
  function($http, $location, $scope, AdminRouterService, DEV_MODE) {
    $scope.userEmail = GLOBALS.USER_EMAIL;
    $scope.inDevMode = DEV_MODE;

    $scope.statusMessage = '';
    $scope.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
    $scope.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
    $scope.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
    $scope.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
    $scope.isMiscTabOpen = AdminRouterService.isMiscTabOpen;

    $scope.setStatusMessage = function(statusMessage) {
      $scope.statusMessage = statusMessage;
    };

    $scope.$on('$locationChangeSuccess', function() {
      AdminRouterService.showTab($location.path().replace('/', '#'));
    });
  }
]);

