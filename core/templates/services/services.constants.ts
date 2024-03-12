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

import RTE_COMPONENT_SPECS from 'assets/rich_text_components_definitions';

export const ServicesConstants = {
  PAGE_CONTEXT: {
    COLLECTION_EDITOR: 'collection_editor',
    LEARNER_GROUP_EDITOR: 'learner_group_editor',
    EXPLORATION_EDITOR: 'editor',
    EXPLORATION_PLAYER: 'learner',
    QUESTION_EDITOR: 'question_editor',
    QUESTION_PLAYER: 'question_player',
    SKILL_EDITOR: 'skill_editor',
    STORY_EDITOR: 'story_editor',
    TOPIC_EDITOR: 'topic_editor',
    TOPICS_AND_SKILLS_DASHBOARD: 'topics_and_skills_dashboard',
    CONTRIBUTOR_DASHBOARD: 'contributor_dashboard',
    BLOG_DASHBOARD: 'blog_dashboard',
    OTHER: 'other',
  },

  EXPLORATION_EDITOR_TAB_CONTEXT: {
    EDITOR: 'editor',
    PREVIEW: 'preview',
  },

  EXPLORATION_FEATURES_URL: '/explorehandler/features/<exploration_id>',

  FETCH_ISSUES_URL: '/issuesdatahandler/<exploration_id>',

  FETCH_PLAYTHROUGH_URL:
    '/playthroughdatahandler/<exploration_id>/<playthrough_id>',

  RESOLVE_ISSUE_URL: '/resolveissuehandler/<exploration_id>',

  PROMO_BAR_URL: '/promo_bar_handler',

  STORE_PLAYTHROUGH_URL: '/explorehandler/store_playthrough/<exploration_id>',

  // Enables recording playthroughs from learner sessions.
  MIN_PLAYTHROUGH_DURATION_IN_SECS: 45,
  EARLY_QUIT_THRESHOLD_IN_SECS: 300,
  NUM_INCORRECT_ANSWERS_THRESHOLD: 3,
  NUM_REPEATED_CYCLES_THRESHOLD: 3,
  CURRENT_ACTION_SCHEMA_VERSION: 1,
  CURRENT_ISSUE_SCHEMA_VERSION: 1,

  // Whether to enable the promo bar functionality. This does not actually turn
  // on the promo bar, as that is gated by a config value (see config_domain).
  // This merely avoids checking for whether the promo bar is enabled for every
  // Oppia page visited.
  ENABLE_PROMO_BAR: true,

  SEARCH_DATA_URL: '/searchhandler/data',

  STATE_ANSWER_STATS_URL: '/createhandler/state_answer_stats/<exploration_id>',

  RTE_COMPONENT_SPECS: RTE_COMPONENT_SPECS,

  MESSENGER_PAYLOAD: {
    HEIGHT_CHANGE: 'heightChange',
    EXPLORATION_LOADED: 'explorationLoaded',
    STATE_TRANSITION: 'stateTransition',
    EXPLORATION_RESET: 'explorationReset',
    EXPLORATION_COMPLETED: 'explorationCompleted',
  },
} as const;
