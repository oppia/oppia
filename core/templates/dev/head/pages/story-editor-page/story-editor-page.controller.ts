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
require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-5-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
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

require('objects/objectComponentsRequires.ts');

require('services/HtmlEscaperService.ts');
require('services/IdGenerationService.ts');
require('services/RteHelperService.ts');
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

require('pages/interaction-specs.constants.ajs.ts');
require(
  'pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts');
require('pages/story-editor-page/navbar/story-editor-navbar.directive.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/PageTitleService.ts');
require('services/contextual/UrlService.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

angular.module('oppia').directive('storyEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/story-editor-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$uibModal', '$window', 'PageTitleService',
        'StoryEditorStateService', 'UndoRedoService',
        'UrlInterpolationService', 'UrlService',
        'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
        function(
            $scope, $uibModal, $window, PageTitleService,
            StoryEditorStateService, UndoRedoService,
            UrlInterpolationService, UrlService,
            EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
          var ctrl = this;
          var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
          StoryEditorStateService.loadStory(UrlService.getStoryIdFromUrl());

          ctrl.returnToTopicEditorPage = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              var modalInstance = $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/story-editor-page/modal-templates/' +
                  'save-pending-changes-modal.template.html'),
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
                    topicId:
                      StoryEditorStateService.
                        getStory().getCorrespondingTopicId()
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
      ]
    };
  }]);
