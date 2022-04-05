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
 * @fileoverview Modal and functionality for the create story button.
 */

require(
  'pages/topic-editor-page/modal-templates/' +
  'create-new-story-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').factory('StoryCreationService', [
  '$http', '$uibModal', '$window', 'AlertsService', 'ImageLocalStorageService',
  'LoaderService', 'TopicEditorStateService', 'UrlInterpolationService',
  function(
      $http, $uibModal, $window, AlertsService, ImageLocalStorageService,
      LoaderService, TopicEditorStateService, UrlInterpolationService) {
    var STORY_EDITOR_URL_TEMPLATE = '/story_editor/<story_id>';
    var STORY_CREATOR_URL_TEMPLATE = '/topic_editor_story_handler/<topic_id>';
    var storyCreationInProgress = false;

    return {
      createNewCanonicalStory: function() {
        if (storyCreationInProgress) {
          return;
        }
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topic-editor-page/modal-templates/' +
            'create-new-story-modal.template.html'),
          backdrop: 'static',
          controller: 'CreateNewStoryModalController'
        }).result.then(function(newlyCreatedStory) {
          if (!newlyCreatedStory.isValid()) {
            throw new Error('Story fields cannot be empty');
          }
          storyCreationInProgress = true;
          AlertsService.clearWarnings();
          var topic = TopicEditorStateService.getTopic();
          LoaderService.showLoadingScreen('Creating story');
          var createStoryUrl = UrlInterpolationService.interpolateUrl(
            STORY_CREATOR_URL_TEMPLATE, {
              topic_id: topic.getId()
            }
          );
          var imagesData = ImageLocalStorageService.getStoredImagesData();
          var bgColor = ImageLocalStorageService.getThumbnailBgColor();
          let postData = {
            title: newlyCreatedStory.title,
            description: newlyCreatedStory.description,
            story_url_fragment: newlyCreatedStory.urlFragment,
            thumbnailBgColor: bgColor,
            filename: imagesData[0].filename
          };

          let body = new FormData();
          body.append('payload', JSON.stringify(postData));
          body.append('image', imagesData[0].imageBlob);

          $http.post(createStoryUrl, (body), {
            // The actual header to be added for form-data is
            // 'multipart/form-data', But adding it manually won't work because
            // we will miss the boundary parameter. When we keep 'Content-Type'
            // as undefined the browser automatically fills the boundary
            // parameter according to the form
            // data. Refer https://stackoverflow.com/questions/37039852/. and
            // https://stackoverflow.com/questions/34983071/.
            // Note: This should be removed and a convetion similar to
            // StoryCreationService should be followed once this service
            // is migrated to Angular 8.
            headers: {
              'Content-Type': undefined
            }
          })
            .then(function(response) {
              $window.open(UrlInterpolationService.interpolateUrl(
                STORY_EDITOR_URL_TEMPLATE, {
                  story_id: response.data.storyId
                }
              ));
              $window.location.reload();
            }, function() {
              LoaderService.hideLoadingScreen();
              ImageLocalStorageService.flushStoredImagesData();
            });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      }
    };
  }
]);
