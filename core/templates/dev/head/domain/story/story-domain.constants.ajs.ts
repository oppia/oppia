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
 * @fileoverview Constants for story domain.
 */

import { StoryDomainConstants } from 'domain/story/story-domain.constants.ts';

var oppia = require('AppInit.ts').module;

oppia.constant(
  'EDITABLE_STORY_DATA_URL_TEMPLATE',
  StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE);

// These should match the constants defined in core.domain.story_domain.
oppia.constant('CMD_ADD_STORY_NODE', StoryDomainConstants.CMD_ADD_STORY_NODE);
oppia.constant(
  'CMD_DELETE_STORY_NODE', StoryDomainConstants.CMD_DELETE_STORY_NODE);
oppia.constant(
  'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS',
  StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS);

oppia.constant(
  'CMD_UPDATE_STORY_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_PROPERTY);
oppia.constant(
  'CMD_UPDATE_STORY_NODE_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_NODE_PROPERTY);
oppia.constant(
  'CMD_UPDATE_STORY_CONTENTS_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_CONTENTS_PROPERTY);

oppia.constant(
  'STORY_PROPERTY_TITLE', StoryDomainConstants.STORY_PROPERTY_TITLE);
oppia.constant(
  'STORY_PROPERTY_DESCRIPTION',
  StoryDomainConstants.STORY_PROPERTY_DESCRIPTION);
oppia.constant(
  'STORY_PROPERTY_NOTES', StoryDomainConstants.STORY_PROPERTY_NOTES);
oppia.constant(
  'STORY_PROPERTY_LANGUAGE_CODE',
  StoryDomainConstants.STORY_PROPERTY_LANGUAGE_CODE);

oppia.constant('INITIAL_NODE_ID', StoryDomainConstants.INITIAL_NODE_ID);

oppia.constant(
  'STORY_NODE_PROPERTY_TITLE', StoryDomainConstants.STORY_NODE_PROPERTY_TITLE);
oppia.constant(
  'STORY_NODE_PROPERTY_OUTLINE',
  StoryDomainConstants.STORY_NODE_PROPERTY_OUTLINE);
oppia.constant(
  'STORY_NODE_PROPERTY_EXPLORATION_ID',
  StoryDomainConstants.STORY_NODE_PROPERTY_EXPLORATION_ID);
oppia.constant(
  'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS);
oppia.constant(
  'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS);
oppia.constant(
  'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS);
