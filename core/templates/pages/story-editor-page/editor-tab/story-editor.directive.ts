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
 * @fileoverview Controller for the main story editor.
 */

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('pages/story-editor-page/editor-tab/story-node-editor.directive.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/story-update.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/alerts.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

angular.module('oppia').directive('storyEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/editor-tab/story-editor.directive.html'),
      controller: [
        '$scope', 'StoryEditorStateService', 'StoryUpdateService',
        'UndoRedoService', 'EVENT_VIEW_STORY_NODE_EDITOR', '$uibModal',
        'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED', 'AlertsService',
        function(
            $scope, StoryEditorStateService, StoryUpdateService,
            UndoRedoService, EVENT_VIEW_STORY_NODE_EDITOR, $uibModal,
            EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, AlertsService) {
          var ctrl = this;
          var _init = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.storyContents = $scope.story.getStoryContents();
            if ($scope.storyContents) {
              $scope.setNodeToEdit($scope.storyContents.getInitialNodeId());
            }
            _initEditor();
          };

          var _initEditor = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.storyContents = $scope.story.getStoryContents();
            $scope.disconnectedNodes = [];
            $scope.linearNodesList = [];
            $scope.nodes = [];
            if ($scope.storyContents &&
                $scope.storyContents.getNodes().length > 0) {
              $scope.nodes = $scope.storyContents.getNodes();
              $scope.initialNodeId = $scope.storyContents.getInitialNodeId();
              $scope.linearNodesList =
                $scope.storyContents.getLinearNodesList();
              $scope.disconnectedNodes =
                $scope.storyContents.getDisconnectedNodes();
            }
            $scope.notesEditorIsShown = false;
            $scope.storyTitleEditorIsShown = false;
            $scope.editableTitle = $scope.story.getTitle();
            $scope.editableNotes = $scope.story.getNotes();
            $scope.editableDescription = $scope.story.getDescription();
            $scope.editableDescriptionIsEmpty = (
              $scope.editableDescription === '');
            $scope.storyDescriptionChanged = false;
          };

          $scope.setNodeToEdit = function(nodeId) {
            $scope.idOfNodeToEdit = nodeId;
          };

          $scope.openNotesEditor = function() {
            $scope.notesEditorIsShown = true;
          };

          $scope.closeNotesEditor = function() {
            $scope.notesEditorIsShown = false;
          };

          $scope.isInitialNode = function(nodeId) {
            return (
              $scope.story.getStoryContents().getInitialNodeId() === nodeId);
          };

          $scope.markAsInitialNode = function(nodeId) {
            if ($scope.isInitialNode(nodeId)) {
              return;
            }
            StoryUpdateService.setInitialNodeId($scope.story, nodeId);
            var nodes = this.storyContents.getNodes();
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
                StoryUpdateService.removeDestinationNodeIdFromNode(
                  $scope.story, nodes[i].getId(), nodeId);
              }
            }
            _initEditor();
            $scope.$broadcast('recalculateAvailableNodes');
          };

          $scope.deleteNode = function(nodeId) {
            if ($scope.isInitialNode(nodeId)) {
              AlertsService.addInfoMessage(
                'Cannot delete the first chapter of a story.', 3000);
              return;
            }
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'delete-chapter-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.confirmDeletion = function() {
                    $uibModalInstance.close();
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              StoryUpdateService.deleteStoryNode($scope.story, nodeId);
              _initEditor();
              $scope.$broadcast('recalculateAvailableNodes');
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.createNode = function() {
            var nodeTitles = $scope.linearNodesList.map(function(node) {
              return node.getTitle();
            });
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'new-chapter-title-modal.template.html'),
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
              StoryUpdateService.addStoryNode($scope.story, title);
              _initEditor();
              // If the first node is added, open it just after creation.
              if ($scope.story.getStoryContents().getNodes().length === 1) {
                $scope.setNodeToEdit(
                  $scope.story.getStoryContents().getInitialNodeId());
              }
              $scope.$broadcast('recalculateAvailableNodes');
            });
          };

          $scope.updateNotes = function(newNotes) {
            if (newNotes === $scope.story.getNotes()) {
              return;
            }
            StoryUpdateService.setStoryNotes($scope.story, newNotes);
            _initEditor();
          };

          $scope.updateStoryDescriptionStatus = function(description) {
            $scope.editableDescriptionIsEmpty = (description === '');
            $scope.storyDescriptionChanged = true;
          };

          $scope.updateStoryTitle = function(newTitle) {
            if (newTitle === $scope.story.getTitle()) {
              return;
            }
            StoryUpdateService.setStoryTitle($scope.story, newTitle);
          };

          $scope.updateStoryDescription = function(newDescription) {
            if (newDescription !== $scope.story.getDescription()) {
              StoryUpdateService.setStoryDescription(
                $scope.story, newDescription);
            }
          };

          ctrl.$onInit = function() {
            $scope.NOTES_SCHEMA = {
              type: 'html',
              ui_config: {
                startupFocusEnabled: false
              }
            };
            $scope.$on(EVENT_VIEW_STORY_NODE_EDITOR, function(evt, nodeId) {
              $scope.setNodeToEdit(nodeId);
            });

            $scope.$on('storyGraphUpdated', function(evt, storyContents) {
              _initEditor();
            });

            $scope.$on(EVENT_STORY_INITIALIZED, _init);
            $scope.$on(EVENT_STORY_REINITIALIZED, _initEditor);

            _init();
            _initEditor();
          };
        }
      ]
    };
  }]);
