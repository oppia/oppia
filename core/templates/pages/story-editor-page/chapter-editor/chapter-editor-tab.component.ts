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
 * @fileoverview Component for the chapter editor tab.
 */
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');

require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/services/story-editor-navigation.service');
require('pages/story-editor-page/story-editor-page.constants.ajs.ts');
require('pages/story-editor-page/editor-tab/story-node-editor.directive.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('chapterEditorTab', {
  template: require('./chapter-editor-tab.component.html'),
  controller: [
    'StoryEditorNavigationService', 'StoryEditorStateService',
    function(
        StoryEditorNavigationService, StoryEditorStateService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.initEditor = function() {
        ctrl.story = StoryEditorStateService.getStory();
        ctrl.storyContents = ctrl.story.getStoryContents();
        ctrl.chapterIndex = StoryEditorNavigationService.getChapterIndex();
        ctrl.chapterId = StoryEditorNavigationService.getChapterId();
        if (ctrl.storyContents &&
            ctrl.storyContents.getNodes().length > 0) {
          ctrl.nodes = ctrl.storyContents.getNodes();
          if (!ctrl.chapterIndex) {
            ctrl.storyContents.getNodes().map((node, index) => {
              if (node.getId() === ctrl.chapterId) {
                ctrl.chapterIndex = index;
                return;
              }
            });
          }
          ctrl.node = ctrl.nodes[ctrl.chapterIndex];
        }
      };

      ctrl.navigateToStoryEditor = function() {
        StoryEditorNavigationService.navigateToStoryEditor();
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryInitialized.subscribe(
            () => ctrl.initEditor()
          )
        );
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryReinitialized.subscribe(
            () => ctrl.initEditor()
          )
        );
        ctrl.initEditor();
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
