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
 * @fileoverview Constants for the Oppia admin page.
 */

angular.module('oppia').constant(
  'ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');

angular.module('oppia').constant('ADMIN_HANDLER_URL', '/adminhandler');
angular.module('oppia').constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');

angular.module('oppia').constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');

angular.module('oppia').constant('ADMIN_TAB_URLS', {
  ACTIVITIES: '#activities',
  JOBS: '#jobs',
  CONFIG: '#config',
  ROLES: '#roles',
  MISC: '#misc'
});

angular.module('oppia').constant(
  'PROFILE_URL_TEMPLATE', '/profile/<username>');
