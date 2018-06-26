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
 * @fileoverview Controller for the story node editor.
 */
oppia.directive('storyNode', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getStoryNode: '&storyNode',
        isInitialNode: '&initialNode'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story_editor/main_editor/story_node_directive.html'),
      controller: [
        '$scope', '$uibModal', 'StoryEditorStateService', 'StoryUpdateService',
        'UndoRedoService', 'EVENT_STORY_INITIALIZED',
        'EVENT_STORY_REINITIALIZED',
        function(
            $scope, $uibModal, StoryEditorStateService, StoryUpdateService,
            UndoRedoService, EVENT_STORY_INITIALIZED,
            EVENT_STORY_REINITIALIZED) {
          var _init = function() {
            $scope.story = StoryEditorStateService.getStory();
          };

          $scope.markAsInitialNode = function() {
            if ($scope.isInitialNode()) {
              return;
            }
            StoryUpdateService.setInitialNodeId(
              $scope.story, $scope.getStoryNode().getId());
          };

          $scope.openNodeEditor = function() {
            var storyNodes = $scope.story.getStoryContents().getNodes();
            var elligibleDestinationNodes = [];
            var currentNodeId = $scope.getStoryNode().getId();
            for (var i = 0; i < storyNodes.length; i++) {
              if (storyNodes[i].getId() === currentNodeId) {
                continue;
              }
              if (storyNodes[i].getDestinationNodeIds().indexOf(
                currentNodeId) === -1) {
                elligibleDestinationNodes.push(storyNodes[i]);
              }
            }
            var editableOutline = $scope.getStoryNode().getOutline();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story_editor/main_editor/' +
                'story_node_editor_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.outline = editableOutline;
                  $scope.outlineEditorIsShown = false;
                  $scope.OUTLINE_SCHEMA = {
                    type: 'html',
                    ui_config: {
                      rows: 100
                    }
                  };

                  $scope.openPreviewOutline = function(outline) {
                    $scope.outlineEditorIsShown = false;
                    $scope.outline = outline;
                  };

                  $scope.closePreviewOutline = function(previewOutline) {
                    $scope.outlineEditorIsShown = true;
                    $scope.outline = previewOutline;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close($scope.outline);
                  };
                }
              ]
            });

            modalInstance.result.then(function(newOutline) {
              if (newOutline !== $scope.getStoryNode().getOutline()) {
                StoryUpdateService.setStoryNodeOutline(
                  $scope.story, currentNodeId, newOutline);
              }
            });
          };

          $scope.deleteNode = function() {
            StoryUpdateService.deleteStoryNode(
              $scope.story, $scope.getStoryNode().getId());
          };

          $scope.$on(EVENT_STORY_INITIALIZED, _init);
          $scope.$on(EVENT_STORY_REINITIALIZED, _init);

          _init();
        }
      ]
    };
  }]);
