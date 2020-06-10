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
 * @fileoverview Controller for subtopic editor modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('pages/topic-editor-page/services/topic-editor-state.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const subtopicConstants = require('constants.ts');

angular.module('oppia').controller('SubtopicEditorModalController', [
  '$controller', '$scope', '$uibModalInstance', 'TopicEditorStateService',
  'editableThumbnailBgColor', 'editableThumbnailFilename',
  'editableTitle', 'subtopic', 'subtopicTitles',
  'EVENT_SUBTOPIC_PAGE_LOADED', 'MAX_CHARS_IN_SUBTOPIC_TITLE',
  function(
      $controller, $scope, $uibModalInstance, TopicEditorStateService,
      editableThumbnailBgColor, editableThumbnailFilename,
      editableTitle, subtopic, subtopicTitles,
      EVENT_SUBTOPIC_PAGE_LOADED, MAX_CHARS_IN_SUBTOPIC_TITLE) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.MAX_CHARS_IN_SUBTOPIC_TITLE = MAX_CHARS_IN_SUBTOPIC_TITLE;
    $scope.subtopicId = subtopic.getId();
    $scope.subtopicTitles = subtopicTitles;
    $scope.editableTitle = editableTitle;
    $scope.editableThumbnailFilename = editableThumbnailFilename;
    $scope.editableThumbnailBgColor = editableThumbnailBgColor;
    $scope.subtopicPage = (
      TopicEditorStateService.getSubtopicPage());
    $scope.allowedBgColors = (
      subtopicConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic);
    var pageContents = $scope.subtopicPage.getPageContents();
    if (pageContents) {
      $scope.htmlData = pageContents.getHtml();
    }
    $scope.errorMsg = null;
    $scope.$on(EVENT_SUBTOPIC_PAGE_LOADED, function() {
      $scope.subtopicPage =
        TopicEditorStateService.getSubtopicPage();
      var pageContents = $scope.subtopicPage.getPageContents();
      $scope.htmlData = pageContents.getHtml();
    });
    $scope.SUBTOPIC_PAGE_SCHEMA = {
      type: 'html',
      ui_config: {
        rows: 100
      }
    };

    $scope.updateSubtopicThumbnailFilename = function(
        newThumbnailFilename) {
      var oldThumbnailFilename = subtopic.getThumbnailFilename();
      if (newThumbnailFilename === oldThumbnailFilename) {
        return;
      }
      $scope.editableThumbnailFilename = newThumbnailFilename;
    };

    $scope.updateSubtopicThumbnailBgColor = function(
        newThumbnailBgColor) {
      var oldThumbnailBgColor = subtopic.getThumbnailBgColor();
      if (newThumbnailBgColor === oldThumbnailBgColor) {
        return;
      }
      $scope.editableThumbnailBgColor = newThumbnailBgColor;
    };

    $scope.updateSubtopicTitle = function(title) {
      if (title === subtopic.getTitle()) {
        return;
      }
      if ($scope.subtopicTitles.indexOf(title) !== -1) {
        $scope.errorMsg = 'A subtopic with this title already exists';
        return;
      }
      $scope.editableTitle = title;
    };

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = null;
    };

    $scope.updateHtmlData = function(htmlData) {
      $scope.subtopicPage.getPageContents().setHtml(htmlData);
      $scope.openPreviewSubtopicPage(htmlData);
    };

    $scope.save = function() {
      $uibModalInstance.close({
        newTitle: $scope.editableTitle,
        newHtmlData: $scope.htmlData,
        newThumbnailFilename: $scope.editableThumbnailFilename,
        newThumbnailBgColor: $scope.editableThumbnailBgColor
      });
    };
  }
]);
