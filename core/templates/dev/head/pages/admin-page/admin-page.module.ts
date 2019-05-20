// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data and Module for the Oppia admin page.
 */

var load = require.context('./', true, /\.module\.ts$/)
load.keys().forEach(load);
module.exports = angular.module('adminPageModule', []).name;

angular.module('adminPageModule', [
  'adminNavbarModule', 'adminConfigTabModule', 'adminJobsTabModule',
  'adminMiscTabModule', 'adminRolesTabModule', 'roleGraphModule',
  'adminDevModeActivitiesTabModule', 'adminProdModeActivitiesTab']);

angular.module('adminPageModule').constant('ADMIN_HANDLER_URL', '/adminhandler');
angular.module('adminPageModule')
  .constant('ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');
angular.module('adminPageModule')
  .constant('PROFILE_URL_TEMPLATE', '/profile/<username>');
angular.module('adminPageModule').constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');
angular.module('adminPageModule').constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');
angular.module('adminPageModule').constant('ADMIN_TAB_URLS', {
  ACTIVITIES: '#activities',
  JOBS: '#jobs',
  CONFIG: '#config',
  ROLES: '#roles',
  MISC: '#misc'
});  
