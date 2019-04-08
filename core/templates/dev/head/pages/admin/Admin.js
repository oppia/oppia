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
 * @fileoverview Data and controllers for the Oppia admin page.
 */

//vvv this block of requires should be removed vvv
require('directives/FocusOnDirective.js');
require('components/forms/validators/IsAtLeastFilter.js');
require('components/forms/validators/IsAtMostFilter.js');
require('components/forms/validators/IsFloatFilter.js');
require('components/forms/validators/IsIntegerFilter.js');
require('components/forms/validators/IsNonemptyFilter.js');
require('components/forms/ApplyValidationDirective.js');
require('components/forms/ObjectEditorDirective.js');
require('components/forms/RequireIsFloatDirective.js');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedExpressionEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.js');
//^^^ this block of requires should be removed ^^^

require('pages/admin/AdminNavbarDirective.js');
require('pages/admin/activities_tab/AdminDevModeActivitiesTabDirective.js');
require('pages/admin/activities_tab/AdminProdModeActivitiesTabDirective.js');
require('pages/admin/config_tab/AdminConfigTabDirective.js');
require('pages/admin/jobs_tab/AdminJobsTabDirective.js');
require('pages/admin/misc_tab/AdminMiscTabDirective.js');
require('pages/admin/roles_tab/AdminRolesTabDirective.js');

require('domain/objects/NumberWithUnitsObjectFactory.js');
require('domain/utilities/UrlInterpolationService.js');
require('pages/admin/AdminRouterService.js');
require('services/UtilsService.js');

oppia.constant('ADMIN_HANDLER_URL', '/adminhandler');
oppia.constant('ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');
oppia.constant('PROFILE_URL_TEMPLATE', '/profile/<username>');
oppia.constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');
oppia.constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');

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
