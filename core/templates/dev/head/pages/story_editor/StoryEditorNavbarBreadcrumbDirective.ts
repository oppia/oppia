// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the navbar breadcrumb of the story editor.
 */
oppia.directive('storyEditorNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story_editor/story_editor_navbar_breadcrumb_directive.html'),
      controller: [
        '$scope', '$uibModal', '$window', 'UrlService',
        'UrlInterpolationService', 'UndoRedoService', 'StoryEditorStateService',
        'EVENT_STORY_INITIALIZED',
        function(
            $scope, $uibModal, $window, UrlService,
            UrlInterpolationService, UndoRedoService, StoryEditorStateService,
            EVENT_STORY_INITIALIZED
        ) {
          $scope.story = StoryEditorStateService.getStory();
          var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
          var topicId = UrlService.getTopicIdFromUrl();
          $scope.$on(EVENT_STORY_INITIALIZED, function() {
            $scope.topicName = StoryEditorStateService.getTopicName();
          });
          $scope.returnToTopicEditorPage = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              var modalInstance = $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/story_editor/' +
                  'save_pending_changes_modal_directive.html'),
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
      ]
    };
  }]);
