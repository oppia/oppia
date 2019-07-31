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

angular.module('oppia').constant(
  'TOPIC_EDITOR_STORY_URL_TEMPLATE', '/topic_editor_story_handler/<topic_id>');

angular.module('oppia').constant(
  'TOPIC_EDITOR_QUESTION_URL_TEMPLATE',
  '/topic_editor_question_handler/<topic_id>?cursor=<cursor>');

angular.module('oppia').constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
angular.module('oppia').constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');

// These should match the constants defined in core.domain.topic_domain.
angular.module('oppia').constant('CMD_ADD_SUBTOPIC', 'add_subtopic');
angular.module('oppia').constant('CMD_DELETE_SUBTOPIC', 'delete_subtopic');
angular.module('oppia').constant(
  'CMD_ADD_UNCATEGORIZED_SKILL_ID', 'add_uncategorized_skill_id');
angular.module('oppia').constant(
  'CMD_REMOVE_UNCATEGORIZED_SKILL_ID', 'remove_uncategorized_skill_id');
angular.module('oppia').constant(
  'CMD_MOVE_SKILL_ID_TO_SUBTOPIC', 'move_skill_id_to_subtopic');
angular.module('oppia').constant(
  'CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC', 'remove_skill_id_from_subtopic');

angular.module('oppia').constant(
  'CMD_UPDATE_TOPIC_PROPERTY', 'update_topic_property');
angular.module('oppia').constant(
  'CMD_UPDATE_SUBTOPIC_PROPERTY', 'update_subtopic_property');
angular.module('oppia').constant(
  'CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY', 'update_subtopic_page_property');

angular.module('oppia').constant('TOPIC_PROPERTY_NAME', 'name');
angular.module('oppia').constant('TOPIC_PROPERTY_DESCRIPTION', 'description');
angular.module('oppia').constant(
  'TOPIC_PROPERTY_CANONICAL_STORY_IDS', 'canonical_story_ids');
angular.module('oppia').constant(
  'TOPIC_PROPERTY_ADDITIONAL_STORY_IDS', 'additional_story_ids');
angular.module('oppia').constant(
  'TOPIC_PROPERTY_LANGUAGE_CODE', 'language_code');

angular.module('oppia').constant('SUBTOPIC_PROPERTY_TITLE', 'title');

angular.module('oppia').constant(
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML', 'page_contents_html');
angular.module('oppia').constant(
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO', 'page_contents_audio');
