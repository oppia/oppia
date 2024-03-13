// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

export const ContributorDashboardAdminPageConstants = {
  CONTRIBUTION_RIGHTS_HANDLER_URL: '/contributionrightshandler/<category>',
  CONTRIBUTION_RIGHTS_DATA_HANDLER_URL: '/contributionrightsdatahandler',
  GET_CONTRIBUTOR_USERS_HANDLER_URL: '/getcontributorusershandler/<category>',
  TRANSLATION_CONTRIBUTION_STATS_HANDLER_URL:
    '/translationcontributionstatshandler',
  CONTRIBUTOR_ADMIN_STATS_SUMMARIES_URL:
    '/contributor-dashboard-admin-stats/<contribution_type>' +
    '/<contribution_subtype>',
  COMMUNITY_CONTRIBUTION_STATS_URL: '/community-contribution-stats',
  ADMIN_ROLE_HANDLER_URL: '/adminrolehandler',
  DEFAULT_LANGUAGE_FILTER: 'en',
} as const;
