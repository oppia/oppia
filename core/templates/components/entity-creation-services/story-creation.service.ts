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
  'new-story-title-editor-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').factory('StoryCreationService', [
  '$http', '$uibModal', '$window', 'AlertsService', 'LoaderService',
  'TopicEditorStateService', 'UrlInterpolationService',
  function(
      $http, $uibModal, $window, AlertsService, LoaderService,
      TopicEditorStateService, UrlInterpolationService) {
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
            'new-story-title-editor.template.html'),
          backdrop: true,
          controller: 'NewStoryTitleEditorModalController'
        }).result.then(function(storyTitle) {
          if (storyTitle === '') {
            throw new Error('Story title cannot be empty');
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
          $http.post(createStoryUrl, {title: storyTitle})
            .then(function(response) {
              $window.location = UrlInterpolationService.interpolateUrl(
                STORY_EDITOR_URL_TEMPLATE, {
                  story_id: response.data.storyId
                }
              );
            }, function() {
              LoaderService.hideLoadingScreen();
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
