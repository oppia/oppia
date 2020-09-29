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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('topicEditorStoriesList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        storySummaries: '=',
        getTopic: '&topic'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/editor-tab/' +
        'topic-editor-stories-list.directive.html'),
      controller: [
        '$scope', '$uibModal', '$window', 'TopicUpdateService',
        'UndoRedoService', 'UrlInterpolationService',
        function(
            $scope, $uibModal, $window, TopicUpdateService,
            UndoRedoService, UrlInterpolationService) {
          var ctrl = this;
          var STORY_EDITOR_URL_TEMPLATE = '/story_editor/<story_id>';
          $scope.openStoryEditor = function(storyId) {
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
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  STORY_EDITOR_URL_TEMPLATE, {
                    story_id: storyId
                  }), '_self');
            }
          };

          $scope.deleteCanonicalStory = function(storyId) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'delete-story-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              TopicUpdateService.removeCanonicalStory(
                $scope.getTopic(), storyId);
              for (var i = 0; i < $scope.storySummaries.length; i++) {
                if ($scope.storySummaries[i].getId() === storyId) {
                  $scope.storySummaries.splice(i, 1);
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
              $scope.getTopic(), $scope.fromIndex, $scope.toIndex);
            var storySummary = (
              angular.copy($scope.storySummaries[$scope.fromIndex]));
            $scope.storySummaries.splice($scope.fromIndex, 1);
            $scope.storySummaries.splice($scope.toIndex, 0, storySummary);
          };

          $scope.onMoveStoryStart = function(fromIndex) {
            $scope.fromIndex = fromIndex;
          };

          ctrl.$onInit = function() {
            $scope.STORY_TABLE_COLUMN_HEADINGS = [
              'title', 'node_count', 'publication_status'];
          };
        }
      ]
    };
  }]);
