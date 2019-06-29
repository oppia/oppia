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
 * @fileoverview Constants for skill domain.
 */

var oppia = require('AppInit.ts').module;

oppia.constant(
  'CONCEPT_CARD_DATA_URL_TEMPLATE', '/concept_card_handler/<skill_id>');

oppia.constant(
  'EDITABLE_SKILL_DATA_URL_TEMPLATE',
  '/skill_editor_handler/data/<skill_id>');

oppia.constant(
  'SKILL_DATA_URL_TEMPLATE',
  '/skill_data_handler/<comma_separated_skill_ids>');

oppia.constant(
  'SKILL_EDITOR_QUESTION_URL_TEMPLATE',
  '/skill_editor_question_handler/<skill_id>?cursor=<cursor>');

oppia.constant('SKILL_PROPERTY_DESCRIPTION', 'description');
oppia.constant('SKILL_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('SKILL_CONTENTS_PROPERTY_EXPLANATION', 'explanation');
oppia.constant('SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES', 'worked_examples');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_NAME', 'name');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_NOTES', 'notes');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK', 'feedback');

oppia.constant('CMD_UPDATE_SKILL_PROPERTY',
  'update_skill_property');
oppia.constant('CMD_UPDATE_SKILL_CONTENTS_PROPERTY',
  'update_skill_contents_property');
oppia.constant('CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY',
  'update_skill_misconceptions_property');

oppia.constant('CMD_ADD_SKILL_MISCONCEPTION',
  'add_skill_misconception');
oppia.constant('CMD_DELETE_SKILL_MISCONCEPTION',
  'delete_skill_misconception');
