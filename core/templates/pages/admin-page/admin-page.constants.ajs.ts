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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';

angular.module('oppia').constant(
  'ADMIN_ROLE_HANDLER_URL', AdminPageConstants.ADMIN_ROLE_HANDLER_URL);

angular.module('oppia').constant(
  'ADMIN_HANDLER_URL', AdminPageConstants.ADMIN_HANDLER_URL);
angular.module('oppia').constant(
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL',
  AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL);

angular.module('oppia').constant(
  'ADMIN_BANNED_USERS_HANDLER', AdminPageConstants.ADMIN_BANNED_USERS_HANDLER);

angular.module('oppia').constant(
  'ADMIN_JOB_OUTPUT_URL_TEMPLATE',
  AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE);

angular.module('oppia').constant(
  'ADMIN_TAB_URLS', AdminPageConstants.ADMIN_TAB_URLS);

angular.module('oppia').constant(
  'PROFILE_URL_TEMPLATE', AdminPageConstants.PROFILE_URL_TEMPLATE);
