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

export const SkillDomainConstants = {
  CONCEPT_CARD_DATA_URL_TEMPLATE: '/concept_card_handler/<selected_skill_ids>',
  EDITABLE_SKILL_DATA_URL_TEMPLATE: '/skill_editor_handler/data/<skill_id>',

  SKILL_DATA_URL_TEMPLATE: '/skill_data_handler/<comma_separated_skill_ids>',
  FETCH_SKILLS_URL_TEMPLATE: '/fetch_skills',
  SKILL_EDITOR_QUESTION_URL_TEMPLATE:
    '/skill_editor_question_handler/<skill_id>?cursor=<cursor>',

  SKILL_DESCRIPTION_HANDLER_URL_TEMPLATE:
    '/skill_description_handler/<skill_description>',

  SKILL_MASTERY_DATA_URL_TEMPLATE: '/skill_mastery_handler/data',

  SKILL_ASSIGNMENT_FOR_DIAGNOSTIC_TEST_URL_TEMPLATE:
    '/diagnostic_test_skill_assignment_handler/<skill_id>',

  SKILL_PROPERTY_DESCRIPTION: 'description',
  SKILL_PROPERTY_LANGUAGE_CODE: 'language_code',
  SKILL_CONTENTS_PROPERTY_EXPLANATION: 'explanation',
  SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES: 'worked_examples',
  SKILL_MISCONCEPTIONS_PROPERTY_NAME: 'name',
  SKILL_MISCONCEPTIONS_PROPERTY_NOTES: 'notes',
  SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK: 'feedback',
  SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED: 'must_be_addressed',

  CMD_UPDATE_SKILL_PROPERTY: 'update_skill_property',
  CMD_UPDATE_SKILL_CONTENTS_PROPERTY: 'update_skill_contents_property',
  CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY:
    'update_skill_misconceptions_property',

  CMD_ADD_SKILL_MISCONCEPTION: 'add_skill_misconception',
  CMD_DELETE_SKILL_MISCONCEPTION: 'delete_skill_misconception',

  CMD_ADD_PREREQUISITE_SKILL: 'add_prerequisite_skill',
  CMD_DELETE_PREREQUISITE_SKILL: 'delete_prerequisite_skill',

  CMD_UPDATE_RUBRICS: 'update_rubrics',
} as const;
