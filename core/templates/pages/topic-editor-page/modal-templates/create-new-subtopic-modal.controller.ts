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
 * @fileoverview Controller for create new subtopic modal controller.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/topic/topic-update.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/services/subtopic-validation-service.ts');

import createSubtopicConstants from 'assets/constants';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';

angular.module('oppia').controller('CreateNewSubtopicModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'SubtopicValidationService',
  'TopicEditorStateService', 'TopicUpdateService', 'WindowRef',
  'topic', 'MAX_CHARS_IN_SUBTOPIC_TITLE',
  'MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT',
  function(
      $controller, $scope, $uibModalInstance,
      SubtopicValidationService,
      TopicEditorStateService, TopicUpdateService, WindowRef,
      topic, MAX_CHARS_IN_SUBTOPIC_TITLE,
      MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    var ctrl = this;

    ctrl.$onInit = function() {
      ctrl.hostname = WindowRef.nativeWindow.location.hostname;
      ctrl.classroomUrlFragment = (
        TopicEditorStateService.getClassroomUrlFragment());
      ctrl.topic = topic;
      ctrl.SUBTOPIC_PAGE_SCHEMA = {
        type: 'html',
        ui_config: {
          rows: 100
        }
      };
      ctrl.htmlData = '';
      ctrl.schemaEditorIsShown = false;
      ctrl.editableThumbnailFilename = '';
      ctrl.editableThumbnailBgColor = '';
      ctrl.editableUrlFragment = '';
      ctrl.allowedBgColors = (
        createSubtopicConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic);
      ctrl.subtopicId = ctrl.topic.getNextSubtopicId();
      ctrl.MAX_CHARS_IN_SUBTOPIC_TITLE = MAX_CHARS_IN_SUBTOPIC_TITLE;
      ctrl.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT = (
        MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT);
      ctrl.subtopicTitle = '';
      ctrl.errorMsg = null;
      ctrl.subtopicUrlFragmentExists = false;
      TopicUpdateService.addSubtopic(ctrl.topic, ctrl.subtopicTitle);
    };

    ctrl.showSchemaEditor = function() {
      ctrl.schemaEditorIsShown = true;
    };

    ctrl.updateSubtopicThumbnailFilename = function(
        newThumbnailFilename) {
      ctrl.editableThumbnailFilename = newThumbnailFilename;
      TopicUpdateService.setSubtopicThumbnailFilename(
        ctrl.topic, ctrl.subtopicId, newThumbnailFilename);
    };

    ctrl.updateSubtopicThumbnailBgColor = function(
        newThumbnailBgColor) {
      ctrl.editableThumbnailBgColor = newThumbnailBgColor;
      TopicUpdateService.setSubtopicThumbnailBgColor(
        ctrl.topic, ctrl.subtopicId, newThumbnailBgColor);
    };

    ctrl.resetErrorMsg = function() {
      ctrl.errorMsg = null;
    };
    ctrl.isSubtopicValid = function() {
      return Boolean(
        ctrl.editableThumbnailFilename &&
        ctrl.subtopicTitle &&
        ctrl.htmlData &&
        ctrl.editableUrlFragment &&
        ctrl.isUrlFragmentValid());
    };

    ctrl.cancel = function() {
      TopicEditorStateService.deleteSubtopicPage(
        ctrl.topic.getId(), ctrl.subtopicId);
      TopicUpdateService.deleteSubtopic(ctrl.topic, ctrl.subtopicId);
      TopicEditorStateService.onTopicReinitialized.emit();
      $uibModalInstance.dismiss('cancel');
    };

    ctrl.isUrlFragmentValid = function() {
      return SubtopicValidationService.isUrlFragmentValid(
        ctrl.editableUrlFragment);
    };

    ctrl.checkSubtopicExistence = function() {
      ctrl.subtopicUrlFragmentExists = (
        SubtopicValidationService.doesSubtopicWithUrlFragmentExist(
          ctrl.editableUrlFragment));
    };

    ctrl.save = function() {
      if (!SubtopicValidationService.checkValidSubtopicName(
        ctrl.subtopicTitle)) {
        ctrl.errorMsg = 'A subtopic with this title already exists';
        return;
      }

      TopicUpdateService.setSubtopicTitle(
        ctrl.topic, ctrl.subtopicId, ctrl.subtopicTitle);
      TopicUpdateService.setSubtopicUrlFragment(
        ctrl.topic, ctrl.subtopicId, ctrl.editableUrlFragment);

      ctrl.subtopicPage = SubtopicPage.createDefault(
        ctrl.topic.getId(), ctrl.subtopicId);

      var subtitledHtml = angular.copy(
        ctrl.subtopicPage.getPageContents().getSubtitledHtml());
      subtitledHtml.html = ctrl.htmlData;
      TopicUpdateService.setSubtopicPageContentsHtml(
        ctrl.subtopicPage, ctrl.subtopicId, subtitledHtml);
      ctrl.subtopicPage.getPageContents().setHtml(ctrl.htmlData);
      TopicEditorStateService.setSubtopicPage(ctrl.subtopicPage);
      TopicUpdateService.setSubtopicTitle(
        ctrl.topic, ctrl.subtopicId, ctrl.subtopicTitle);
      $uibModalInstance.close(ctrl.subtopicId);
    };
  }
]);
