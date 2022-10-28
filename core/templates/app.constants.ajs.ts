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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { AppConstants } from 'app.constants';

import constants from 'assets/constants';

for (var constantName in constants) {
  angular.module('oppia').constant(constantName, constants[constantName]);
}

// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
angular.module('oppia').constant(
  'DEFAULT_TRANSLATIONS', AppConstants.DEFAULT_TRANSLATIONS);

angular.module('oppia').constant(
  'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
  AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);

angular.module('oppia').constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE);
angular.module('oppia').constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE);
angular.module('oppia').constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_DATA_URL_TEMPLATE);
angular.module('oppia').constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE);

angular.module('oppia').constant('WARNING_TYPES', AppConstants.WARNING_TYPES);

angular.module('oppia').constant(
  'STATE_ERROR_MESSAGES', AppConstants.STATE_ERROR_MESSAGES);

angular.module('oppia').constant(
  'CHECKPOINT_ERROR_MESSAGES', AppConstants.CHECKPOINT_ERROR_MESSAGES);

angular.module('oppia').constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
  AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE);

angular.module('oppia').constant(
  'EXPLORATION_AND_SKILL_ID_PATTERN',
  AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN);

// We use a slash because this character is forbidden in a state name.
angular.module('oppia').constant(
  'PLACEHOLDER_OUTCOME_DEST', AppConstants.PLACEHOLDER_OUTCOME_DEST);
angular.module('oppia').constant(
  'PLACEHOLDER_OUTCOME_DEST_IF_STUCK',
  AppConstants.PLACEHOLDER_OUTCOME_DEST_IF_STUCK);
angular.module('oppia').constant(
  'INTERACTION_DISPLAY_MODE_INLINE',
  AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
angular.module('oppia').constant(
  'LOADING_INDICATOR_URL', AppConstants.LOADING_INDICATOR_URL);
angular.module('oppia').constant(
  'OBJECT_EDITOR_URL_PREFIX', AppConstants.OBJECT_EDITOR_URL_PREFIX);
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
angular.module('oppia').constant(
  'ENABLE_ML_CLASSIFIERS', AppConstants.ENABLE_ML_CLASSIFIERS);
// Feature still in development.
angular.module('oppia').constant(
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
  AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);
angular.module('oppia').constant(
  'PARAMETER_TYPES', AppConstants.PARAMETER_TYPES);

// The maximum number of nodes to show in a row of the state graph.
angular.module('oppia').constant(
  'MAX_NODES_PER_ROW', AppConstants.MAX_NODES_PER_ROW);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
angular.module('oppia').constant(
  'MAX_NODE_LABEL_LENGTH', AppConstants.MAX_NODE_LABEL_LENGTH);

// If an $http request fails with the following error codes, a warning is
// displayed.
angular.module('oppia').constant(
  'FATAL_ERROR_CODES', AppConstants.FATAL_ERROR_CODES);

// Do not modify these, for backwards-compatibility reasons.
angular.module('oppia').constant(
  'COMPONENT_NAME_CONTENT', AppConstants.COMPONENT_NAME_CONTENT);
angular.module('oppia').constant(
  'COMPONENT_NAME_FEEDBACK', AppConstants.COMPONENT_NAME_FEEDBACK);
angular.module('oppia').constant(
  'COMPONENT_NAME_HINT', AppConstants.COMPONENT_NAME_HINT);
angular.module('oppia').constant(
  'COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS',
  AppConstants.COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS);
angular.module('oppia').constant(
  'COMPONENT_NAME_RULE_INPUT', AppConstants.COMPONENT_NAME_RULE_INPUT);
angular.module('oppia').constant(
  'COMPONENT_NAME_SOLUTION', AppConstants.COMPONENT_NAME_SOLUTION);
angular.module('oppia').constant(
  'COMPONENT_NAME_EXPLANATION', AppConstants.COMPONENT_NAME_EXPLANATION);
angular.module('oppia').constant(
  'COMPONENT_NAME_WORKED_EXAMPLE', AppConstants.COMPONENT_NAME_WORKED_EXAMPLE);

angular.module('oppia').constant(
  'ACTION_TYPE_EXPLORATION_START', AppConstants.ACTION_TYPE_EXPLORATION_START);
angular.module('oppia').constant(
  'ACTION_TYPE_ANSWER_SUBMIT', AppConstants.ACTION_TYPE_ANSWER_SUBMIT);
angular.module('oppia').constant(
  'ACTION_TYPE_EXPLORATION_QUIT', AppConstants.ACTION_TYPE_EXPLORATION_QUIT);

angular.module('oppia').constant(
  'ISSUE_TYPE_EARLY_QUIT', AppConstants.ISSUE_TYPE_EARLY_QUIT);
angular.module('oppia').constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
angular.module('oppia').constant(
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS',
  AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
angular.module('oppia').constant(
  'MAX_UNRELATED_ACTIONS_PER_BLOCK',
  AppConstants.MAX_UNRELATED_ACTIONS_PER_BLOCK);
angular.module('oppia').constant('SITE_NAME', AppConstants.SITE_NAME);

angular.module('oppia').constant(
  'DEFAULT_PROFILE_IMAGE_PATH', AppConstants.DEFAULT_PROFILE_IMAGE_PATH);

// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
angular.module('oppia').constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE);
angular.module('oppia').constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE',
  AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE);

angular.module('oppia').constant(
  'LABEL_FOR_CLEARING_FOCUS', AppConstants.LABEL_FOR_CLEARING_FOCUS);

// TODO(bhenning): This constant should be provided by the backend.
angular.module('oppia').constant(
  'COLLECTION_DATA_URL_TEMPLATE', AppConstants.COLLECTION_DATA_URL_TEMPLATE);

angular.module('oppia').constant('ENTITY_TYPE', AppConstants.ENTITY_TYPE);

angular.module('oppia').constant('IMAGE_CONTEXT', AppConstants.IMAGE_CONTEXT);

angular.module('oppia').constant(
  'IMAGE_SAVE_DESTINATION_SERVER', AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
angular.module('oppia').constant(
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
  AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
