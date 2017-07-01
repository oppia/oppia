// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Contstans to be used in the learner view.
 */

oppia.constant('CONTENT_FOCUS_LABEL_PREFIX', 'content-focus-label-');

oppia.constant('TWO_CARD_THRESHOLD_PX', 960);

oppia.constant('CONTINUE_BUTTON_FOCUS_LABEL', 'continueButton');

// The enforced waiting period between successive hint requests.
oppia.constant('WAIT_FOR_HINT_MSEC', 30000);

// The time delay between the learner clicking the hint button
// and the appearance of the hint.
oppia.constant('DELAY_FOR_HINT_FEEDBACK_MSEC', 100);

// Array of i18n IDs for the possible hint request strings.
oppia.constant(
  'HINT_REQUEST_STRING_I18N_IDS', [
    'I18N_PLAYER_HINT_REQUEST_STRING_1',
    'I18N_PLAYER_HINT_REQUEST_STRING_2',
    'I18N_PLAYER_HINT_REQUEST_STRING_3']);

oppia.constant(
    'EXPLORATION_DATA_URL_TEMPLATE',
    '/explorehandler/init/<exploration_id>');
oppia.constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');
