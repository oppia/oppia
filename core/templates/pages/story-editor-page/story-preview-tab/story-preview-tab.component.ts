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
 * @fileoverview Component for the story preview tab.
 */
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');

require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/story-editor-page.constants.ajs.ts');
require('pages/story-editor-page/editor-tab/story-node-editor.directive.ts');
require('services/assets-backend-api.service.ts');
require('services/contextual/url.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('storyPreviewTab', {
  template: require('./story-preview-tab.component.html'),
  controller: [
    'AssetsBackendApiService', 'StoryEditorStateService', 'UrlService',
    function(
        AssetsBackendApiService, StoryEditorStateService, UrlService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.initEditor = function() {
        ctrl.story = StoryEditorStateService.getStory();
        ctrl.storyId = StoryEditorStateService.getStory().getId();
        ctrl.storyContents = ctrl.story.getStoryContents();
        if (ctrl.storyContents &&
            ctrl.storyContents.getNodes().length > 0) {
          ctrl.nodes = ctrl.storyContents.getNodes();
          ctrl.pathIconParameters = ctrl.generatePathIconParameters();
        }
      };

      ctrl.generatePathIconParameters = function() {
        var storyNodes = ctrl.nodes;
        var iconParametersArray = [];
        let thumbnailIconUrl = storyNodes[0].getThumbnailFilename() ? (
                AssetsBackendApiService.getThumbnailUrlForPreview(
                  'story', ctrl.storyId,
                  storyNodes[0].getThumbnailFilename())) : null;
        iconParametersArray.push({
          thumbnailIconUrl: thumbnailIconUrl,
          thumbnailBgColor: storyNodes[0].getThumbnailBgColor()
        });

        for (
          var i = 1; i < ctrl.nodes.length; i++) {
          thumbnailIconUrl = storyNodes[i].getThumbnailFilename() ? (
              AssetsBackendApiService.getThumbnailUrlForPreview(
                'story', ctrl.storyId,
                storyNodes[i].getThumbnailFilename())) : null;
          iconParametersArray.push({
            thumbnailIconUrl: thumbnailIconUrl,
            thumbnailBgColor: storyNodes[i].getThumbnailBgColor()
          });
        }
        return iconParametersArray;
      };

      ctrl.getExplorationUrl = function(node) {
        var result = '/explore/' + node.getExplorationId();
        result = UrlService.addField(
          result, 'story_id', ctrl.storyId);
        result = UrlService.addField(
          result, 'node_id', node.getId());
        return result;
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
