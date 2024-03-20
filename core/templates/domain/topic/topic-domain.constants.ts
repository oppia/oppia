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
 * @fileoverview Constants for topic domain.
 */

export const TopicDomainConstants = {
  TOPIC_EDITOR_STORY_URL_TEMPLATE: '/topic_editor_story_handler/<topic_id>',

  TOPIC_NAME_HANDLER_URL_TEMPLATE: '/topic_name_handler/<topic_name>',

  TOPIC_URL_FRAGMENT_HANDLER_URL_TEMPLATE:
    '/topic_url_fragment_handler/<topic_url_fragment>',

  TOPIC_EDITOR_QUESTION_URL_TEMPLATE:
    '/topic_editor_question_handler/<topic_id>?cursor=<cursor>',

  TOPIC_MANAGER_RIGHTS_URL_TEMPLATE:
    '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>',
  TOPIC_RIGHTS_URL_TEMPLATE: '/rightshandler/get_topic_rights/<topic_id>',

  // These should match the constants defined in core.domain.topic_domain.
  CMD_ADD_SUBTOPIC: 'add_subtopic',
  CMD_DELETE_ADDITIONAL_STORY: 'delete_additional_story',
  CMD_DELETE_CANONICAL_STORY: 'delete_canonical_story',
  CMD_DELETE_SUBTOPIC: 'delete_subtopic',
  CMD_REARRANGE_CANONICAL_STORY: 'rearrange_canonical_story',
  CMD_REARRANGE_SKILL_IN_SUBTOPIC: 'rearrange_skill_in_subtopic',
  CMD_REARRANGE_SUBTOPIC: 'rearrange_subtopic',
  CMD_REMOVE_UNCATEGORIZED_SKILL_ID: 'remove_uncategorized_skill_id',
  CMD_MOVE_SKILL_ID_TO_SUBTOPIC: 'move_skill_id_to_subtopic',
  CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC: 'remove_skill_id_from_subtopic',

  CMD_UPDATE_TOPIC_PROPERTY: 'update_topic_property',
  CMD_UPDATE_SUBTOPIC_PROPERTY: 'update_subtopic_property',
  CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY: 'update_subtopic_page_property',

  TOPIC_PROPERTY_NAME: 'name',
  TOPIC_PROPERTY_ABBREVIATED_NAME: 'abbreviated_name',
  TOPIC_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  TOPIC_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  TOPIC_PROPERTY_DESCRIPTION: 'description',
  TOPIC_PROPERTY_LANGUAGE_CODE: 'language_code',
  TOPIC_PROPERTY_URL_FRAGMENT: 'url_fragment',
  TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED: 'practice_tab_is_displayed',
  TOPIC_PROPERTY_META_TAG_CONTENT: 'meta_tag_content',
  TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB: 'page_title_fragment_for_web',
  TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST: 'skill_ids_for_diagnostic_test',

  SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  SUBTOPIC_PROPERTY_TITLE: 'title',
  SUBTOPIC_PROPERTY_URL_FRAGMENT: 'url_fragment',

  SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML: 'page_contents_html',
  SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO: 'page_contents_audio',
} as const;
