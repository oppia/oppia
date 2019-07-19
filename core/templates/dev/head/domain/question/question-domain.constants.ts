// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for question domain.
 */

var oppia = require('AppInit.ts').module;

oppia.constant(
  'EDITABLE_QUESTION_DATA_URL_TEMPLATE',
  '/question_editor_handler/data/<question_id>');
oppia.constant(
  'QUESTION_CREATION_URL',
  '/question_editor_handler/create_new');
oppia.constant(
  'QUESTION_SKILL_LINK_URL_TEMPLATE',
  '/manage_question_skill_link/<question_id>/<skill_id>');

oppia.constant(
  'PRETEST_QUESTIONS_URL_TEMPLATE',
  '/pretest_handler/<exploration_id>?story_id=<story_id>&cursor=<cursor>');

oppia.constant(
  'QUESTIONS_LIST_URL_TEMPLATE',
  '/questions_list_handler/<comma_separated_skill_ids>?cursor=<cursor>');

oppia.constant(
  'QUESTION_PLAYER_URL_TEMPLATE',
  '/question_player_handler?skill_ids=<skill_ids>&question_count' +
  '=<question_count>');

oppia.constant('QUESTION_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('QUESTION_PROPERTY_QUESTION_STATE_DATA', 'question_state_data');

oppia.constant('CMD_UPDATE_QUESTION_PROPERTY', 'update_question_property');
