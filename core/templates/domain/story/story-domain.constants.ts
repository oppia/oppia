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

export const StoryDomainConstants = {
  EDITABLE_STORY_DATA_URL_TEMPLATE:
    '/story_editor_handler/data/<story_id>',

  STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE: (
    '/story_url_fragment_handler/<story_url_fragment>'),

  STORY_PUBLISH_URL_TEMPLATE:
    '/story_publish_handler/<story_id>',

  VALIDATE_EXPLORATIONS_URL_TEMPLATE:
    '/validate_story_explorations/<story_id>',

  // These should match the constants defined in core.domain.story_domain.
  CMD_ADD_STORY_NODE: 'add_story_node',
  CMD_DELETE_STORY_NODE: 'delete_story_node',
  CMD_UPDATE_STORY_NODE_OUTLINE_STATUS: 'update_story_node_outline_status',

  CMD_UPDATE_STORY_PROPERTY: 'update_story_property',
  CMD_UPDATE_STORY_NODE_PROPERTY: 'update_story_node_property',
  CMD_UPDATE_STORY_CONTENTS_PROPERTY: 'update_story_contents_property',

  STORY_PROPERTY_TITLE: 'title',
  STORY_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  STORY_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  STORY_PROPERTY_DESCRIPTION: 'description',
  STORY_PROPERTY_NOTES: 'notes',
  STORY_PROPERTY_LANGUAGE_CODE: 'language_code',
  STORY_PROPERTY_URL_FRAGMENT: 'url_fragment',
  STORY_PROPERTY_META_TAG_CONTENT: 'meta_tag_content',

  INITIAL_NODE_ID: 'initial_node_id',
  NODE: 'node',

  STORY_NODE_PROPERTY_TITLE: 'title',
  STORY_NODE_PROPERTY_DESCRIPTION: 'description',
  STORY_NODE_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  STORY_NODE_PROPERTY_OUTLINE: 'outline',
  STORY_NODE_PROPERTY_EXPLORATION_ID: 'exploration_id',
  STORY_NODE_PROPERTY_DESTINATION_NODE_IDS: 'destination_node_ids',
  STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS: 'acquired_skill_ids',
  STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS: 'prerequisite_skill_ids',
  STORY_NODE_PROPERTY_STATUS: 'status',
  STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE_MSECS:
    'planned_publication_date_msecs',
  STORY_NODE_PROPERTY_LAST_MODIFIED_MSECS:
    'last_modified_msecs',
  STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE_MSECS:
    'first_publication_date_msecs',
  STORY_NODE_PROPERTY_UNPUBLISHING_REASON: 'unpublishing_reason'
} as const;
