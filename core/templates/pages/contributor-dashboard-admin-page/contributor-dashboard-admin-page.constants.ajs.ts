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
 * @fileoverview Constants for the contributor dashboard admin page.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ContributorDashboardAdminPageConstants as PageConstants } from './contributor-dashboard-admin-page.constants';

angular.module('oppia').constant(
  'CONTRIBUTION_RIGHTS_HANDLER_URL',
  PageConstants.CONTRIBUTION_RIGHTS_HANDLER_URL);
angular.module('oppia').constant(
  'CONTRIBUTION_RIGHTS_DATA_HANDLER_URL',
  PageConstants.CONTRIBUTION_RIGHTS_DATA_HANDLER_URL);
angular.module('oppia').constant(
  'GET_CONTRIBUTOR_USERS_HANDLER_URL',
  PageConstants.GET_CONTRIBUTOR_USERS_HANDLER_URL);
angular.module('oppia').constant(
  'TRANSLATION_CONTRIBUTION_STATS_HANDLER_URL',
  PageConstants.TRANSLATION_CONTRIBUTION_STATS_HANDLER_URL);
