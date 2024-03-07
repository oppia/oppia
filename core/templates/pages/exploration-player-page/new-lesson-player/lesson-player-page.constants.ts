// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants to be used in the learner view.
 */

export const NewLessonPlayerConstants = {
  CONTENT_FOCUS_LABEL_PREFIX: 'content-focus-label-',

  TWO_CARD_THRESHOLD_PX: 960,

  CONTINUE_BUTTON_FOCUS_LABEL: 'continueButton',

  // The enforced waiting period before the first hint request.
  WAIT_FOR_FIRST_HINT_MSEC: 60000,
  // The enforced waiting period before each of the subsequent hint requests.
  WAIT_FOR_SUBSEQUENT_HINTS_MSEC: 30000,

  // The time delay between the learner clicking the hint button
  // and the appearance of the hint.
  DELAY_FOR_HINT_FEEDBACK_MSEC: 100,

  // The enforced waiting period before the concept card
  // icon appears.
  WAIT_FOR_CONCEPT_CARD_MSEC: 60000,

  // The time delay after all the hints are exhausted, or after
  // the concept card is used. This is the stage when the learner
  // is said to be really stuck.
  WAIT_BEFORE_RESPONSE_FOR_STUCK_LEARNER_MSEC: 150000,

  // The time delay after all the hints are exhausted, or after
  // the concept card is used. This is the stage when the learner
  // is said to be really stuck.
  WAIT_BEFORE_REALLY_STUCK_MSEC: 160000,

  // The threshold for incorrect answers submitted after either
  // exhausting all the hints, or after using the concept card,
  // after which the learner is said to be really stuck.
  MAX_INCORRECT_ANSWERS_BEFORE_REALLY_STUCK: 3,

  MAX_INCORRECT_ANSWERS_BEFORE_RELEASING_SOLUTION: 3,

  // Array of i18n IDs for the possible hint request strings.
  HINT_REQUEST_STRING_I18N_IDS: [
    'I18N_PLAYER_HINT_REQUEST_STRING_1',
    'I18N_PLAYER_HINT_REQUEST_STRING_2',
    'I18N_PLAYER_HINT_REQUEST_STRING_3'],

  // Array of i18n IDs for nudging the learner towards checking the spelling.
  I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_IDS: [
    'I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_0',
    'I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_1',
    'I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_2'
  ],

  // Threshold value of edit distance for judging an answer as a misspelling.
  THRESHOLD_EDIT_DISTANCE_FOR_MISSPELLINGS: 2,
  // Answers shorter than this will not be checked for misspellings.
  // If half of the symbols in the answer are wrong it's probably
  // not a misspelling.
  MIN_ANSWER_LENGTH_TO_CHECK_MISSPELLINGS: 5,

  /* This should match the CSS class defined in the tutor card directive. */
  AUDIO_HIGHLIGHT_CSS_CLASS: 'conversation-skin-audio-highlight',

  FLAG_EXPLORATION_URL_TEMPLATE: '/flagexplorationhandler/<exploration_id>',

  // NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
  // the corresponding classification constants defined in
  // core.domain.exp_domain.
  EXPLICIT_CLASSIFICATION: 'explicit',
  TRAINING_DATA_CLASSIFICATION: 'training_data_match',
  STATISTICAL_CLASSIFICATION: 'statistical_classifier',
  DEFAULT_OUTCOME_CLASSIFICATION: 'default_outcome',

  EXPLORATION_MODE: {
    DIAGNOSTIC_TEST_PLAYER: 'diagnostic_test_player',
    EXPLORATION: 'exploration',
    PRETEST: 'pretest',
    QUESTION_PLAYER: 'question_player',
    STORY_CHAPTER: 'story_chapter',
  },

  STATS_EVENT_TYPES: {
    EVENT_TYPE_START_EXPLORATION: 'start',
    EVENT_TYPE_ACTUAL_START_EXPLORATION: 'actual_start',
    EVENT_TYPE_COMPLETE_EXPLORATION: 'complete',
    EVENT_TYPE_STATE_HIT: 'state_hit',
    EVENT_TYPE_STATE_COMPLETED: 'state_complete',
    EVENT_TYPE_ANSWER_SUBMITTED: 'answer_submitted',
    EVENT_TYPE_SOLUTION_HIT: 'solution_hit',
    EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP: 'leave_for_refresher_exp',
  },

  STATS_REPORTING_URLS: {
    ANSWER_SUBMITTED: '/explorehandler/answer_submitted_event/<exploration_id>',
    EXPLORATION_COMPLETED: (
      '/explorehandler/exploration_complete_event/<exploration_id>'),
    EXPLORATION_MAYBE_LEFT: (
      '/explorehandler/exploration_maybe_leave_event/<exploration_id>'),
    EXPLORATION_STARTED: (
      '/explorehandler/exploration_start_event/<exploration_id>'),
    STATE_HIT: '/explorehandler/state_hit_event/<exploration_id>',
    STATE_COMPLETED: '/explorehandler/state_complete_event/<exploration_id>',
    EXPLORATION_ACTUALLY_STARTED: (
      '/explorehandler/exploration_actual_start_event/<exploration_id>'),
    SOLUTION_HIT: '/explorehandler/solution_hit_event/<exploration_id>',
    LEAVE_FOR_REFRESHER_EXP: (
      '/explorehandler/leave_for_refresher_exp_event/<exploration_id>'),
    STATS_EVENTS: '/explorehandler/stats_events/<exploration_id>'
  },

  FEEDBACK_POPOVER_PATH:
    '/pages/exploration-player-page/templates/' +
    'feedback-popup-container.template.html',
} as const;
