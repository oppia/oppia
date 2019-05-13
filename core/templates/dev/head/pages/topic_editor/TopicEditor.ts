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

// vvv this block of requires should be removed vvv
require('components/CkEditorRteDirective.ts');
require('components/CkEditorWidgetsInitializer.ts');
require('components/forms/ConvertUnicodeWithParamsToHtmlFilter.ts');
require('components/forms/ConvertHtmlToUnicodeFilter.ts');
require('components/forms/ConvertUnicodeToHtmlFilter.ts');
require('components/forms/validators/IsAtLeastFilter.ts');
require('components/forms/validators/IsAtMostFilter.ts');
require('components/forms/validators/IsFloatFilter.ts');
require('components/forms/validators/IsIntegerFilter.ts');
require('components/forms/validators/IsNonemptyFilter.ts');
require('components/forms/ApplyValidationDirective.ts');
require('components/forms/RequireIsFloatDirective.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedEditorDirective.ts');
require(
  'components/forms/schema_editors/SchemaBasedExpressionEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.ts');
require('components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedListViewerDirective.ts');
require(
  'components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedViewerDirective.ts');
require('components/forms/Select2DropdownDirective.ts');
require('components/forms/ImageUploaderDirective.ts');
require('components/state/AnswerGroupEditorDirective.ts');
require('components/state/HintEditorDirective.ts');
require('components/state/OutcomeEditorDirective.ts');
require('components/state/OutcomeDestinationEditorDirective.ts');
require('components/state/OutcomeFeedbackEditorDirective.ts');
require('components/state/ResponseHeaderDirective.ts');
require('components/state/RuleEditorDirective.ts');
require('components/state/RuleTypeSelectorDirective.ts');
require('components/state/SolutionEditorDirective.ts');
require('components/state/SolutionExplanationEditorDirective.ts');
// ^^^ this block of requires should be removed ^^^

require('pages/topic_editor/TopicEditorNavbarBreadcrumbDirective.ts');
require('pages/topic_editor/TopicEditorNavbarDirective.ts');
require('pages/topic_editor/main_editor/TopicEditorTabDirective.ts');
require('pages/topic_editor/questions/QuestionsTabDirective.ts');
require('pages/topic_editor/subtopics_editor/SubtopicsListTabDirective.ts');

require('pages/topic_editor/TopicEditorStateService.ts');
require('services/contextual/UrlService.ts');

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.constant(
  'TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');

oppia.controller('TopicEditor', [
  '$scope', 'TopicEditorStateService', 'UrlService',
  function($scope, TopicEditorStateService, UrlService) {
    TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());
  }
]);
