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

angular.module('oppia').constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  'explorationTitleInputFocusLabel');

angular.module('oppia').constant(
  'EVENT_EXPLORATION_PROPERTY_CHANGED', 'explorationPropertyChanged');

angular.module('oppia').constant(
  'PARAM_ACTION_GET', 'get');

angular.module('oppia').constant(
  'PARAM_ACTION_SET', 'set');

angular.module('oppia').constant(
  'VOICEOVER_MODE', 'voiceoverMode');

angular.module('oppia').constant(
  'TRANSLATION_MODE', 'translationMode');

// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
angular.module('oppia').constant(
  'UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 5);

// Constant for audio recording time limit.
angular.module('oppia').constant(
  'RECORDING_TIME_LIMIT', 300);

angular.module('oppia').constant(
  'IMPROVE_TYPE_INCOMPLETE', 'incomplete');

angular.module('oppia').constant('DEFAULT_AUDIO_LANGUAGE', 'en');

angular.module('oppia').constant('INFO_MESSAGE_SOLUTION_IS_VALID',
  'The solution is now valid!');

angular.module('oppia').constant(
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  'The current solution is no longer valid.');

angular.module('oppia').constant('ACTION_ACCEPT_SUGGESTION', 'accept');
angular.module('oppia').constant('ACTION_REJECT_SUGGESTION', 'reject');

angular.module('oppia').constant(
  'COMPONENT_NAME_DEFAULT_OUTCOME', 'default_outcome');
