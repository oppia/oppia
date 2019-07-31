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

for (var constantName in constants) {
  angular.module('oppia').constant(constantName, constants[constantName]);
}

// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
angular.module('oppia').constant('DEFAULT_TRANSLATIONS', {
  I18N_LIBRARY_PAGE_TITLE: 'Library',
  I18N_LIBRARY_LOADING: 'Loading',
  I18N_SIGNUP_PAGE_SUBTITLE: 'Registration',
  I18N_SIGNUP_PAGE_TITLE: 'Oppia',
  I18N_LIBRARY_SEARCH_PLACEHOLDER: 'What are you curious about?',
  I18N_LIBRARY_ALL_LANGUAGES: 'All Languages',
  I18N_LIBRARY_LANGUAGES_EN: 'English',
  I18N_LIBRARY_ALL_CATEGORIES: 'All Categories',
  I18N_TOPNAV_SIGN_IN: 'Sign in',
  I18N_SPLASH_PAGE_TITLE: 'Oppia: Teach, Learn, Explore',
  I18N_SIGNUP_REGISTRATION: 'Registration',
  I18N_SIGNUP_LOADING: 'Loading'
});

angular.module('oppia').constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', 30);

angular.module('oppia').constant(
  'FEEDBACK_SUBJECT_MAX_CHAR_LIMIT',
  constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT);

/* Called always when learner moves to a new card.
   Also called when card is selected by clicking on progress dots */
angular.module('oppia').constant(
  'EVENT_ACTIVE_CARD_CHANGED', 'activeCardChanged');
/* Called when the learner moves to a new card that they haven't seen before. */
angular.module('oppia').constant('EVENT_NEW_CARD_OPENED', 'newCardOpened');
angular.module('oppia').constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');
angular.module('oppia').constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
angular.module('oppia').constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>');
angular.module('oppia').constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
angular.module('oppia').constant(
  'VOICEOVER_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/voiceover/<exploration_id>');
/* New card is available but user hasn't gone to it yet (when oppia
   gives a feedback and waits for user to press 'continue').
   Not called when a card is selected by clicking progress dots */
angular.module('oppia').constant(
  'EVENT_NEW_CARD_AVAILABLE', 'newCardAvailable');

angular.module('oppia').constant('WARNING_TYPES', {
  // These must be fixed before the exploration can be saved.
  CRITICAL: 'critical',
  // These must be fixed before publishing an exploration to the public
  // library.
  ERROR: 'error'
});

angular.module('oppia').constant('STATE_ERROR_MESSAGES', {
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

angular.module('oppia').constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

angular.module('oppia').constant(
  'EXPLORATION_AND_SKILL_ID_PATTERN', /^[a-zA-Z0-9_-]+$/);

// We use a slash because this character is forbidden in a state name.
angular.module('oppia').constant('PLACEHOLDER_OUTCOME_DEST', '/');
angular.module('oppia').constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
angular.module('oppia').constant(
  'LOADING_INDICATOR_URL', '/activity/loadingIndicator.gif');
angular.module('oppia').constant(
  'OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
angular.module('oppia').constant('ENABLE_ML_CLASSIFIERS', false);
// Feature still in development.
angular.module('oppia').constant(
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
  'The current solution does not lead to another card.');
angular.module('oppia').constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});

// The maximum number of nodes to show in a row of the state graph.
angular.module('oppia').constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
angular.module('oppia').constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
angular.module('oppia').constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

// Do not modify these, for backwards-compatibility reasons.
angular.module('oppia').constant('COMPONENT_NAME_CONTENT', 'content');
angular.module('oppia').constant('COMPONENT_NAME_HINT', 'hint');
angular.module('oppia').constant('COMPONENT_NAME_SOLUTION', 'solution');
angular.module('oppia').constant('COMPONENT_NAME_FEEDBACK', 'feedback');
angular.module('oppia').constant('COMPONENT_NAME_EXPLANATION', 'explanation');
angular.module('oppia').constant(
  'COMPONENT_NAME_WORKED_EXAMPLE', 'worked_example');

angular.module('oppia').constant(
  'ACTION_TYPE_EXPLORATION_START', 'ExplorationStart');
angular.module('oppia').constant('ACTION_TYPE_ANSWER_SUBMIT', 'AnswerSubmit');
angular.module('oppia').constant(
  'ACTION_TYPE_EXPLORATION_QUIT', 'ExplorationQuit');

angular.module('oppia').constant('ISSUE_TYPE_EARLY_QUIT', 'EarlyQuit');
angular.module('oppia').constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS', 'MultipleIncorrectSubmissions');
angular.module('oppia').constant(
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'CyclicStateTransitions');
angular.module('oppia').constant('SITE_NAME', 'Oppia.org');

angular.module('oppia').constant(
  'DEFAULT_PROFILE_IMAGE_PATH', '/avatar/user_blue_72px.png');

angular.module('oppia').constant('LOGOUT_URL', '/logout');

angular.module('oppia').constant(
  'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'questionSummariesInitialized');

// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
angular.module('oppia').constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');
angular.module('oppia').constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');

angular.module('oppia').constant(
  'LABEL_FOR_CLEARING_FOCUS', 'labelForClearingFocus');

// TODO(bhenning): This constant should be provided by the backend.
angular.module('oppia').constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
