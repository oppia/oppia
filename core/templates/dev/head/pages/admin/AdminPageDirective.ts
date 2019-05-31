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
require('components/forms/validators/IsAtLeastFilter.ts');
require('components/forms/validators/IsAtMostFilter.ts');
require('components/forms/validators/IsFloatFilter.ts');
require('components/forms/validators/IsIntegerFilter.ts');
require('components/forms/validators/IsNonemptyFilter.ts');
require('components/forms/ApplyValidationDirective.ts');
require('components/forms/ObjectEditorDirective.ts');
require('components/forms/RequireIsFloatDirective.ts');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedEditorDirective.ts');
require(
  'components/forms/schema_editors/SchemaBasedExpressionEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.ts');
// ^^^ this block of requires should be removed ^^^

require('pages/admin/AdminNavbarDirective.ts');
require('pages/admin/activities_tab/AdminDevModeActivitiesTabDirective.ts');
require('pages/admin/activities_tab/AdminProdModeActivitiesTabDirective.ts');
require('pages/admin/config_tab/AdminConfigTabDirective.ts');
require('pages/admin/jobs_tab/AdminJobsTabDirective.ts');
require('pages/admin/misc_tab/AdminMiscTabDirective.ts');
require('pages/admin/roles_tab/AdminRolesTabDirective.ts');

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/admin/AdminRouterService.ts');
require('services/UtilsService.ts');

oppia.constant('ADMIN_HANDLER_URL', '/adminhandler');
oppia.constant('ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');
oppia.constant('PROFILE_URL_TEMPLATE', '/profile/<username>');
oppia.constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');
oppia.constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');

oppia.directive('adminPage', ['UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/admin_page_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$location', '$scope', 'AdminRouterService', 'DEV_MODE',
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
