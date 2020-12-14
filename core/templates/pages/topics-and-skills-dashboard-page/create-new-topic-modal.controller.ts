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
 * @fileoverview Controller for new topic name editor modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');

import { NewlyCreatedTopic } from
  'domain/topics_and_skills_dashboard/newly-created-topic.model';

import topicPropertiesConstants from 'assets/constants';

angular.module('oppia').controller('CreateNewTopicModalController', [
  '$controller', '$rootScope', '$scope', '$uibModalInstance',
  'ContextService', 'ImageLocalStorageService', 'TopicEditorStateService',
  'WindowRef', 'MAX_CHARS_IN_TOPIC_DESCRIPTION', 'MAX_CHARS_IN_TOPIC_NAME',
  'MAX_CHARS_IN_TOPIC_URL_FRAGMENT',
  function(
      $controller, $rootScope, $scope, $uibModalInstance,
      ContextService, ImageLocalStorageService, TopicEditorStateService,
      WindowRef, MAX_CHARS_IN_TOPIC_DESCRIPTION, MAX_CHARS_IN_TOPIC_NAME,
      MAX_CHARS_IN_TOPIC_URL_FRAGMENT) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.allowedBgColors = (
      topicPropertiesConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic);
    $scope.validUrlFragmentRegex = new RegExp(
      topicPropertiesConstants.VALID_URL_FRAGMENT_REGEX);

    $scope.isValid = function() {
      return Boolean(
        $scope.newlyCreatedTopic.isValid() &&
        ImageLocalStorageService.getStoredImagesData().length > 0);
    };

    ContextService.setImageSaveDestinationToLocalStorage();
    $scope.newlyCreatedTopic = (
      NewlyCreatedTopic.createDefault());
    $scope.hostname = WindowRef.nativeWindow.location.hostname;
    $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
    $scope.MAX_CHARS_IN_TOPIC_DESCRIPTION = (
      MAX_CHARS_IN_TOPIC_DESCRIPTION);
    $scope.MAX_CHARS_IN_TOPIC_URL_FRAGMENT = MAX_CHARS_IN_TOPIC_URL_FRAGMENT;

    $scope.topicUrlFragmentExists = false;
    $scope.topicNameExists = false;
    $scope.onTopicUrlFragmentChange = function() {
      if (!$scope.newlyCreatedTopic.urlFragment) {
        return;
      }
      TopicEditorStateService.updateExistenceOfTopicUrlFragment(
        $scope.newlyCreatedTopic.urlFragment, function() {
          $scope.topicUrlFragmentExists = (
            TopicEditorStateService.getTopicWithUrlFragmentExists());
          $rootScope.$applyAsync();
        });
    };

    $scope.onTopicNameChange = function() {
      if (!$scope.newlyCreatedTopic.name) {
        return;
      }
      TopicEditorStateService.updateExistenceOfTopicName(
        $scope.newlyCreatedTopic.name, function() {
          $scope.topicNameExists = (
            TopicEditorStateService.getTopicWithNameExists());
          $rootScope.$applyAsync();
        });
    };

    $scope.save = function() {
      $uibModalInstance.close($scope.newlyCreatedTopic);
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
