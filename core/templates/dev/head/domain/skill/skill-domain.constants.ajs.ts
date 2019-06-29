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

import { SkillDomainConstants } from 'domain/skill/skill-domain.constants.ts';

var oppia = require('AppInit.ts').module;

oppia.constant(
  'CONCEPT_CARD_DATA_URL_TEMPLATE',
  SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE);

oppia.constant(
  'EDITABLE_SKILL_DATA_URL_TEMPLATE',
  SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE);

oppia.constant(
  'SKILL_DATA_URL_TEMPLATE',
  SkillDomainConstants.SKILL_DATA_URL_TEMPLATE);

oppia.constant(
  'SKILL_EDITOR_QUESTION_URL_TEMPLATE',
  SkillDomainConstants.SKILL_EDITOR_QUESTION_URL_TEMPLATE);

oppia.constant(
  'SKILL_PROPERTY_DESCRIPTION',
  SkillDomainConstants.SKILL_PROPERTY_DESCRIPTION);
oppia.constant(
  'SKILL_PROPERTY_LANGUAGE_CODE',
  SkillDomainConstants.SKILL_PROPERTY_LANGUAGE_CODE);
oppia.constant(
  'SKILL_CONTENTS_PROPERTY_EXPLANATION',
  SkillDomainConstants.SKILL_CONTENTS_PROPERTY_EXPLANATION);
oppia.constant(
  'SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES',
  SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES);
oppia.constant(
  'SKILL_MISCONCEPTIONS_PROPERTY_NAME',
  SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NAME);
oppia.constant(
  'SKILL_MISCONCEPTIONS_PROPERTY_NOTES',
  SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NOTES);
oppia.constant(
  'SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK',
  SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK);

oppia.constant(
  'CMD_UPDATE_SKILL_PROPERTY',
  SkillDomainConstants.CMD_UPDATE_SKILL_PROPERTY);
oppia.constant(
  'CMD_UPDATE_SKILL_CONTENTS_PROPERTY',
  SkillDomainConstants.CMD_UPDATE_SKILL_CONTENTS_PROPERTY);
oppia.constant(
  'CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY',
  SkillDomainConstants.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY);

oppia.constant(
  'CMD_ADD_SKILL_MISCONCEPTION',
  SkillDomainConstants.CMD_ADD_SKILL_MISCONCEPTION);
oppia.constant(
  'CMD_DELETE_SKILL_MISCONCEPTION',
  SkillDomainConstants.CMD_DELETE_SKILL_MISCONCEPTION);
