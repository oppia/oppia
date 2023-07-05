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
  ENTITY_TRANSLATIONS_HANDLER_URL_TEMPLATE: (
    '/entity_translations_handler/<entity_type>/<entity_id>/<entity_version>/' +
    '<language_code>'),
  EXPLORATION_PROGRESS_PID_URL_TEMPLATE: (
    '/explorehandler/init/<exploration_id>?pid=<pid>'),

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
    INVALID_REDIRECTION: 'Learner should not be directed back by more than' +
      ' 3 cards in the lesson.'
  },

  CHECKPOINT_ERROR_MESSAGES: {
    INIT_CARD: 'The first card of the lesson must be a checkpoint.',
    TERMINAL_CARD:
      'Checkpoints are not allowed on the last card of the lesson.',
    CHECKPOINT_COUNT: 'Only a maximum of 8 checkpoints are allowed per lesson.',
    BYPASSABLE_CARD:
      'Checkpoints must not be assigned to cards that can be bypassed.'
  },

  EXPLORATION_SUMMARY_DATA_URL_TEMPLATE: '/explorationsummarieshandler/data',

  EXPLORATION_AND_SKILL_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,

  // We use a slash because this character is forbidden in a state name.
  PLACEHOLDER_OUTCOME_DEST: '/',
  PLACEHOLDER_OUTCOME_DEST_IF_STUCK: '/',
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

  // Flag to toggle the support for a new state to direct the learners
  // to if they get stuck.
  DEST_IF_REALLY_STUCK_FEAT_ENABLED: false,

  INTERACTION_NAMES: {
    TEXT_INPUT: 'TextInput'
  },

  // The maximum number of nodes to show in a row of the state graph.
  MAX_NODES_PER_ROW: 4,
  // The following variable must be at least 3. It represents the maximum
  // length, in characters, for the name of each node label in the state graph.
  MAX_NODE_LABEL_LENGTH: 15,

  // If an $http request fails with the following error codes, a warning is
  // displayed.
  FATAL_ERROR_CODES: [400, 401, 404, 500],

  // Maximum number of states the learner can be directed back from a state
  // by an editor in an exploration.
  MAX_CARD_COUNT_FOR_VALID_REDIRECTION: 3,

  // Do not modify these, for backwards-compatibility reasons. These strings are
  // used to identify components, to generate content ids, and to determine what
  // type of content a given content id is associated with. If you wish to
  // change one of these, a state migration of all existing content ids is
  // required. The component content type should be sufficiently small such that
  // the commit messages that use the content type strings do not exceed 375
  // characters (which is the maximum length of a commit message).
  COMPONENT_NAME_CONTENT: 'content',
  COMPONENT_NAME_FEEDBACK: 'feedback',
  COMPONENT_NAME_HINT: 'hint',
  COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS: 'ca',
  COMPONENT_NAME_RULE_INPUT: 'rule_input',
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

  DEFAULT_PROFILE_IMAGE_WEBP_PATH: '/avatar/user_blue_150px.webp',

  DEFAULT_PROFILE_IMAGE_PNG_PATH: '/avatar/user_blue_150px.png',

  // TODO(vojtechjelinek): Move these to separate file later, after we establish
  // process to follow for Angular constants (#6731).
  SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE: (
    '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>'),
  // This should be synchronized with SUBTOPIC_MASTERY_DATA_URL
  // in feconf.
  SUBTOPIC_MASTERY_DATA_URL_TEMPLATE: (
    '/subtopic_mastery_handler/data'),
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
    BLOG_POST: 'blog_post',
  },

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
    'imageSaveDestinationLocalStorage',
  SVG_MIME_TYPE: 'data:image/svg+xml',

  CONTRIBUTION_STATS_TYPE_TRANSLATION: 'translation',
  CONTRIBUTION_STATS_TYPE_QUESTION: 'question',
  CONTRIBUTION_STATS_SUBTYPE_SUBMISSION: 'submission',
  CONTRIBUTION_STATS_SUBTYPE_REVIEW: 'review',
  CONTRIBUTION_STATS_SUBTYPE_CORRECTION: 'correction',
  CONTRIBUTION_STATS_TYPES: {
    TRANSLATION_CONTRIBUTION: {
      NAME: 'translationContribution',
      DISPLAY_NAME: 'Translation Contributions'
    },
    TRANSLATION_REVIEW: {
      NAME: 'translationReview',
      DISPLAY_NAME: 'Translation Reviews'
    },
    QUESTION_CONTRIBUTION: {
      NAME: 'questionContribution',
      DISPLAY_NAME: 'Question Contributions'
    },
    QUESTION_REVIEW: {
      NAME: 'questionReview',
      DISPLAY_NAME: 'Question Reviews'
    }
  },
  CONTRIBUTOR_BADGE_INITIAL_LEVELS: [1, 10, 20, 50, 100, 200, 300, 400, 500],
  CONTRIBUTOR_CERTIFICATE_LOGO:
    '/assets/images/contributor_dashboard/oppia-logo.jpg',
} as const;
