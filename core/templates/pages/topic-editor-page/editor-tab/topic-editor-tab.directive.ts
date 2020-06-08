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
 * @fileoverview Controller for the main topic editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');

require('components/entity-creation-services/story-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require(
  'pages/topic-editor-page/editor-tab/topic-editor-stories-list.directive.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const topicConstants = require('constants.ts');

angular.module('oppia').directive('topicEditorTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/editor-tab/topic-editor-tab.directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService',
        'ContextService', 'CsrfTokenService', 'ImageUploadHelperService',
        'TopicEditorStateService', 'TopicUpdateService', 'UndoRedoService',
        'UrlInterpolationService', 'StoryCreationService',
        'EVENT_STORY_SUMMARIES_INITIALIZED', 'EVENT_TOPIC_INITIALIZED',
        'EVENT_TOPIC_REINITIALIZED', 'MAX_CHARS_IN_TOPIC_DESCRIPTION',
        'MAX_CHARS_IN_TOPIC_NAME',
        function(
            $scope, $uibModal, AlertsService,
            ContextService, CsrfTokenService, ImageUploadHelperService,
            TopicEditorStateService, TopicUpdateService, UndoRedoService,
            UrlInterpolationService, StoryCreationService,
            EVENT_STORY_SUMMARIES_INITIALIZED, EVENT_TOPIC_INITIALIZED,
            EVENT_TOPIC_REINITIALIZED, MAX_CHARS_IN_TOPIC_DESCRIPTION,
            MAX_CHARS_IN_TOPIC_NAME) {
          var ctrl = this;
          $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
          $scope.MAX_CHARS_IN_TOPIC_DESCRIPTION = (
            MAX_CHARS_IN_TOPIC_DESCRIPTION);
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.topicNameEditorIsShown = false;
            $scope.editableName = $scope.topic.getName();
            $scope.editableAbbreviatedName = $scope.topic.getAbbreviatedName();
            $scope.editableDescription = $scope.topic.getDescription();
            $scope.allowedBgColors = (
              topicConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic);

            $scope.editableDescriptionIsEmpty = (
              $scope.editableDescription === '');
            $scope.topicDescriptionChanged = false;
          };

          var _initStorySummaries = function() {
            $scope.canonicalStorySummaries =
              TopicEditorStateService.getCanonicalStorySummaries();
          };

          $scope.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          $scope.createCanonicalStory = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/topic-editor-page/modal-templates/' +
                  'topic-save-pending-changes-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {}, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              StoryCreationService.createNewCanonicalStory(
                $scope.topic.getId());
            }
          };

          $scope.updateTopicDescriptionStatus = function(description) {
            $scope.editableDescriptionIsEmpty = (description === '');
            $scope.topicDescriptionChanged = true;
          };

          $scope.updateTopicName = function(newName) {
            if (newName === $scope.topic.getName()) {
              return;
            }
            TopicUpdateService.setTopicName($scope.topic, newName);
            $scope.topicNameEditorIsShown = false;
          };

          $scope.updateAbbreviatedName = function(newAbbreviatedName) {
            if (newAbbreviatedName === $scope.topic.getAbbreviatedName()) {
              return;
            }
            TopicUpdateService.setAbbreviatedTopicName(
              $scope.topic, newAbbreviatedName);
          };

          $scope.updateTopicThumbnailFilename = function(newThumbnailFilename) {
            if (newThumbnailFilename === $scope.topic.getThumbnailFilename()) {
              return;
            }
            TopicUpdateService.setTopicThumbnailFilename(
              $scope.topic, newThumbnailFilename);
          };

          $scope.updateTopicThumbnailBgColor = function(newThumbnailBgColor) {
            if (newThumbnailBgColor === $scope.topic.getThumbnailBgColor()) {
              return;
            }
            TopicUpdateService.setTopicThumbnailBgColor(
              $scope.topic, newThumbnailBgColor);
          };

          $scope.updateTopicDescription = function(newDescription) {
            if (newDescription !== $scope.topic.getDescription()) {
              TopicUpdateService.setTopicDescription(
                $scope.topic, newDescription);
            }
          };

          ctrl.$onInit = function() {
            $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
            $scope.$on(EVENT_STORY_SUMMARIES_INITIALIZED, _initStorySummaries);

            _initEditor();
            _initStorySummaries();
          };
        }
      ]
    };
  }]);
