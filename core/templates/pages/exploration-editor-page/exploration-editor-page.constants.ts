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
 * @fileoverview Constants for the exploration editor page and the editor
 *               help tab in the navbar.
 */

export const ExplorationEditorPageConstants = {
  EXPLORATION_TITLE_INPUT_FOCUS_LABEL: 'explorationTitleInputFocusLabel',

  PARAM_ACTION_GET: 'get',

  PARAM_ACTION_SET: 'set',

  VOICEOVER_MODE: 'voiceoverMode',

  TRANSLATION_MODE: 'translationMode',

  // When an unresolved answer's frequency exceeds this threshold, an
  // exploration will be blocked from being published until the answer is
  // resolved.
  UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD: 5,

  // Constant for audio recording time limit.
  RECORDING_TIME_LIMIT: 300,

  HINT_CHARACTER_LIMIT: 500,

  NEW_LINE_REGEX: /(\n)(\s\n)*/g,

  IMPROVE_TYPE_INCOMPLETE: 'incomplete',

  DEFAULT_AUDIO_LANGUAGE: 'en',

  INFO_MESSAGE_SOLUTION_IS_VALID: 'The solution is now valid!',

  INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE:
    'The current solution is no longer valid.',

  COMPONENT_NAME_DEFAULT_OUTCOME: 'default_outcome',

  STATUS_COMPLIMENT: 'compliment',
  STATUS_FIXED: 'fixed',
  STATUS_IGNORED: 'ignored',
  STATUS_NOT_ACTIONABLE: 'not_actionable',
  STATUS_OPEN: 'open',
} as const;
