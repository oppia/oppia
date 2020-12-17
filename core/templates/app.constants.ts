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

import commonConstants from 'assets/constants';

export const AppConstants = {
  ...commonConstants,
  DEFAULT_TRANSLATIONS: {
    I18N_LIBRARY_PAGE_TITLE_FRAGMENT_FOR_WEB: 'Library',
    I18N_LIBRARY_LOADING: 'Loading',
    I18N_SIGNUP_PAGE_SUBTITLE: 'Registration',
    I18N_SIGNUP_PAGE_TITLE_FRAGMENT_FOR_WEB: 'Oppia',
    I18N_LIBRARY_SEARCH_PLACEHOLDER: 'What are you curious about?',
    I18N_LIBRARY_ALL_LANGUAGES: 'All Languages',
    I18N_LIBRARY_LANGUAGES_EN: 'English',
    I18N_LIBRARY_ALL_CATEGORIES: 'All Categories',
    I18N_TOPNAV_SIGN_IN: 'Sign in',
    I18N_SPLASH_PAGE_TITLE_FRAGMENT_FOR_WEB:
      'Oppia | Free, Online and Interactive Lessons for Anyone',
    I18N_SIGNUP_REGISTRATION: 'Registration',
    I18N_SIGNUP_LOADING: 'Loading',
  },

  ACTIVITY_STATUS_PRIVATE: 'private',
  ACTIVITY_STATUS_PUBLIC: 'public',

  RULE_SUMMARY_WRAP_CHARACTER_COUNT: 30,

  /* Called when the learner moves to a new card that they haven't seen
     before. */
  EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE: (
    '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>'),
  EDITABLE_EXPLORATION_DATA_URL_TEMPLATE: (
    '/createhandler/data/<exploration_id>'),
  EXPLORATION_DATA_URL_TEMPLATE: '/explorehandler/init/<exploration_id>',
  EXPLORATION_VERSION_DATA_URL_TEMPLATE: (
    '/explorehandler/init/<exploration_id>?v=<version>'),

  WARNING_TYPES: {
    // These must be fixed before the exploration can be saved.
    CRITICAL: 'critical',
    // These must be fixed before publishing an exploration to the public
    // library.
    ERROR: 'error',
  },

  STATE_ERROR_MESSAGES: {
    ADD_INTERACTION: 'Please add an interaction to this card.',
    STATE_UNREACHABLE: 'This card is unreachable.',
    UNABLE_TO_END_EXPLORATION:
      "There's no way to complete the exploration starting from this card. " +
      'To fix this, make sure that the last card in the chain starting from' +
      " this one has an 'End Exploration' question type.",
    INCORRECT_SOLUTION: 'The current solution does not lead to another card.',
    UNRESOLVED_ANSWER:
      'There is an answer among the top 10 which has no explicit feedback.',
  },

  EXPLORATION_SUMMARY_DATA_URL_TEMPLATE: '/explorationsummarieshandler/data',

  EXPLORATION_AND_SKILL_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,

  // We use a slash because this character is forbidden in a state name.
  PLACEHOLDER_OUTCOME_DEST: '/',
  INTERACTION_DISPLAY_MODE_INLINE: 'inline',
  LOADING_INDICATOR_URL: '/activity/loadingIndicator.gif',
  OBJECT_EDITOR_URL_PREFIX: '/object_editor_template/',
  // Feature still in development.
  // NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
  ENABLE_ML_CLASSIFIERS: false,
  // Feature still in development.
  INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION: (
    'The current solution does not lead to another card.'),
  PARAMETER_TYPES: {
    REAL: 'Real',
    UNICODE_STRING: 'UnicodeString',
  },

  // The maximum number of nodes to show in a row of the state graph.
  MAX_NODES_PER_ROW: 4,
  // The following variable must be at least 3. It represents the maximum
  // length, in characters, for the name of each node label in the state graph.
  MAX_NODE_LABEL_LENGTH: 15,

  // If an $http request fails with the following error codes, a warning is
  // displayed.
  FATAL_ERROR_CODES: [400, 401, 404, 500],

  // Do not modify these, for backwards-compatibility reasons. These strings are
  // used to identify components, to generate content ids, and to determine what
  // type of content a given content id is associated with. If you wish to
  // change one of these, a state migration of all existing content ids is
  // required.
  COMPONENT_NAME_CONTENT: 'content',
  COMPONENT_NAME_FEEDBACK: 'feedback',
  COMPONENT_NAME_HINT: 'hint',
  COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS: 'ca',
  COMPONENT_NAME_SOLUTION: 'solution',
  COMPONENT_NAME_EXPLANATION: 'explanation',
  COMPONENT_NAME_WORKED_EXAMPLE: {
    QUESTION: 'worked_example_question',
    EXPLANATION: 'worked_example_explanation',
  },

  ACTION_TYPE_EXPLORATION_START: 'ExplorationStart',
  ACTION_TYPE_ANSWER_SUBMIT: 'AnswerSubmit',
  ACTION_TYPE_EXPLORATION_QUIT: 'ExplorationQuit',

  ISSUE_TYPE_EARLY_QUIT: 'EarlyQuit',
  ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS: 'MultipleIncorrectSubmissions',
  ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS: 'CyclicStateTransitions',

  // A block refers to a set of learner actions displayed together so that
  // they are part of the same context. If two consecutive learner actions are
  // from different states, we consider them unrelated. This constant refers to
  // the maximum number of such actions that can exist in one block. (Note that
  // all related actions are shown together, regardless of how many there are.)
  MAX_UNRELATED_ACTIONS_PER_BLOCK: 4,

  SITE_NAME: 'Oppia.org',

  DEFAULT_PROFILE_IMAGE_PATH: '/avatar/user_blue_72px.webp',

  LOGOUT_URL: '/logout',

  // TODO(vojtechjelinek): Move these to separate file later, after we establish
  // process to follow for Angular constants (#6731).
  SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE: (
    '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>'),
  EDITABLE_TOPIC_DATA_URL_TEMPLATE: '/topic_editor_handler/data/<topic_id>',

  LABEL_FOR_CLEARING_FOCUS: 'labelForClearingFocus',

  // TODO(bhenning): This constant should be provided by the backend.
  COLLECTION_DATA_URL_TEMPLATE: '/collection_handler/data/<collection_id>',

  ENTITY_TYPE: {
    COLLECTION: 'collection',
    EXPLORATION: 'exploration',
    TOPIC: 'topic',
    SKILL: 'skill',
    STORY: 'story',
    QUESTION: 'question',
  },

  ASSET_TYPE_AUDIO: 'audio',
  ASSET_TYPE_IMAGE: 'image',
  ASSET_TYPE_THUMBNAIL: 'thumbnail',

  AUDIO_UPLOAD_URL_TEMPLATE: '/createhandler/audioupload/<exploration_id>',
  IMAGE_UPLOAD_URL_TEMPLATE: (
    '/createhandler/imageupload/<entity_type>/<entity_id>'),

  MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY: 3,
  MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY: 3,

  IMAGE_CONTEXT: {
    EXPLORATION_SUGGESTIONS: 'exploration_suggestions',
    QUESTION_SUGGESTIONS: 'question_suggestions'
  },

  IMAGE_SAVE_DESTINATION_SERVER: 'imageSaveDestinationServer',
  IMAGE_SAVE_DESTINATION_LOCAL_STORAGE:
    'imageSaveDestinationLocalStorage'
} as const;
