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
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('pages/story-editor-page/editor-tab/story-node-editor.directive.ts');
require(
  'pages/story-editor-page/modal-templates/' +
  'new-chapter-title-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/story-update.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/alerts.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const storyConstants = require('constants.ts');

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
        'MAX_CHARS_IN_STORY_TITLE', 'MAX_CHARS_IN_CHAPTER_TITLE',
        function(
            $scope, StoryEditorStateService, StoryUpdateService,
            UndoRedoService, EVENT_VIEW_STORY_NODE_EDITOR, $uibModal,
            EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, AlertsService,
            MAX_CHARS_IN_STORY_TITLE, MAX_CHARS_IN_CHAPTER_TITLE) {
          var ctrl = this;
          $scope.MAX_CHARS_IN_STORY_TITLE = MAX_CHARS_IN_STORY_TITLE;
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
            $scope.allowedBgColors = (
              storyConstants.ALLOWED_THUMBNAIL_BG_COLORS.story);
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
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'delete-chapter-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
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
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'new-chapter-title-modal.template.html'),
              backdrop: true,
              resolve: {
                nodeTitles: () => nodeTitles
              },
              controller: 'NewChapterTitleModalController'
            }).result.then(function(title) {
              StoryUpdateService.addStoryNode($scope.story, title);
              _initEditor();
              // If the first node is added, open it just after creation.
              if ($scope.story.getStoryContents().getNodes().length === 1) {
                $scope.setNodeToEdit(
                  $scope.story.getStoryContents().getInitialNodeId());
              }
              $scope.$broadcast('recalculateAvailableNodes');
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
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

          $scope.updateStoryThumbnailFilename = function(
              newThumbnailFilename) {
            if (newThumbnailFilename === $scope.story.getThumbnailFilename()) {
              return;
            }
            StoryUpdateService.setThumbnailFilename(
              $scope.story, newThumbnailFilename);
          };

          $scope.updateStoryThumbnailBgColor = function(
              newThumbnailBgColor) {
            if (newThumbnailBgColor === $scope.story.getThumbnailBgColor()) {
              return;
            }
            StoryUpdateService.setThumbnailBgColor(
              $scope.story, newThumbnailBgColor);
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
