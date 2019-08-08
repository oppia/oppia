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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants.ts';

angular.module('oppia').constant(
  'CONTENT_FOCUS_LABEL_PREFIX',
  ExplorationPlayerConstants.CONTENT_FOCUS_LABEL_PREFIX);

angular.module('oppia').constant(
  'TWO_CARD_THRESHOLD_PX', ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX);

angular.module('oppia').constant(
  'CONTINUE_BUTTON_FOCUS_LABEL',
  ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);

/* Called when a new audio-equippable component is loaded and displayed
   to the user, allowing for the automatic playing of audio if necessary. */
angular.module('oppia').constant(
  'EVENT_AUTOPLAY_AUDIO', ExplorationPlayerConstants.EVENT_AUTOPLAY_AUDIO);

// The enforced waiting period before the first hint request.
angular.module('oppia').constant(
  'WAIT_FOR_FIRST_HINT_MSEC',
  ExplorationPlayerConstants.WAIT_FOR_FIRST_HINT_MSEC);
// The enforced waiting period before each of the subsequent hint requests.
angular.module('oppia').constant(
  'WAIT_FOR_SUBSEQUENT_HINTS_MSEC',
  ExplorationPlayerConstants.WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

// The time delay between the learner clicking the hint button
// and the appearance of the hint.
angular.module('oppia').constant(
  'DELAY_FOR_HINT_FEEDBACK_MSEC',
  ExplorationPlayerConstants.DELAY_FOR_HINT_FEEDBACK_MSEC);

// Array of i18n IDs for the possible hint request strings.
angular.module('oppia').constant(
  'HINT_REQUEST_STRING_I18N_IDS',
  ExplorationPlayerConstants.HINT_REQUEST_STRING_I18N_IDS);

/* This should match the CSS class defined in the tutor card directive. */
angular.module('oppia').constant(
  'AUDIO_HIGHLIGHT_CSS_CLASS',
  ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS);

angular.module('oppia').constant(
  'FLAG_EXPLORATION_URL_TEMPLATE',
  ExplorationPlayerConstants.FLAG_EXPLORATION_URL_TEMPLATE);

// TODO(bhenning): Find a better place for these constants.

// NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
// the corresponding classification constants defined in core.domain.exp_domain.
angular.module('oppia').constant(
  'EXPLICIT_CLASSIFICATION',
  ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION);
angular.module('oppia').constant(
  'TRAINING_DATA_CLASSIFICATION',
  ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);
angular.module('oppia').constant(
  'STATISTICAL_CLASSIFICATION',
  ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION);
angular.module('oppia').constant(
  'DEFAULT_OUTCOME_CLASSIFICATION',
  ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);

angular.module('oppia').constant(
  'EXPLORATION_MODE', ExplorationPlayerConstants.EXPLORATION_MODE);

angular.module('oppia').constant(
  'STATS_EVENT_TYPES', ExplorationPlayerConstants.STATS_EVENT_TYPES);

angular.module('oppia').constant(
  'STATS_REPORTING_URLS',
  ExplorationPlayerConstants.STATS_REPORTING_URLS);

angular.module('oppia').constant('FEEDBACK_POPOVER_PATH',
  ExplorationPlayerConstants.FEEDBACK_POPOVER_PATH);
