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
        getExplorationId: '&explorationId',
        isOutlineFinalized: '&outlineFinalized',
        getDestinationNodeIds: '&destinationNodeIds'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story_editor/main_editor/story_node_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'StoryEditorStateService',
        'StoryUpdateService', 'UndoRedoService', 'EVENT_STORY_INITIALIZED',
        'EVENT_STORY_REINITIALIZED', 'EVENT_VIEW_STORY_NODE_EDITOR',
        'AlertsService',
        function(
            $scope, $rootScope, $uibModal, StoryEditorStateService,
            StoryUpdateService, UndoRedoService, EVENT_STORY_INITIALIZED,
            EVENT_STORY_REINITIALIZED, EVENT_VIEW_STORY_NODE_EDITOR,
            AlertsService) {
          var _recalculateAvailableNodes = function() {
            $scope.newNodeId = null;
            $scope.availableNodes = [];
            for (i = 0; i < $scope.storyNodeIds.length; i++) {
              if ($scope.storyNodeIds[i] === $scope.getId()) {
                continue;
              }
              if (
                $scope.getDestinationNodeIds().indexOf(
                  $scope.storyNodeIds[i]) !== -1) {
                continue;
              }
              $scope.availableNodes.push({
                id: $scope.storyNodeIds[i],
                text: $scope.nodeIdToTitleMap[$scope.storyNodeIds[i]]
              });
            }
          };
          var _init = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.storyNodeIds = $scope.story.getStoryContents().getNodeIds();
            $scope.nodeIdToTitleMap =
              $scope.story.getStoryContents().getNodeIdsToTitleMap(
                $scope.storyNodeIds);
            _recalculateAvailableNodes();
            $scope.currentTitle = $scope.nodeIdToTitleMap[$scope.getId()];
            $scope.editableTitle = $scope.currentTitle;
            $scope.oldOutline = $scope.getOutline();
            $scope.editableOutline = $scope.getOutline();
            $scope.explorationId = $scope.getExplorationId();
            $scope.nodeTitleEditorIsShown = false;
            $scope.OUTLINE_SCHEMA = {
              type: 'html',
              ui_config: {
                rows: 100
              }
            };
          };

          $scope.updateTitle = function(newTitle) {
            if (newTitle === $scope.currentTitle) {
              return;
            }
            StoryUpdateService.setStoryNodeTitle(
              $scope.story, $scope.getId(), newTitle);
            $scope.currentTitle = newTitle;
          };

          $scope.viewNodeEditor = function(nodeId) {
            $rootScope.$broadcast(EVENT_VIEW_STORY_NODE_EDITOR, nodeId);
          };

          $scope.finalizeOutline = function() {
            StoryUpdateService.finalizeStoryNodeOutline(
              $scope.story, $scope.getId());
          };

          $scope.updateExplorationId = function(explorationId) {
            StoryUpdateService.setStoryNodeExplorationId(
              $scope.story, $scope.getId(), explorationId);
          };

          $scope.unfinalizeOutline = function() {
            StoryUpdateService.unfinalizeStoryNodeOutline(
              $scope.story, $scope.getId());
          };

          $scope.addNewDestinationNode = function() {
            var nodeTitles =
              $scope.story.getStoryContents().getNodes().map(function(node) {
                return node.getTitle();
              });
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story_editor/main_editor/' +
                'new_chapter_title_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.nodeTitle = '';
                  $scope.nodeTitles = nodeTitles;
                  $scope.errorMsg = null;

                  $scope.resetErrorMsg = function() {
                    $scope.errorMsg = null;
                  };
                  $scope.isNodeTitleEmpty = function(nodeTitle) {
                    return (nodeTitle === '');
                  };
                  $scope.save = function(title) {
                    if ($scope.nodeTitles.indexOf(title) !== -1) {
                      $scope.errorMsg =
                        'A chapter with this title already exists';
                      return;
                    }
                    $uibModalInstance.close(title);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(title) {
              var nextNodeId =
                $scope.story.getStoryContents().getNextNodeId();
              StoryUpdateService.addStoryNode($scope.story, title);
              StoryUpdateService.addDestinationNodeIdToNode(
                $scope.story, $scope.getId(), nextNodeId);
              _init();
              _recalculateAvailableNodes();
            });
          };

          $scope.addDestinationNode = function(nodeId) {
            if (!nodeId) {
              return;
            }
            if (nodeId === $scope.getId()) {
              AlertsService.addInfoMessage(
                'A chapter cannot lead to itself.', 3000);
              return;
            }
            try {
              StoryUpdateService.addDestinationNodeIdToNode(
                $scope.story, $scope.getId(), nodeId);
            } catch (error) {
              AlertsService.addInfoMessage(
                'The given chapter is already a destination for current ' +
                'chapter', 3000);
              return;
            }
            $rootScope.$broadcast(
              'storyGraphUpdated', $scope.story.getStoryContents());
            _recalculateAvailableNodes();
          };

          $scope.removeDestinationNodeId = function(nodeId) {
            StoryUpdateService.removeDestinationNodeIdFromNode(
              $scope.story, $scope.getId(), nodeId);
            $rootScope.$broadcast(
              'storyGraphUpdated', $scope.story.getStoryContents());
            _recalculateAvailableNodes();
          };

          $scope.openNodeTitleEditor = function() {
            $scope.nodeTitleEditorIsShown = true;
          };

          $scope.closeNodeTitleEditor = function() {
            $scope.nodeTitleEditorIsShown = false;
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
            $scope.oldOutline = newOutline;
          };

          $scope.$on(EVENT_STORY_INITIALIZED, _init);
          $scope.$on(EVENT_STORY_REINITIALIZED, _init);

          _init();
        }
      ]
    };
  }]);
