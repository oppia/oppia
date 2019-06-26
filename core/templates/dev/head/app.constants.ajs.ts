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

import { AppConstants } from 'app.constants.ts';
<<<<<<< HEAD
=======
import { APP_BASE_HREF } from '@angular/common';
>>>>>>> f3f1eb3747205be1afae3114a4c2bb3d053e6f62

var oppia = require('AppInit.ts').moduleName;

for (var constantName in constants) {
  oppia.constant(constantName, constants[constantName]);
}

// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
oppia.constant('DEFAULT_TRANSLATIONS', AppConstants.DEFAULT_TRANSLATIONS);

oppia.constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT',
<<<<<<< HEAD
  AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);
=======
    AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);
>>>>>>> f3f1eb3747205be1afae3114a4c2bb3d053e6f62

oppia.constant(
  'FEEDBACK_SUBJECT_MAX_CHAR_LIMIT',
  AppConstants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT);

/* Called always when learner moves to a new card.
   Also called when card is selected by clicking on progress dots */
oppia.constant(
  'EVENT_ACTIVE_CARD_CHANGED', AppConstants.EVENT_ACTIVE_CARD_CHANGED);
/* Called when the learner moves to a new card that they haven't seen before. */
oppia.constant('EVENT_NEW_CARD_OPENED', AppConstants.EVENT_NEW_CARD_AVAILABLE);
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE);
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE);
oppia.constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_DATA_URL_TEMPLATE);
oppia.constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE);
oppia.constant(
  'VOICEOVER_EXPLORATION_DATA_URL_TEMPLATE',
  AppConstants.VOICEOVER_EXPLORATION_DATA_URL_TEMPLATE);
/* New card is available but user hasn't gone to it yet (when oppia
   gives a feedback and waits for user to press 'continue').
   Not called when a card is selected by clicking progress dots */
oppia.constant(
  'EVENT_NEW_CARD_AVAILABLE', AppConstants.EVENT_NEW_CARD_AVAILABLE);

oppia.constant('WARNING_TYPES', AppConstants.WARNING_TYPES);

oppia.constant('STATE_ERROR_MESSAGES', AppConstants.STATE_ERROR_MESSAGES);

oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE);

oppia.constant(
  'EXPLORATION_AND_SKILL_ID_PATTERN',
  AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN);

// We use a slash because this character is forbidden in a state name.
oppia.constant(
  'PLACEHOLDER_OUTCOME_DEST', AppConstants.PLACEHOLDER_OUTCOME_DEST);
oppia.constant(
  'INTERACTION_DISPLAY_MODE_INLINE',
  AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
oppia.constant('LOADING_INDICATOR_URL', AppConstants.LOADING_INDICATOR_URL);
oppia.constant(
  'OBJECT_EDITOR_URL_PREFIX', AppConstants.OBJECT_EDITOR_URL_PREFIX);
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_ML_CLASSIFIERS', AppConstants.ENABLE_ML_CLASSIFIERS);
// Feature still in development.
oppia.constant(
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
  AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);
oppia.constant('PARAMETER_TYPES', AppConstants.PARAMETER_TYPES);

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', AppConstants.MAX_NODES_PER_ROW);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', AppConstants.MAX_NODE_LABEL_LENGTH);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', AppConstants.FATAL_ERROR_CODES);

// Do not modify these, for backwards-compatibility reasons.
oppia.constant('COMPONENT_NAME_CONTENT', AppConstants.COMPONENT_NAME_CONTENT);
oppia.constant('COMPONENT_NAME_HINT', AppConstants.COMPONENT_NAME_HINT);
oppia.constant('COMPONENT_NAME_SOLUTION', AppConstants.COMPONENT_NAME_SOLUTION);
oppia.constant('COMPONENT_NAME_FEEDBACK', AppConstants.COMPONENT_NAME_FEEDBACK);
oppia.constant(
  'COMPONENT_NAME_EXPLANATION', AppConstants.COMPONENT_NAME_EXPLANATION);
oppia.constant(
  'COMPONENT_NAME_WORKED_EXAMPLE', AppConstants.COMPONENT_NAME_WORKED_EXAMPLE);

oppia.constant(
  'ACTION_TYPE_EXPLORATION_START', AppConstants.ACTION_TYPE_EXPLORATION_START);
oppia.constant(
  'ACTION_TYPE_ANSWER_SUBMIT', AppConstants.ACTION_TYPE_ANSWER_SUBMIT);
oppia.constant(
  'ACTION_TYPE_EXPLORATION_QUIT', AppConstants.ACTION_TYPE_EXPLORATION_QUIT);

oppia.constant('ISSUE_TYPE_EARLY_QUIT', AppConstants.ISSUE_TYPE_EARLY_QUIT);
oppia.constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
oppia.constant(
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS',
  AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
oppia.constant('SITE_NAME', AppConstants.SITE_NAME);

oppia.constant(
  'DEFAULT_PROFILE_IMAGE_PATH', AppConstants.DEFAULT_PROFILE_IMAGE_PATH);

oppia.constant('LOGOUT_URL', AppConstants.LOGOUT_URL);

oppia.constant(
  'EVENT_QUESTION_SUMMARIES_INITIALIZED',
  AppConstants.EVENT_QUESTION_SUMMARIES_INITIALIZED);

// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE);
oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE',
  AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE);

oppia.constant(
  'LABEL_FOR_CLEARING_FOCUS', AppConstants.LABEL_FOR_CLEARING_FOCUS);

// TODO(bhenning): This constant should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', AppConstants.COLLECTION_DATA_URL_TEMPLATE);
