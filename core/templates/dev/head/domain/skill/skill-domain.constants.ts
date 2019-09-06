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

export class SkillDomainConstants {
  public static CONCEPT_CARD_DATA_URL_TEMPLATE =
    '/concept_card_handler/<comma_separated_skill_ids>';
  public static EDITABLE_SKILL_DATA_URL_TEMPLATE =
    '/skill_editor_handler/data/<skill_id>';

  public static SKILL_DATA_URL_TEMPLATE =
    '/skill_data_handler/<comma_separated_skill_ids>';
  public static SKILL_EDITOR_QUESTION_URL_TEMPLATE =
    '/skill_editor_question_handler/<skill_id>?cursor=<cursor>';

  public static SKILL_MASTERY_DATA_URL_TEMPLATE =
    '/skill_mastery_handler/data';

  public static SKILL_PROPERTY_DESCRIPTION = 'description';
  public static SKILL_PROPERTY_LANGUAGE_CODE = 'language_code';
  public static SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation';
  public static SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples';
  public static SKILL_MISCONCEPTIONS_PROPERTY_NAME = 'name';
  public static SKILL_MISCONCEPTIONS_PROPERTY_NOTES = 'notes';
  public static SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK = 'feedback';

  public static CMD_UPDATE_SKILL_PROPERTY =
    'update_skill_property';
  public static CMD_UPDATE_SKILL_CONTENTS_PROPERTY =
    'update_skill_contents_property';
  public static CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY =
    'update_skill_misconceptions_property';

  public static CMD_ADD_SKILL_MISCONCEPTION =
    'add_skill_misconception';
  public static CMD_DELETE_SKILL_MISCONCEPTION =
    'delete_skill_misconception';

  public static CMD_UPDATE_RUBRICS = 'update_rubrics';
}
