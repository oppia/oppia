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
require('domain/story/story-validation.service');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/services/story-editor-navigation.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

require('services/alerts.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('storyEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/navbar/story-editor-navbar.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$scope', '$uibModal', 'AlertsService',
        'EditableStoryBackendApiService',
        'StoryEditorNavigationService', 'StoryEditorStateService',
        'StoryValidationService', 'UndoRedoService',
        function(
            $rootScope, $scope, $uibModal, AlertsService,
            EditableStoryBackendApiService,
            StoryEditorNavigationService, StoryEditorStateService,
            StoryValidationService, UndoRedoService) {
          var ctrl = this;
          var EDITOR = 'Editor';
          var PREVIEW = 'Preview';
          ctrl.directiveSubscriptions = new Subscription();
          $scope.explorationValidationIssues = [];

          ctrl.isStoryPublished = function() {
            return StoryEditorStateService.isStoryPublished();
          };

          ctrl.isSaveInProgress = function() {
            return StoryEditorStateService.isSavingStory();
          };

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
            StoryEditorStateService.loadStory($scope.story.getId());
            _validateStory();
            $scope.forceValidateExplorations = true;
          };

          var _validateStory = function() {
            $scope.validationIssues = $scope.story.validate();
            let nodes = $scope.story.getStoryContents().getNodes();
            let skillIdsInTopic = (
              StoryEditorStateService.getSkillSummaries().map(
                skill => skill.id));
            if ($scope.validationIssues.length === 0 && nodes.length > 0) {
              let prerequisiteSkillValidationIssues = (
                StoryValidationService
                  .validatePrerequisiteSkillsInStoryContents(
                    skillIdsInTopic, $scope.story.getStoryContents()));
              $scope.validationIssues = (
                $scope.validationIssues.concat(
                  prerequisiteSkillValidationIssues));
            }
            if (StoryEditorStateService.getStoryWithUrlFragmentExists()) {
              $scope.validationIssues.push(
                'Story URL fragment already exists.');
            }
            $scope.forceValidateExplorations = true;
            _validateExplorations();
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
                  // TODO(#8521): Remove the use of $rootScope.$apply()
                  // once the directive is migrated to angular.
                  $rootScope.$apply();
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
              backdrop: 'static',
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function(commitMessage) {
              StoryEditorStateService.saveStory(
                commitMessage, null, function(errorMessage) {
                  AlertsService.addInfoMessage(errorMessage, 5000);
                }
              );
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
            $scope.validationIssues = [];
            $scope.prepublishValidationIssues = [];
            ctrl.directiveSubscriptions.add(
              UndoRedoService.onUndoRedoChangeApplied$().subscribe(
                () => _validateStory()
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
