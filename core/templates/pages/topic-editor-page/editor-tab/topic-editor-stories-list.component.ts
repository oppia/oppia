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
 * @fileoverview Controller for the stories list viewer.
 */

import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { DeleteStoryModalComponent } from '../modal-templates/delete-story-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/contextual/url.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').component('topicEditorStoriesList', {
  bindings: {
    storySummaries: '=',
    getTopic: '&topic'
  },
  template: require(
    './topic-editor-stories-list.component.html'),
  controller: [
    '$scope', '$window',
    'NgbModal', 'TopicUpdateService',
    'UndoRedoService', 'UrlInterpolationService',
    function(
        $scope, $window,
        NgbModal, TopicUpdateService,
        UndoRedoService, UrlInterpolationService) {
      var ctrl = this;
      var STORY_EDITOR_URL_TEMPLATE = '/story_editor/<story_id>';
      $scope.openStoryEditor = function(storyId) {
        if (UndoRedoService.getChangeCount() > 0) {
          const modalRef = NgbModal.open(
            SavePendingChangesModalComponent, {
              backdrop: true
            });

          modalRef.componentInstance.body = (
            'Please save all pending changes ' +
            'before exiting the topic editor.');

          modalRef.result.then(function() {}, function() {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });
        } else {
          $window.open(
            UrlInterpolationService.interpolateUrl(
              STORY_EDITOR_URL_TEMPLATE, {
                story_id: storyId
              }), '_self');
        }
      };

      $scope.deleteCanonicalStory = function(storyId) {
        NgbModal.open(DeleteStoryModalComponent, {
          backdrop: true
        }).result.then(function() {
          TopicUpdateService.removeCanonicalStory(
            ctrl.getTopic(), storyId);
          for (var i = 0; i < ctrl.storySummaries.length; i++) {
            if (ctrl.storySummaries[i].getId() === storyId) {
              ctrl.storySummaries.splice(i, 1);
            }
          }
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.onMoveStoryFinish = function(toIndex) {
        $scope.toIndex = toIndex;
        if ($scope.fromIndex === $scope.toIndex) {
          return;
        }
        TopicUpdateService.rearrangeCanonicalStory(
          ctrl.getTopic(), $scope.fromIndex, $scope.toIndex);
        var storySummary = (
          angular.copy(ctrl.storySummaries[$scope.fromIndex]));
        ctrl.storySummaries.splice($scope.fromIndex, 1);
        ctrl.storySummaries.splice($scope.toIndex, 0, storySummary);
      };

      $scope.onMoveStoryStart = function(fromIndex) {
        $scope.fromIndex = fromIndex;
      };

      ctrl.$onInit = function() {
        $scope.STORY_TABLE_COLUMN_HEADINGS = [
          'title', 'node_count', 'publication_status'];
      };
    }]
});
