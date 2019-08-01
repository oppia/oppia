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

angular.module('oppia').constant(
  'EDITABLE_STORY_DATA_URL_TEMPLATE',
  '/story_editor_handler/data/<topic_id>/<story_id>');

// These should match the constants defined in core.domain.story_domain.
angular.module('oppia').constant('CMD_ADD_STORY_NODE', 'add_story_node');
angular.module('oppia').constant('CMD_DELETE_STORY_NODE', 'delete_story_node');
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS', 'update_story_node_outline_status');

angular.module('oppia').constant(
  'CMD_UPDATE_STORY_PROPERTY', 'update_story_property');
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_NODE_PROPERTY', 'update_story_node_property');
angular.module('oppia').constant(
  'CMD_UPDATE_STORY_CONTENTS_PROPERTY', 'update_story_contents_property');

angular.module('oppia').constant('STORY_PROPERTY_TITLE', 'title');
angular.module('oppia').constant('STORY_PROPERTY_DESCRIPTION', 'description');
angular.module('oppia').constant('STORY_PROPERTY_NOTES', 'notes');
angular.module('oppia').constant(
  'STORY_PROPERTY_LANGUAGE_CODE', 'language_code');

angular.module('oppia').constant('INITIAL_NODE_ID', 'initial_node_id');

angular.module('oppia').constant('STORY_NODE_PROPERTY_TITLE', 'title');
angular.module('oppia').constant('STORY_NODE_PROPERTY_OUTLINE', 'outline');
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_EXPLORATION_ID', 'exploration_id');
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS', 'destination_node_ids');
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS', 'acquired_skill_ids');
angular.module('oppia').constant(
  'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS', 'prerequisite_skill_ids');
