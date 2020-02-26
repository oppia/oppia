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

export class TopicDomainConstants {
  public static
    TOPIC_EDITOR_STORY_URL_TEMPLATE = '/topic_editor_story_handler/<topic_id>';

  public static
    TOPIC_EDITOR_QUESTION_URL_TEMPLATE =
    '/topic_editor_question_handler/<topic_id>?cursor=<cursor>';

  public static
    TOPIC_MANAGER_RIGHTS_URL_TEMPLATE =
    '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>';
  public static
    TOPIC_RIGHTS_URL_TEMPLATE = '/rightshandler/get_topic_rights/<topic_id>';

  // These should match the constants defined in core.domain.topic_domain.
  public static CMD_ADD_SUBTOPIC = 'add_subtopic';
  public static CMD_DELETE_ADDITIONAL_STORY = 'delete_additional_story';
  public static CMD_DELETE_CANONICAL_STORY = 'delete_canonical_story';
  public static CMD_DELETE_SUBTOPIC = 'delete_subtopic';
  public static
    CMD_REMOVE_UNCATEGORIZED_SKILL_ID = 'remove_uncategorized_skill_id';
  public static CMD_MOVE_SKILL_ID_TO_SUBTOPIC = 'move_skill_id_to_subtopic';
  public static
    CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC = 'remove_skill_id_from_subtopic';

  public static CMD_UPDATE_TOPIC_PROPERTY = 'update_topic_property';
  public static CMD_UPDATE_SUBTOPIC_PROPERTY = 'update_subtopic_property';
  public static
    CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY = 'update_subtopic_page_property';

  public static TOPIC_PROPERTY_NAME = 'name';
  public static TOPIC_PROPERTY_ABBREVIATED_NAME = 'abbreviated_name';
  public static TOPIC_PROPERTY_THUMBNAIL_FILENAME = 'thumbnail_filename';
  public static TOPIC_PROPERTY_DESCRIPTION = 'description';
  public static TOPIC_PROPERTY_LANGUAGE_CODE = 'language_code';

  public static SUBTOPIC_PROPERTY_TITLE = 'title';

  public static
    SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML = 'page_contents_html';
  public static
    SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO = 'page_contents_audio';
}
