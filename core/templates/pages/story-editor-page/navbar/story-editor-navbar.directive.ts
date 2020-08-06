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
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');
require('domain/editor/undo_redo/base-undo-redo.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/editable-story-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/services/story-editor-navigation.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('storyEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/navbar/story-editor-navbar.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'AlertsService',
        'EditableStoryBackendApiService', 'UndoRedoService',
        'StoryEditorStateService', 'StoryEditorNavigationService', 'UrlService',
        function(
            $scope, $rootScope, $uibModal, AlertsService,
            EditableStoryBackendApiService, UndoRedoService,
            StoryEditorStateService, StoryEditorNavigationService, UrlService) {
          var ctrl = this;
          var EDITOR = 'Editor';
          var PREVIEW = 'Preview';
          ctrl.directiveSubscriptions = new Subscription();
          $scope.explorationValidationIssues = [];

          $scope.getChangeListLength = function() {
            return UndoRedoService.getChangeCount();
          };

          $scope.getWarningsCount = function() {
            return $scope.validationIssues.length;
          };

          $scope.getTotalWarningsCount = function() {
            return (
              $scope.validationIssues.length +
              $scope.explorationValidationIssues.length +
              $scope.prepublishValidationIssues.length);
          };

          $scope.isStorySaveable = function() {
            if (StoryEditorStateService.isStoryPublished()) {
              return (
                $scope.getChangeListLength() > 0 &&
                $scope.getTotalWarningsCount() === 0);
            }
            return (
              $scope.getChangeListLength() > 0 &&
              $scope.getWarningsCount() === 0);
          };

          $scope.discardChanges = function() {
            UndoRedoService.clearChanges();
            $scope.validationIssues = [];
            $scope.explorationValidationIssues = [];
            StoryEditorStateService.loadStory($scope.story.getId());
          };

          var _validateStory = function() {
            $scope.validationIssues = $scope.story.validate();
            _validateExplorations();
            var nodes = $scope.story.getStoryContents().getNodes();
            var storyPrepublishValidationIssues = (
              $scope.story.prepublishValidate());
            var nodePrepublishValidationIssues = (
              [].concat.apply([], nodes.map(
                (node) => node.prepublishValidate())));
            $scope.prepublishValidationIssues = (
              storyPrepublishValidationIssues.concat(
                nodePrepublishValidationIssues));
          };

          var _validateExplorations = function() {
            var nodes = $scope.story.getStoryContents().getNodes();
            var explorationIds = [];

            if (
              StoryEditorStateService.areAnyExpIdsChanged() ||
              $scope.forceValidateExplorations) {
              $scope.explorationValidationIssues = [];
              for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].getExplorationId() !== null) {
                  explorationIds.push(nodes[i].getExplorationId());
                } else {
                  $scope.explorationValidationIssues.push(
                    'Some chapters don\'t have exploration IDs provided.');
                }
              }
              $scope.forceValidateExplorations = false;
              if (explorationIds.length > 0) {
                EditableStoryBackendApiService.validateExplorations(
                  $scope.story.getId(), explorationIds
                ).then(function(validationIssues) {
                  $scope.explorationValidationIssues =
                    $scope.explorationValidationIssues.concat(validationIssues);
                });
              }
            }
            StoryEditorStateService.resetExpIdsChanged();
          };

          $scope.saveChanges = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'story-editor-save-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function(commitMessage) {
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
                $scope.forceValidateExplorations = true;
                _validateStory();
              });
          };

          $scope.toggleWarningText = function() {
            $scope.warningsAreShown = !$scope.warningsAreShown;
          };

          $scope.toggleNavigationOptions = function() {
            $scope.showNavigationOptions = !$scope.showNavigationOptions;
          };

          $scope.toggleStoryEditOptions = function() {
            $scope.showStoryEditOptions = !$scope.showStoryEditOptions;
          };

          $scope.selectMainTab = function() {
            $scope.activeTab = EDITOR;
            StoryEditorNavigationService.navigateToStoryEditor();
            $scope.showNavigationOptions = false;
          };

          $scope.selectPreviewTab = function() {
            $scope.activeTab = PREVIEW;
            StoryEditorNavigationService.navigateToStoryPreviewTab();
            $scope.showNavigationOptions = false;
          };

          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              StoryEditorStateService.onStoryInitialized.subscribe(
                () => _validateStory()
              ));
            ctrl.directiveSubscriptions.add(
              StoryEditorStateService.onStoryReinitialized.subscribe(
                () => _validateStory()
              ));
            $scope.forceValidateExplorations = true;
            $scope.warningsAreShown = false;
            $scope.activeTab = EDITOR;
            $scope.showNavigationOptions = false;
            $scope.showStoryEditOptions = false;
            $scope.story = StoryEditorStateService.getStory();
            $scope.isStoryPublished = StoryEditorStateService.isStoryPublished;
            $scope.isSaveInProgress = StoryEditorStateService.isSavingStory;
            $scope.validationIssues = [];
            $scope.prepublishValidationIssues = [];
            ctrl.directiveSubscriptions.add(
              UndoRedoService.onUndoRedoChangeApplied().subscribe(
                () => {
                  console.log('Caught: undoRedoChangeApplied in story-editor-navbar');
                  _validateStory();
                }
              )
            );
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
