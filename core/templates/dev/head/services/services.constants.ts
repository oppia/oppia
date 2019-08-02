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

angular.module('oppia').constant('PAGE_CONTEXT', {
  EXPLORATION_EDITOR: 'editor',
  EXPLORATION_PLAYER: 'learner',
  QUESTION_EDITOR: 'question_editor',
  QUESTION_PLAYER: 'question_player',
  OTHER: 'other'
});

angular.module('oppia').constant('EXPLORATION_EDITOR_TAB_CONTEXT', {
  EDITOR: 'editor',
  PREVIEW: 'preview'
});

angular.module('oppia').constant(
  'EXPLORATION_FEATURES_URL', '/explorehandler/features/<exploration_id>');

angular.module('oppia').constant(
  'FETCH_ISSUES_URL', '/issuesdatahandler/<exploration_id>');

angular.module('oppia').constant(
  'FETCH_PLAYTHROUGH_URL',
  '/playthroughdatahandler/<exploration_id>/<playthrough_id>');

angular.module('oppia').constant(
  'RESOLVE_ISSUE_URL', '/resolveissuehandler/<exploration_id>');

angular.module('oppia').constant(
  'STORE_PLAYTHROUGH_URL',
  '/explorehandler/store_playthrough/<exploration_id>');

// Enables recording playthroughs from learner sessions.
angular.module('oppia').constant('EARLY_QUIT_THRESHOLD_IN_SECS', 45);
angular.module('oppia').constant('NUM_INCORRECT_ANSWERS_THRESHOLD', 3);
angular.module('oppia').constant('NUM_REPEATED_CYCLES_THRESHOLD', 3);
angular.module('oppia').constant('CURRENT_ACTION_SCHEMA_VERSION', 1);
angular.module('oppia').constant('CURRENT_ISSUE_SCHEMA_VERSION', 1);

// Whether to enable the promo bar functionality. This does not actually turn on
// the promo bar, as that is gated by a config value (see config_domain). This
// merely avoids checking for whether the promo bar is enabled for every Oppia
// page visited.
angular.module('oppia').constant('ENABLE_PROMO_BAR', true);

angular.module('oppia').constant('RTE_COMPONENT_SPECS', richTextComponents);

angular.module('oppia').constant('SEARCH_DATA_URL', '/searchhandler/data');

angular.module('oppia').constant(
  'STATE_ANSWER_STATS_URL',
  '/createhandler/state_answer_stats/<exploration_id>');
