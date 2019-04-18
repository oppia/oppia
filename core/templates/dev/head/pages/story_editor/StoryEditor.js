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

require('services/HtmlEscaperService.js');
require('services/IdGenerationService.js');
require('services/RteHelperService.js');
require('services/SchemaDefaultValueService.js');
require('services/SchemaUndefinedLastElementService.js');
require('services/NestedDirectivesRecursionTimeoutPreventionService.js');
require('services/GenerateContentIdService.js');
require('components/loading/LoadingDotsDirective.js');

require('domain/editor/undo_redo/ChangeObjectFactory.js');
require('domain/editor/undo_redo/UndoRedoService.js');
require('domain/editor/undo_redo/QuestionUndoRedoService.js');
require('domain/editor/undo_redo/BaseUndoRedoService.js');
require('domain/story/EditableStoryBackendApiService.js');
require('domain/story/StoryObjectFactory.js');
require('domain/story/StoryContentsObjectFactory.js');
require('domain/story/StoryNodeObjectFactory.js');
require('domain/story/StoryUpdateService.js');

require('pages/story_editor/StoryEditorNavbarBreadcrumbDirective.js');
require('pages/story_editor/StoryEditorNavbarDirective.js');
require('pages/story_editor/main_editor/StoryEditorDirective.js');

require('domain/editor/undo_redo/UndoRedoService.js');
require('domain/utilities/UrlInterpolationService.js');
require('pages/story_editor/StoryEditorStateService.js');
require('services/contextual/UrlService.js');

oppia.constant('NODE_ID_PREFIX', 'node_');

oppia.controller('StoryEditor', [
  '$scope', '$uibModal', '$window', 'StoryEditorStateService',
  'UndoRedoService',
  'UrlInterpolationService', 'UrlService',
  function(
      $scope, $uibModal, $window, StoryEditorStateService,
      UndoRedoService,
      UrlInterpolationService, UrlService) {
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
  }
]);
