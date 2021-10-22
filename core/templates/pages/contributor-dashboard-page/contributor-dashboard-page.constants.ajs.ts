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
 * @fileoverview Constants to be used in the contributor dashboard page.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ContributorDashboardConstants } from
  'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

angular.module('oppia').constant(
  'CONTRIBUTOR_DASHBOARD_TABS_DETAILS',
  ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS
);

angular.module('oppia').constant(
  'CORRESPONDING_DELETED_OPPORTUNITY_TEXT',
  ContributorDashboardConstants.CORRESPONDING_DELETED_OPPORTUNITY_TEXT);

angular.module('oppia').constant(
  'DEFAULT_OPPORTUNITY_LANGUAGE_CODE',
  ContributorDashboardConstants.DEFAULT_OPPORTUNITY_LANGUAGE_CODE);

angular.module('oppia').constant(
  'DEFAULT_OPPORTUNITY_TOPIC_NAME',
  ContributorDashboardConstants.DEFAULT_OPPORTUNITY_TOPIC_NAME);
