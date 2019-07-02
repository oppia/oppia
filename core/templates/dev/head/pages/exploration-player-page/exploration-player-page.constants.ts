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
 * @fileoverview Constants to be used in the learner view.
 */

var oppia = require('AppInit.ts').module;

oppia.constant('CONTENT_FOCUS_LABEL_PREFIX', 'content-focus-label-');

oppia.constant('TWO_CARD_THRESHOLD_PX', 960);

oppia.constant('CONTINUE_BUTTON_FOCUS_LABEL', 'continueButton');

/* Called when a new audio-equippable component is loaded and displayed
   to the user, allowing for the automatic playing of audio if necessary. */
oppia.constant('EVENT_AUTOPLAY_AUDIO', 'autoPlayAudio');

// The enforced waiting period before the first hint request.
oppia.constant('WAIT_FOR_FIRST_HINT_MSEC', 60000);
// The enforced waiting period before each of the subsequent hint requests.
oppia.constant('WAIT_FOR_SUBSEQUENT_HINTS_MSEC', 30000);

// The time delay between the learner clicking the hint button
// and the appearance of the hint.
oppia.constant('DELAY_FOR_HINT_FEEDBACK_MSEC', 100);

// Array of i18n IDs for the possible hint request strings.
oppia.constant(
  'HINT_REQUEST_STRING_I18N_IDS', [
    'I18N_PLAYER_HINT_REQUEST_STRING_1',
    'I18N_PLAYER_HINT_REQUEST_STRING_2',
    'I18N_PLAYER_HINT_REQUEST_STRING_3']);

/* This should match the CSS class defined in the tutor card directive. */
oppia.constant(
  'AUDIO_HIGHLIGHT_CSS_CLASS', 'conversation-skin-audio-highlight');

oppia.constant(
  'FLAG_EXPLORATION_URL_TEMPLATE', '/flagexplorationhandler/<exploration_id>');

// TODO(bhenning): Find a better place for these constants.

// NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
// the corresponding classification constants defined in core.domain.exp_domain.
oppia.constant('EXPLICIT_CLASSIFICATION', 'explicit');
oppia.constant('TRAINING_DATA_CLASSIFICATION', 'training_data_match');
oppia.constant('STATISTICAL_CLASSIFICATION', 'statistical_classifier');
oppia.constant('DEFAULT_OUTCOME_CLASSIFICATION', 'default_outcome');

oppia.constant('EXPLORATION_MODE', {
  EXPLORATION: 'exploration',
  PRETEST: 'pretest',
  QUESTION_PLAYER: 'question_player',
  STORY_CHAPTER: 'story_chapter',
  OTHER: 'other'
});

oppia.constant('STATS_EVENT_TYPES', {
  EVENT_TYPE_START_EXPLORATION: 'start',
  EVENT_TYPE_ACTUAL_START_EXPLORATION: 'actual_start',
  EVENT_TYPE_COMPLETE_EXPLORATION: 'complete',
  EVENT_TYPE_STATE_HIT: 'state_hit',
  EVENT_TYPE_STATE_COMPLETED: 'state_complete',
  EVENT_TYPE_ANSWER_SUBMITTED: 'answer_submitted',
  EVENT_TYPE_SOLUTION_HIT: 'solution_hit',
  EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP: 'leave_for_refresher_exp',
});

oppia.constant('STATS_REPORTING_URLS', {
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
});

oppia.constant('FEEDBACK_POPOVER_PATH',
  '/pages/exploration-player-page/templates/' +
  'feedback-popup-container.template.html');
