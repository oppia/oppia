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
 * @fileoverview Primary controller for the topic editor page.
 */

angular.module('topicEditorPageModule', [
  'topicEditorNavbarBreadcrumbModule', 'topicEditorNavbarModule',
  'subtopicsListTabModule', 'questionsTabModule', 'mainTopicEditorModule']);

angular.module('topicEditorPageModule').constant(
  'INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('topicEditorPageModule').constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
angular.module('topicEditorPageModule').constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
angular.module('topicEditorPageModule').constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
angular.module('topicEditorPageModule').constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

angular.module('topicEditorPageModule').constant(
  'TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');
