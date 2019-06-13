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
 * @fileoverview Shared constants for the Oppia module.
 */

oppia.constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', 30);

oppia.constant(
  'FEEDBACK_SUBJECT_MAX_CHAR_LIMIT',
  constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT);

/* Called always when learner moves to a new card.
   Also called when card is selected by clicking on progress dots */
oppia.constant('EVENT_ACTIVE_CARD_CHANGED', 'activeCardChanged');
/* Called when the learner moves to a new card that they haven't seen before. */
oppia.constant('EVENT_NEW_CARD_OPENED', 'newCardOpened');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
oppia.constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>');
oppia.constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
oppia.constant(
  'VOICEOVER_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/voiceover/<exploration_id>');
/* New card is available but user hasn't gone to it yet (when oppia
   gives a feedback and waits for user to press 'continue').
   Not called when a card is selected by clicking progress dots */
oppia.constant('EVENT_NEW_CARD_AVAILABLE', 'newCardAvailable');

oppia.constant('WARNING_TYPES', {
  // These must be fixed before the exploration can be saved.
  CRITICAL: 'critical',
  // These must be fixed before publishing an exploration to the public
  // library.
  ERROR: 'error'
});

oppia.constant('STATE_ERROR_MESSAGES', {
  ADD_INTERACTION: 'Please add an interaction to this card.',
  STATE_UNREACHABLE: 'This card is unreachable.',
  UNABLE_TO_END_EXPLORATION: (
    'There\'s no way to complete the exploration starting from this card. ' +
      'To fix this, make sure that the last card in the chain starting from ' +
      'this one has an \'End Exploration\' question type.'),
  INCORRECT_SOLUTION: (
    'The current solution does not lead to another card.'),
  UNRESOLVED_ANSWER: (
    'There is an answer among the top 10 which has no explicit feedback.')
});

oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

oppia.constant('EXPLORATION_AND_SKILL_ID_PATTERN', /^[a-zA-Z0-9_-]+$/);

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');
oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
oppia.constant('LOADING_INDICATOR_URL', '/activity/loadingIndicator.gif');
oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_ML_CLASSIFIERS', false);
// Feature still in development.
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
  'The current solution does not lead to another card.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION',
  'The current solution does not correspond to a correct answer.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_VALID',
  'The solution is now valid!');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  'The current solution is no longer valid.');
oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});
oppia.constant('ACTION_ACCEPT_SUGGESTION', 'accept');
oppia.constant('ACTION_REJECT_SUGGESTION', 'reject');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

// Do not modify these, for backwards-compatibility reasons.
oppia.constant('COMPONENT_NAME_CONTENT', 'content');
oppia.constant('COMPONENT_NAME_HINT', 'hint');
oppia.constant('COMPONENT_NAME_SOLUTION', 'solution');
oppia.constant('COMPONENT_NAME_FEEDBACK', 'feedback');
oppia.constant('COMPONENT_NAME_DEFAULT_OUTCOME', 'default_outcome');
oppia.constant('COMPONENT_NAME_EXPLANATION', 'explanation');
oppia.constant('COMPONENT_NAME_WORKED_EXAMPLE', 'worked_example');

// Enables recording playthroughs from learner sessions.
oppia.constant('CURRENT_ACTION_SCHEMA_VERSION', 1);
oppia.constant('CURRENT_ISSUE_SCHEMA_VERSION', 1);
oppia.constant('EARLY_QUIT_THRESHOLD_IN_SECS', 45);
oppia.constant('NUM_INCORRECT_ANSWERS_THRESHOLD', 3);
oppia.constant('NUM_REPEATED_CYCLES_THRESHOLD', 3);
oppia.constant('MAX_PLAYTHROUGHS_FOR_ISSUE', 5);

oppia.constant('ACTION_TYPE_EXPLORATION_START', 'ExplorationStart');
oppia.constant('ACTION_TYPE_ANSWER_SUBMIT', 'AnswerSubmit');
oppia.constant('ACTION_TYPE_EXPLORATION_QUIT', 'ExplorationQuit');

oppia.constant('ISSUE_TYPE_EARLY_QUIT', 'EarlyQuit');
oppia.constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS', 'MultipleIncorrectSubmissions');
oppia.constant('ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'CyclicStateTransitions');
oppia.constant('SITE_NAME', 'Oppia.org');

oppia.constant('DEFAULT_PROFILE_IMAGE_PATH', '/avatar/user_blue_72px.png');
oppia.constant('FEEDBACK_POPOVER_PATH',
  '/pages/exploration-player-page/templates/' +
  'feedback-popup-container.template.html');

oppia.constant('LOGOUT_URL', '/logout');

// Whether to enable the promo bar functionality. This does not actually turn on
// the promo bar, as that is gated by a config value (see config_domain). This
// merely avoids checking for whether the promo bar is enabled for every Oppia
// page visited.
oppia.constant('ENABLE_PROMO_BAR', true);

// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
oppia.constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
oppia.constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');
oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');


