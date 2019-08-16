// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for shared services across Oppia.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ServicesConstants } from 'services/services.constants';

angular.module('oppia').constant(
  'PAGE_CONTEXT', ServicesConstants.PAGE_CONTEXT);

angular.module('oppia').constant(
  'EXPLORATION_EDITOR_TAB_CONTEXT',
  ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT);

angular.module('oppia').constant(
  'EXPLORATION_FEATURES_URL', ServicesConstants.EXPLORATION_FEATURES_URL);

angular.module('oppia').constant(
  'FETCH_ISSUES_URL', ServicesConstants.FETCH_ISSUES_URL);

angular.module('oppia').constant(
  'FETCH_PLAYTHROUGH_URL',
  ServicesConstants.FETCH_PLAYTHROUGH_URL);

angular.module('oppia').constant(
  'RESOLVE_ISSUE_URL', ServicesConstants.RESOLVE_ISSUE_URL);

angular.module('oppia').constant(
  'STORE_PLAYTHROUGH_URL',
  ServicesConstants.STORE_PLAYTHROUGH_URL);

// Enables recording playthroughs from learner sessions.
angular.module('oppia').constant(
  'EARLY_QUIT_THRESHOLD_IN_SECS',
  ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS);
angular.module('oppia').constant(
  'NUM_INCORRECT_ANSWERS_THRESHOLD',
  ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD);
angular.module('oppia').constant(
  'NUM_REPEATED_CYCLES_THRESHOLD',
  ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD);
angular.module('oppia').constant(
  'CURRENT_ACTION_SCHEMA_VERSION',
  ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION);
angular.module('oppia').constant(
  'CURRENT_ISSUE_SCHEMA_VERSION',
  ServicesConstants.CURRENT_ISSUE_SCHEMA_VERSION);

// Whether to enable the promo bar functionality. This does not actually turn on
// the promo bar, as that is gated by a config value (see config_domain). This
// merely avoids checking for whether the promo bar is enabled for every Oppia
// page visited.
angular.module('oppia').constant(
  'ENABLE_PROMO_BAR', ServicesConstants.ENABLE_PROMO_BAR);

angular.module('oppia').constant(
  'RTE_COMPONENT_SPECS', ServicesConstants.RTE_COMPONENT_SPECS);

angular.module('oppia').constant(
  'SEARCH_DATA_URL', ServicesConstants.SEARCH_DATA_URL);

angular.module('oppia').constant(
  'STATE_ANSWER_STATS_URL',
  ServicesConstants.STATE_ANSWER_STATS_URL);
