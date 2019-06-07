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

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('components/ck-editor-helpers/ck-editor-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-widgets.initializer.ts');
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/IsAtLeastFilter.ts');
require('components/forms/validators/IsAtMostFilter.ts');
require('components/forms/validators/IsFloatFilter.ts');
require('components/forms/validators/IsIntegerFilter.ts');
require('components/forms/validators/IsNonemptyFilter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-custom-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-dict-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-html-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-list-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-primitive-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-unicode-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-viewer.directive.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');
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
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require('pages/topic_editor/TopicEditorNavbarBreadcrumbDirective.ts');
require('pages/topic_editor/TopicEditorNavbarDirective.ts');
require('pages/topic_editor/main_editor/TopicEditorTabDirective.ts');
require('pages/topic_editor/questions/QuestionsTabDirective.ts');
require('pages/topic_editor/subtopics_editor/SubtopicsListTabDirective.ts');

require('pages/topic_editor/TopicEditorStateService.ts');
require('services/PageTitleService.ts');
require('services/contextual/UrlService.ts');

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.constant(
  'TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');

oppia.controller('TopicEditor', [
  '$scope', 'PageTitleService', 'TopicEditorStateService', 'UrlService',
  'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
  function($scope, PageTitleService, TopicEditorStateService, UrlService,
      EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED) {
    TopicEditorStateService.loadTopic(UrlService.getTopicIdFromUrl());

    var setPageTitle = function() {
      PageTitleService.setPageTitle(
        TopicEditorStateService.getTopic().getName() + ' - Oppia');
    };
    $scope.$on(EVENT_TOPIC_INITIALIZED, setPageTitle);
    $scope.$on(EVENT_TOPIC_REINITIALIZED, setPageTitle);
  }
]);
