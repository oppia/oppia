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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants';

angular.module('oppia').constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  ExplorationEditorPageConstants.EXPLORATION_TITLE_INPUT_FOCUS_LABEL);

angular.module('oppia').constant(
  'PARAM_ACTION_GET', ExplorationEditorPageConstants.PARAM_ACTION_GET);

angular.module('oppia').constant(
  'PARAM_ACTION_SET', ExplorationEditorPageConstants.PARAM_ACTION_SET);

angular.module('oppia').constant(
  'VOICEOVER_MODE', ExplorationEditorPageConstants.VOICEOVER_MODE);

angular.module('oppia').constant(
  'TRANSLATION_MODE', ExplorationEditorPageConstants.TRANSLATION_MODE);

// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
angular.module('oppia').constant(
  'UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD',
  ExplorationEditorPageConstants.UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD);

// Constant for audio recording time limit.
angular.module('oppia').constant(
  'RECORDING_TIME_LIMIT', ExplorationEditorPageConstants.RECORDING_TIME_LIMIT);

angular.module('oppia').constant(
  'IMPROVE_TYPE_INCOMPLETE',
  ExplorationEditorPageConstants.IMPROVE_TYPE_INCOMPLETE);

angular.module('oppia').constant(
  'DEFAULT_AUDIO_LANGUAGE',
  ExplorationEditorPageConstants.DEFAULT_AUDIO_LANGUAGE);

angular.module('oppia').constant(
  'INFO_MESSAGE_SOLUTION_IS_VALID',
  ExplorationEditorPageConstants.INFO_MESSAGE_SOLUTION_IS_VALID);

angular.module('oppia').constant(
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  ExplorationEditorPageConstants
    .INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE);

angular.module('oppia').constant(
  'STATUS_COMPLIMENT', ExplorationEditorPageConstants.STATUS_COMPLIMENT);
angular.module('oppia').constant(
  'STATUS_FIXED', ExplorationEditorPageConstants.STATUS_FIXED);
angular.module('oppia').constant(
  'STATUS_IGNORED', ExplorationEditorPageConstants.STATUS_IGNORED);
angular.module('oppia').constant(
  'STATUS_NOT_ACTIONABLE',
  ExplorationEditorPageConstants.STATUS_NOT_ACTIONABLE);
angular.module('oppia').constant(
  'STATUS_OPEN', ExplorationEditorPageConstants.STATUS_OPEN);

angular.module('oppia').constant(
  'COMPONENT_NAME_DEFAULT_OUTCOME',
  ExplorationEditorPageConstants.COMPONENT_NAME_DEFAULT_OUTCOME);
