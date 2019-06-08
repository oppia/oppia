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
 * @fileoverview Primary controller for the story editor page.
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
require('services/HtmlEscaperService.ts');
require('services/IdGenerationService.ts');
require('services/RteHelperService.ts');
require('services/SchemaDefaultValueService.ts');
require('services/SchemaUndefinedLastElementService.ts');
require('services/NestedDirectivesRecursionTimeoutPreventionService.ts');
require('services/GenerateContentIdService.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require('domain/editor/undo_redo/ChangeObjectFactory.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/editor/undo_redo/QuestionUndoRedoService.ts');
require('domain/editor/undo_redo/BaseUndoRedoService.ts');
require('domain/story/EditableStoryBackendApiService.ts');
require('domain/story/StoryObjectFactory.ts');
require('domain/story/StoryContentsObjectFactory.ts');
require('domain/story/StoryNodeObjectFactory.ts');
require('domain/story/StoryUpdateService.ts');
// ^^^ this block of requires should be removed ^^^

require('pages/story_editor/StoryEditorNavbarBreadcrumbDirective.ts');
require('pages/story_editor/StoryEditorNavbarDirective.ts');
require('pages/story_editor/main_editor/StoryEditorDirective.ts');

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/story_editor/StoryEditorStateService.ts');
require('services/PageTitleService.ts');
require('services/contextual/UrlService.ts');

oppia.constant('NODE_ID_PREFIX', 'node_');

oppia.controller('StoryEditor', [
  '$scope', '$uibModal', '$window', 'PageTitleService',
  'StoryEditorStateService', 'UndoRedoService',
  'UrlInterpolationService', 'UrlService',
  'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
  function(
      $scope, $uibModal, $window, PageTitleService,
      StoryEditorStateService, UndoRedoService,
      UrlInterpolationService, UrlService,
      EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
    var topicId = UrlService.getTopicIdFromUrl();
    StoryEditorStateService.loadStory(
      topicId, UrlService.getStoryIdFromUrl());

    $scope.returnToTopicEditorPage = function() {
      if (UndoRedoService.getChangeCount() > 0) {
        var modalInstance = $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/story_editor/save_pending_changes_modal_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        });
      } else {
        $window.open(
          UrlInterpolationService.interpolateUrl(
            TOPIC_EDITOR_URL_TEMPLATE, {
              topicId: topicId
            }
          ), '_self');
      }
    };

    var setPageTitle = function() {
      PageTitleService.setPageTitle(
        StoryEditorStateService.getStory().getTitle() + ' - Oppia');
    };
    $scope.$on(EVENT_STORY_INITIALIZED, setPageTitle);
    $scope.$on(EVENT_STORY_REINITIALIZED, setPageTitle);
  }
]);
