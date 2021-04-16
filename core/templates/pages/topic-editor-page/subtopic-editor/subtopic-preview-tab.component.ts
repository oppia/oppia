// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the subtopic preview tab directive.
 */
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');

require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-viewer-page/subtopics-list/subtopics-list.component.ts');
require('services/contextual/window-dimensions.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('subtopicPreviewTab', {
  template: require('./subtopic-preview-tab.component.html'),
  controller: [
    '$scope', 'TopicEditorRoutingService', 'TopicEditorStateService',
    'WindowDimensionsService',
    function(
        $scope, TopicEditorRoutingService, TopicEditorStateService,
        WindowDimensionsService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var _initEditor = function() {
        $scope.topic = TopicEditorStateService.getTopic();
        $scope.subtopicId = (
          TopicEditorRoutingService.getSubtopicIdFromUrl());
        $scope.subtopic = (
          $scope.topic.getSubtopicById(parseInt($scope.subtopicId)));

        if ($scope.topic.getId() && $scope.subtopic) {
          TopicEditorStateService.loadSubtopicPage(
            $scope.topic.getId(), $scope.subtopicId);
          $scope.editableTitle = $scope.subtopic.getTitle();
          $scope.editableThumbnailFilename = (
            $scope.subtopic.getThumbnailFilename());
          $scope.editableThumbnailBgColor = (
            $scope.subtopic.getThumbnailBgColor());
          $scope.subtopicPage = (
            TopicEditorStateService.getSubtopicPage());
          $scope.pageContents = $scope.subtopicPage.getPageContents();
          if ($scope.pageContents) {
            $scope.htmlData = $scope.pageContents.getHtml();
          }
        }
      };

      $scope.navigateToSubtopic = function() {
        TopicEditorRoutingService.navigateToSubtopicEditorWithId(
          $scope.subtopicId);
      };

      ctrl.directiveSubscriptions.add(
        TopicEditorStateService.onSubtopicPageLoaded.subscribe(
          () => {
            $scope.subtopicPage = TopicEditorStateService.getSubtopicPage();
            $scope.pageContents = $scope.subtopicPage.getPageContents();
            $scope.htmlData = $scope.pageContents.getHtml();
          }
        )
      );

      $scope.changeContent = function(itemToDisplay) {
        if (itemToDisplay === $scope.THUMBNAIL) {
          $scope.thumbnailIsShown = true;
          return;
        }
        $scope.thumbnailIsShown = false;
      };

      ctrl.directiveSubscriptions.add(
        TopicEditorStateService.onTopicInitialized.subscribe(
          () => _initEditor()
        ));
      ctrl.directiveSubscriptions.add(
        TopicEditorStateService.onTopicReinitialized.subscribe(
          () => _initEditor()
        ));

      ctrl.$onInit = function() {
        $scope.THUMBNAIL = 'thumbnail';
        $scope.CONTENT = 'content';
        $scope.thumbnailIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        _initEditor();
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
