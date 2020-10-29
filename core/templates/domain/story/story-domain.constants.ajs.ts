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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { StoryDomainConstants } from 'domain/story/story-domain.constants';

angular.module('oppia').constant(
  'EDITABLE_STORY_DATA_URL_TEMPLATE',
  StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE);

angular.module('oppia').constant(
  'STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE',
  StoryDomainConstants.STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE);

angular.module('oppia').constant(
  'STORY_PUBLISH_URL_TEMPLATE',
  StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE);

angular.module('oppia').constant(
  'VALIDATE_EXPLORATIONS_URL_TEMPLATE',
  StoryDomainConstants.VALIDATE_EXPLORATIONS_URL_TEMPLATE);

// These should match the constants defined in core.domain.story_domain.
angular.module('oppia').constant(
  'CMD_ADD_STORY_NODE', StoryDomainConstants.CMD_ADD_STORY_NODE);
angular.module('oppia').constant(
  'CMD_DELETE_STORY_NODE', StoryDomainConstants.CMD_DELETE_STORY_NODE);
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS',
  StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS);

angular.module('oppia').constant(
  'CMD_UPDATE_STORY_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_PROPERTY);
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_NODE_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_NODE_PROPERTY);
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_CONTENTS_PROPERTY',
  StoryDomainConstants.CMD_UPDATE_STORY_CONTENTS_PROPERTY);

angular.module('oppia').constant(
  'STORY_PROPERTY_TITLE', StoryDomainConstants.STORY_PROPERTY_TITLE);
angular.module('oppia').constant(
  'STORY_PROPERTY_THUMBNAIL_FILENAME',
  StoryDomainConstants.STORY_PROPERTY_THUMBNAIL_FILENAME);
angular.module('oppia').constant(
  'STORY_PROPERTY_THUMBNAIL_BG_COLOR',
  StoryDomainConstants.STORY_PROPERTY_THUMBNAIL_BG_COLOR);
angular.module('oppia').constant(
  'STORY_PROPERTY_DESCRIPTION',
  StoryDomainConstants.STORY_PROPERTY_DESCRIPTION);
angular.module('oppia').constant(
  'STORY_PROPERTY_NOTES', StoryDomainConstants.STORY_PROPERTY_NOTES);
angular.module('oppia').constant(
  'STORY_PROPERTY_LANGUAGE_CODE',
  StoryDomainConstants.STORY_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant(
  'STORY_PROPERTY_URL_FRAGMENT',
  StoryDomainConstants.STORY_PROPERTY_URL_FRAGMENT);
angular.module('oppia').constant(
  'STORY_PROPERTY_META_TAG_CONTENT',
  StoryDomainConstants.STORY_PROPERTY_META_TAG_CONTENT);

angular.module('oppia').constant(
  'INITIAL_NODE_ID', StoryDomainConstants.INITIAL_NODE_ID);
angular.module('oppia').constant('NODE', StoryDomainConstants.NODE);

angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_TITLE', StoryDomainConstants.STORY_NODE_PROPERTY_TITLE);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_DESCRIPTION',
  StoryDomainConstants.STORY_NODE_PROPERTY_DESCRIPTION);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_THUMBNAIL_FILENAME',
  StoryDomainConstants.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR',
  StoryDomainConstants.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_OUTLINE',
  StoryDomainConstants.STORY_NODE_PROPERTY_OUTLINE);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_EXPLORATION_ID',
  StoryDomainConstants.STORY_NODE_PROPERTY_EXPLORATION_ID);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS);
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
  StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS);
