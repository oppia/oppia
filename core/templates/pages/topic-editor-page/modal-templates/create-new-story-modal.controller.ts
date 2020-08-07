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
 * @fileoverview Controller for create new story modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/topic/NewlyCreatedStoryObjectFactory.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');

const newStoryConstants = require('constants.ts');

angular.module('oppia').controller('CreateNewStoryModalController', [
  '$controller', '$rootScope', '$scope', '$uibModalInstance',
  'ImageLocalStorageService', 'NewlyCreatedStoryObjectFactory',
  'StoryEditorStateService', 'MAX_CHARS_IN_STORY_TITLE',
  'MAX_CHARS_IN_STORY_URL_FRAGMENT',
  function($controller, $rootScope, $scope, $uibModalInstance,
      ImageLocalStorageService, NewlyCreatedStoryObjectFactory,
      StoryEditorStateService, MAX_CHARS_IN_STORY_TITLE,
      MAX_CHARS_IN_STORY_URL_FRAGMENT) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.story = NewlyCreatedStoryObjectFactory.createDefault();
    $scope.MAX_CHARS_IN_STORY_TITLE = MAX_CHARS_IN_STORY_TITLE;
    $scope.MAX_CHARS_IN_STORY_URL_FRAGMENT = MAX_CHARS_IN_STORY_URL_FRAGMENT;
    $scope.allowedBgColors = (
      newStoryConstants.ALLOWED_THUMBNAIL_BG_COLORS.story);
    $scope.storyUrlFragmentExists = false;
    $scope.onStoryUrlFragmentChange = function() {
      StoryEditorStateService.changeStoryWithUrlFragmentExists(
        $scope.story.urlFragment, function() {
          $scope.storyUrlFragmentExists = (
            StoryEditorStateService.getStoryWithUrlFragmentExists());
          $rootScope.$applyAsync();
        });
    };

    $scope.isValid = function() {
      return Boolean($scope.story.isValid() &&
          ImageLocalStorageService.getStoredImagesData().length > 0 &&
          !$scope.storyUrlFragmentExists);
    };
  }
]);
