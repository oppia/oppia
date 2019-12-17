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

require('objects/objectComponentsRequires.ts');
require('pages/interaction-specs.constants.ajs.ts');

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts');
require('pages/story-editor-page/navbar/story-editor-navbar.directive.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');

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
                  'story-save-pending-changes-modal.template.html'),
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
