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
 * @fileoverview Directive for the navbar of the story editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require('domain/editor/undo_redo/base-undo-redo.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/summary/exploration-summary-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

angular.module('oppia').directive('storyEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/navbar/story-editor-navbar.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'AlertsService',
        'ExplorationSummaryBackendApiService', 'UndoRedoService',
        'StoryEditorStateService', 'UrlService',
        'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $rootScope, $uibModal, AlertsService,
            ExplorationSummaryBackendApiService, UndoRedoService,
            StoryEditorStateService, UrlService,
            EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          var ctrl = this;
          $scope.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.isStorySaveable = function() {
            return (
              $scope.getChangeListLength() > 0 &&
              $scope.getWarningsCount() === 0);
          };

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            StoryEditorStateService.loadStory($scope.story.getId());
          };

          var _validateStory = function() {
            $scope.validationIssues = $scope.story.validate();
            _validateExplorations();
          };

          var _validateExplorations = function() {
            var nodes = $scope.story.getStoryContents().getNodes();
            var explorationIds = [];
            for (var i = 0; i < nodes.length; i++) {
              if (
                nodes[i].getExplorationId() !== null &&
                nodes[i].getExplorationId() !== '') {
                explorationIds.push(nodes[i].getExplorationId());
              } else {
                $scope.validationIssues.push(
                  'Some chapters don\'t have exploration IDs provided.');
              }
            }

            ExplorationSummaryBackendApiService.loadPublicExplorationSummaries(
              explorationIds).then(function(summaries) {
              if (summaries.length !== explorationIds.length) {
                $scope.validationIssues.push(
                  'Some explorations in story are not published.');
              } else if (summaries.length > 0) {
                var commonExpCategory = summaries[0].category;
                for (var idx in summaries) {
                  if (summaries[idx].category !== commonExpCategory) {
                    $scope.validationIssues.push(
                      'The explorations with IDs ' + summaries[0].id + ' and ' +
                      summaries[idx].id + ' have different categories.'
                    );
                    break;
                  }
                }
              }
            });
          };

          $scope.saveChanges = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'story-editor-save-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.save = function(commitMessage) {
                    $uibModalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(commitMessage) {
              StoryEditorStateService.saveStory(commitMessage);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.publishStory = function() {
            StoryEditorStateService.changeStoryPublicationStatus(
              true, function() {
                $scope.storyIsPublished =
                  StoryEditorStateService.isStoryPublished();
              });
          };

          $scope.unpublishStory = function() {
            StoryEditorStateService.changeStoryPublicationStatus(
              false, function() {
                $scope.storyIsPublished =
                  StoryEditorStateService.isStoryPublished();
              });
          };

          ctrl.$onInit = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.isStoryPublished = StoryEditorStateService.isStoryPublished;
            $scope.isSaveInProgress = StoryEditorStateService.isSavingStory;
            $scope.validationIssues = [];
            $scope.$on(EVENT_STORY_INITIALIZED, _validateStory);
            $scope.$on(EVENT_STORY_REINITIALIZED, _validateStory);
            $scope.$on(
              EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateStory);
          };
        }
      ]
    };
  }]);
