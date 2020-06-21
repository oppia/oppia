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
 * @fileoverview Constants for the Learner dashboard.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { LearnerDashboardPageConstants } from
  'pages/learner-dashboard-page/learner-dashboard-page.constants';

angular.module('oppia').constant(
  'LEARNER_DASHBOARD_SECTION_I18N_IDS',
  LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS);

angular.module('oppia').constant(
  'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS',
  LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);

angular.module('oppia').constant(
  'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
  LearnerDashboardPageConstants.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);

angular.module('oppia').constant(
  'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS',
  LearnerDashboardPageConstants.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);

angular.module('oppia').constant(
  'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
  LearnerDashboardPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
