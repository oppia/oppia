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
require(
  'pages/exploration-editor-page/services/' +
  'curated-exploration-validation.service.ts');

import newChapterConstants from 'assets/constants';

angular.module('oppia').controller('CreateNewChapterModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'CuratedExplorationValidationService',
  'ExplorationIdValidationService', 'StoryEditorStateService',
  'StoryUpdateService', 'ValidatorsService', 'nodeTitles',
  'MAX_CHARS_IN_EXPLORATION_TITLE',
  function(
      $controller, $scope, $uibModalInstance,
      CuratedExplorationValidationService,
      ExplorationIdValidationService, StoryEditorStateService,
      StoryUpdateService, ValidatorsService, nodeTitles,
      MAX_CHARS_IN_EXPLORATION_TITLE) {
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
      $scope.correctnessFeedbackDisabledString = 'The correctness feedback ' +
        'of this exploration is disabled. Explorations need to have their ' +
        'correctness feedback enabled before they can be added to a story.';
      $scope.MAX_CHARS_IN_EXPLORATION_TITLE = MAX_CHARS_IN_EXPLORATION_TITLE;
      $scope.story = StoryEditorStateService.getStory();
      $scope.nodeId = $scope.story.getStoryContents().getNextNodeId();
      $scope.editableThumbnailFilename = '';
      $scope.editableThumbnailBgColor = '';
      $scope.allowedBgColors = (
        newChapterConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter);
      StoryUpdateService.addStoryNode($scope.story, $scope.title);
      $scope.correctnessFeedbackDisabled = false;
      $scope.categoryIsDefault = true;
    };

    $scope.init();

    $scope.updateThumbnailFilename = function(
        newThumbnailFilename) {
      StoryUpdateService.setStoryNodeThumbnailFilename(
        $scope.story, $scope.nodeId, newThumbnailFilename);
      $scope.editableThumbnailFilename = newThumbnailFilename;
      $scope.$applyAsync();
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
          $scope.$applyAsync();
          return;
        }
      }
      StoryUpdateService.setStoryNodeExplorationId(
        $scope.story, $scope.nodeId, $scope.explorationId);
      $uibModalInstance.close();
    };

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = null;
      $scope.invalidExpId = false;
      $scope.correctnessFeedbackDisabled = false;
      $scope.categoryIsDefault = true;
      $scope.invalidExpErrorString = 'Please enter a valid exploration id.';
    };

    $scope.validateExplorationId = function() {
      return ValidatorsService.isValidExplorationId(
        $scope.explorationId, false);
    };

    $scope.isValid = function() {
      return Boolean(
        $scope.title &&
        ValidatorsService.isValidExplorationId($scope.explorationId, false) &&
        $scope.editableThumbnailFilename);
    };

    $scope.save = function() {
      if ($scope.nodeTitles.indexOf($scope.title) !== -1) {
        $scope.errorMsg = 'A chapter with this title already exists';
        return;
      }
      CuratedExplorationValidationService.canExplorationBeCurated(
        $scope.explorationId
      ).then((result) => {
        console.log(result);
        if (!result.canBeCurated) {
          $scope.invalidExpErrorString = result.errorMessage;
          $scope.invalidExpId = true;
          $scope.$applyAsync();
          return;
        }
      });
      ExplorationIdValidationService.isExpPublishedAsync($scope.explorationId)
        .then((expIsPublished) => {
          if (!expIsPublished) {
            $scope.invalidExpErrorString = 'This exploration does not exist ' +
              'or is not published yet.';
            $scope.invalidExpId = true;
            $scope.$applyAsync();
            return;
          }
          $scope.invalidExpId = false;
          ExplorationIdValidationService.isCorrectnessFeedbackEnabled(
            $scope.explorationId).then(
            (correctnessFeedbackIsEnabled) => {
              if (!correctnessFeedbackIsEnabled) {
                $scope.correctnessFeedbackDisabled = true;
                $scope.$applyAsync();
                return;
              }
              $scope.correctnessFeedbackDisabled = false;
              ExplorationIdValidationService.isDefaultCategoryAsync(
                $scope.explorationId).then(
                (categoryIsDefault) => {
                  if (!categoryIsDefault) {
                    $scope.categoryIsDefault = false;
                    $scope.$applyAsync();
                    return;
                  }
                  $scope.categoryIsDefault = true;
                  $scope.updateTitle();
                  $scope.updateExplorationId();
                  $scope.$applyAsync();
                });
            });
        });
    };
  }
]);
