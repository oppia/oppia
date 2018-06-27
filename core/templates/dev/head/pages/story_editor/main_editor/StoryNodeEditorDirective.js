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
oppia.directive('storyNodeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getId: '&nodeId',
        getOutline: '&outline',
        getDestinationNodeIds: '&destinationNodeIds'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story_editor/main_editor/story_node_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'StoryEditorStateService',
        'StoryUpdateService', 'UndoRedoService', 'EVENT_STORY_INITIALIZED',
        'EVENT_STORY_REINITIALIZED', 'EVENT_VIEW_NODE_EDITOR',
        function(
            $scope, $rootScope, $uibModal, StoryEditorStateService,
            StoryUpdateService, UndoRedoService, EVENT_STORY_INITIALIZED,
            EVENT_STORY_REINITIALIZED, EVENT_VIEW_NODE_EDITOR) {
          var _init = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.oldOutline = $scope.getOutline();
            $scope.editableOutline = $scope.getOutline();
            $scope.outlineEditorIsShown = false;
            $scope.nodeIdEditorIsShown = false;
            $scope.OUTLINE_SCHEMA = {
              type: 'html',
              ui_config: {
                rows: 100
              }
            };
          };

          $scope.viewNodeEditor = function(nodeId) {
            $rootScope.$broadcast(EVENT_VIEW_NODE_EDITOR, nodeId);
          };

          $scope.addNewDestinationNode = function() {
            var nextNodeId = $scope.story.getStoryContents().getNextNodeId();
            StoryUpdateService.addStoryNode($scope.story);
            StoryUpdateService.addDestinationNodeIdToNode(
              $scope.story, $scope.getId(), nextNodeId);
          };

          $scope.addExistingDestinationNode = function(nodeId) {
            StoryUpdateService.addDestinationNodeIdToNode(
              $scope.story, $scope.getId(), nodeId);
            $scope.newDestinationNodeId = '';
            $scope.closeNodeIdEditor();
          };

          $scope.removeDestinationNodeId = function(nodeId) {
            StoryUpdateService.removeDestinationNodeIdFromNode(
              $scope.story, $scope.getId(), nodeId);
          };

          $scope.openNodeIdEditor = function() {
            $scope.nodeIdEditorIsShown = true;
          };

          $scope.closeNodeIdEditor = function() {
            $scope.nodeIdEditorIsShown = false;
          };

          $scope.openPreviewOutline = function(outline) {
            $scope.outlineEditorIsShown = false;
            $scope.editableOutline = outline;
          };

          $scope.closePreviewOutline = function(outline) {
            $scope.outlineEditorIsShown = true;
            $scope.editableOutline = outline;
          };

          $scope.isOutlineModified = function(outline) {
            return ($scope.oldOutline !== outline);
          };

          $scope.updateOutline = function(newOutline) {
            if (!$scope.isOutlineModified(newOutline)) {
              return;
            }
            StoryUpdateService.setStoryNodeOutline(
              $scope.story, $scope.getId(), newOutline);
            $scope.openPreviewOutline(newOutline);
          };

          $scope.$on(EVENT_STORY_INITIALIZED, _init);
          $scope.$on(EVENT_STORY_REINITIALIZED, _init);

          _init();
        }
      ]
    };
  }]);
