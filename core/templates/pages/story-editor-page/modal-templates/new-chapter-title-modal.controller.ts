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
 * @fileoverview Controller for new chapter title modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/story/story-update.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('domain/exploration/exploration-id-validation.service.ts');

import newChapterConstants from 'assets/constants';

angular.module('oppia').controller('CreateNewChapterModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'ExplorationIdValidationService', 'StoryEditorStateService',
  'StoryUpdateService', 'nodeTitles', 'MAX_CHARS_IN_CHAPTER_TITLE',
  function(
      $controller, $scope, $uibModalInstance,
      ExplorationIdValidationService, StoryEditorStateService,
      StoryUpdateService, nodeTitles, MAX_CHARS_IN_CHAPTER_TITLE) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.init = function() {
      $scope.title = '';
      $scope.explorationId = '';
      $scope.invalidExpId = '';
      $scope.nodeTitles = nodeTitles;
      $scope.errorMsg = null;
      $scope.invalidExpErrorString = 'Please enter a valid exploration id.';
      $scope.MAX_CHARS_IN_CHAPTER_TITLE = MAX_CHARS_IN_CHAPTER_TITLE;
      $scope.story = StoryEditorStateService.getStory();
      $scope.nodeId = $scope.story.getStoryContents().getNextNodeId();
      $scope.editableThumbnailFilename = '';
      $scope.editableThumbnailBgColor = '';
      $scope.allowedBgColors = (
        newChapterConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter);
      StoryUpdateService.addStoryNode($scope.story, $scope.title);
    };

    $scope.init();

    $scope.updateThumbnailFilename = function(
        newThumbnailFilename) {
      StoryUpdateService.setStoryNodeThumbnailFilename(
        $scope.story, $scope.nodeId, newThumbnailFilename);
      $scope.editableThumbnailFilename = newThumbnailFilename;
    };

    $scope.updateThumbnailBgColor = function(newThumbnailBgColor) {
      StoryUpdateService.setStoryNodeThumbnailBgColor(
        $scope.story, $scope.nodeId, newThumbnailBgColor);
      $scope.editableThumbnailBgColor = newThumbnailBgColor;
    };

    $scope.updateTitle = function() {
      StoryUpdateService.setStoryNodeTitle(
        $scope.story, $scope.nodeId, $scope.title);
    };

    $scope.cancel = function() {
      StoryUpdateService.deleteStoryNode($scope.story, $scope.nodeId);
      $uibModalInstance.dismiss();
    };

    $scope.updateExplorationId = function() {
      var nodes = $scope.story.getStoryContents().getNodes();
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].getExplorationId() === $scope.explorationId) {
          $scope.invalidExpErrorString = (
            'The given exploration already exists in the story.');
          $scope.invalidExpId = true;
          return;
        }
      }
      if (StoryEditorStateService.isStoryPublished()) {
        ExplorationIdValidationService.isExpPublishedAsync(
          $scope.explorationId).then(function(expIdIsValid) {
          $scope.expIdIsValid = expIdIsValid;
          if ($scope.expIdIsValid) {
            StoryUpdateService.setStoryNodeExplorationId(
              $scope.story, $scope.nodeId, $scope.explorationId);
            $uibModalInstance.close();
          } else {
            $scope.invalidExpId = true;
          }
        });
      } else {
        StoryUpdateService.setStoryNodeExplorationId(
          $scope.story, $scope.nodeId, $scope.explorationId);
        $uibModalInstance.close();
      }
    };

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = null;
      $scope.invalidExpId = false;
      $scope.invalidExpErrorString = 'Please enter a valid exploration id.';
    };

    $scope.isValid = function() {
      return Boolean(
        $scope.title && $scope.explorationId &&
          $scope.editableThumbnailFilename);
    };

    $scope.save = function() {
      if ($scope.nodeTitles.indexOf($scope.title) !== -1) {
        $scope.errorMsg = 'A chapter with this title already exists';
        return;
      }
      $scope.updateTitle();
      $scope.updateExplorationId();
    };
  }
]);
