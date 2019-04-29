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

//vvv this block of requires should be removed vvv
require('components/forms/ConvertUnicodeWithParamsToHtmlFilter.js');
require('components/forms/ConvertHtmlToUnicodeFilter.js');
require('components/forms/ConvertUnicodeToHtmlFilter.js');
require('components/forms/validators/IsAtLeastFilter.js');
require('components/forms/validators/IsAtMostFilter.js');
require('components/forms/validators/IsFloatFilter.js');
require('components/forms/validators/IsIntegerFilter.js');
require('components/forms/validators/IsNonemptyFilter.js');
require('components/forms/ApplyValidationDirective.js');
require('components/forms/RequireIsFloatDirective.js');
require('directives/AngularHtmlBindDirective.js');
require('directives/MathjaxBindDirective.js');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedExpressionEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.js');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.js');
require('components/forms/schema_viewers/SchemaBasedCustomViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedDictViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedListViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.js');
require('components/forms/schema_viewers/SchemaBasedViewerDirective.js');
require('components/forms/Select2DropdownDirective.js');
require('components/forms/ImageUploaderDirective.js');
//^^^ this block of requires should be removed ^^^

require('pages/topic_editor/TopicEditorNavbarBreadcrumbDirective.js');
require('pages/topic_editor/TopicEditorNavbarDirective.js');
require('pages/topic_editor/main_editor/TopicEditorTabDirective.js');
require('pages/topic_editor/questions/QuestionsTabDirective.js');
require('pages/topic_editor/subtopics_editor/SubtopicsListTabDirective.js');

require('pages/topic_editor/TopicEditorStateService.js');
require('services/contextual/UrlService.js');

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
oppia.constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
oppia.constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

oppia.constant(
  'TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');

oppia.controller('TopicEditor', [
  '$scope', 'TopicEditorStateService', 'UrlService',
  function($scope, TopicEditorStateService, UrlService) {
    TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());
  }
]);
