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

oppia.factory('StoryCreationService', [
  '$http', '$window', '$uibModal', '$rootScope', '$timeout', 'AlertsService',
  'UrlInterpolationService', 'TopicUpdateService', 'TopicEditorStateService',
  function(
      $http, $window, $uibModal, $rootScope, $timeout, AlertsService,
      UrlInterpolationService, TopicUpdateService, TopicEditorStateService) {
    var STORY_EDITOR_URL_TEMPLATE = '/story_editor/<topic_id>/<story_id>';
    var STORY_CREATOR_URL_TEMPLATE = '/topic_editor_story_handler/<topic_id>';
    var storyCreationInProgress = false;

    return {
      createNewCanonicalStory: function() {
        if (storyCreationInProgress) {
          return;
        }
        var modalInstance = $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topic_editor/main_editor/' +
            'new_story_title_editor_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.storyTitle = '';
              $scope.isStoryTitleEmpty = function(storyTitle) {
                return (storyTitle === '');
              };
              $scope.save = function(storyTitle) {
                $uibModalInstance.close(storyTitle);
              };
              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        });

        modalInstance.result.then(function(storyTitle) {
          if (storyTitle === '') {
            throw Error('Story title cannot be empty');
          }
          storyCreationInProgress = true;
          AlertsService.clearWarnings();
          var topic = TopicEditorStateService.getTopic();
          $rootScope.loadingMessage = 'Creating story';
          var createStoryUrl = UrlInterpolationService.interpolateUrl(
            STORY_CREATOR_URL_TEMPLATE, {
              topic_id: topic.getId()
            }
          );
          $http.post(createStoryUrl, {title: storyTitle})
            .then(function(response) {
              $timeout(function() {
                TopicUpdateService.addCanonicalStoryId(
                  topic, response.data.storyId);
                TopicEditorStateService.saveTopic(
                  'Added canonical story with id ' + response.data.storyId,
                  function() {
                    $window.location = UrlInterpolationService.interpolateUrl(
                      STORY_EDITOR_URL_TEMPLATE, {
                        topic_id: topic.getId(),
                        story_id: response.data.storyId
                      }
                    );
                  });
              }, 150);
            }, function() {
              $rootScope.loadingMessage = '';
            });
        });
      }
    };
  }
]);
