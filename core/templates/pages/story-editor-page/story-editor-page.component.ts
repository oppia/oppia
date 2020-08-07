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
 * @fileoverview Component for the story editor page.
 */

require('objects/objectComponentsRequires.ts');
require('pages/interaction-specs.constants.ajs.ts');

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts');
require('pages/story-editor-page/navbar/story-editor-navbar.directive.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');
require(
  'pages/story-editor-page/story-preview-tab/story-preview-tab.component.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/services/story-editor-navigation.service');
require(
  'pages/story-editor-page/chapter-editor/chapter-editor-tab.component.ts');
require('domain/story/editable-story-backend-api.service.ts');
require('pages/story-editor-page/story-editor-page.constants.ajs.ts');
require('services/bottom-navbar-status.service.ts');
require('services/page-title.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('storyEditorPage', {
  template: require('./story-editor-page.component.html'),
  controller: [
    '$scope', '$uibModal', '$window', 'BottomNavbarStatusService',
    'EditableStoryBackendApiService',
    'PageTitleService', 'StoryEditorNavigationService',
    'StoryEditorStateService', 'UndoRedoService',
    'UrlInterpolationService', 'UrlService',
    'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
    function(
        $scope, $uibModal, $window, BottomNavbarStatusService,
        EditableStoryBackendApiService,
        PageTitleService, StoryEditorNavigationService,
        StoryEditorStateService, UndoRedoService,
        UrlInterpolationService, UrlService,
        EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
      ctrl.returnToTopicEditorPage = function() {
        if (UndoRedoService.getChangeCount() > 0) {
          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/story-editor-page/modal-templates/' +
              'story-save-pending-changes-modal.template.html'),
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
              TOPIC_EDITOR_URL_TEMPLATE, {
                topicId:
                  StoryEditorStateService.
                    getStory().getCorrespondingTopicId()
              }
            ), '_self');
        }
      };
      var setPageTitle = function() {
        PageTitleService.setPageTitle(
          StoryEditorStateService.getStory().getTitle() + ' - Oppia');
        PageTitleService.setPageSubtitleForMobileView(
          StoryEditorStateService.getStory().getTitle());
      };

      ctrl.getActiveTab = function() {
        return StoryEditorNavigationService.getActiveTab();
      };

      ctrl.getNavbarText = function() {
        const activeTab = StoryEditorNavigationService.getActiveTab();
        if (activeTab === 'story_editor') {
          return 'Story Editor';
        } else if (activeTab === 'story_preview') {
          return 'Story Preview';
        } else if (activeTab === 'chapter_editor') {
          return 'Chapter Editor';
        }
      };

      ctrl.toggleWarnings = function() {
        ctrl.warningsAreShown = !ctrl.warningsAreShown;
      };

      ctrl.isMainEditorTabSelected = function() {
        const activeTab = StoryEditorNavigationService.getActiveTab();
        return activeTab === 'story_editor' || activeTab === 'chapter_editor';
      };

      var _validateStory = function() {
        ctrl.validationIssues = ctrl.story.validate();
        _validateExplorations();
        var nodes = ctrl.story.getStoryContents().getNodes();
        var storyPrepublishValidationIssues = (
          ctrl.story.prepublishValidate());
        var nodePrepublishValidationIssues = (
          [].concat.apply([], nodes.map(
            (node) => node.prepublishValidate())));
        ctrl.prepublishValidationIssues = (
          storyPrepublishValidationIssues.concat(
            nodePrepublishValidationIssues));
      };

      var _validateExplorations = function() {
        var nodes = ctrl.story.getStoryContents().getNodes();
        var explorationIds = [];

        if (
          StoryEditorStateService.areAnyExpIdsChanged() ||
            ctrl.forceValidateExplorations) {
          ctrl.explorationValidationIssues = [];
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getExplorationId() !== null) {
              explorationIds.push(nodes[i].getExplorationId());
            } else {
              ctrl.explorationValidationIssues.push(
                'Some chapters don\'t have exploration IDs provided.');
            }
          }
          ctrl.forceValidateExplorations = false;
          if (explorationIds.length > 0) {
            EditableStoryBackendApiService.validateExplorations(
              ctrl.story.getId(), explorationIds
            ).then(function(validationIssues) {
              ctrl.explorationValidationIssues =
                  ctrl.explorationValidationIssues.concat(validationIssues);
            });
          }
        }
        StoryEditorStateService.resetExpIdsChanged();
      };

      ctrl.getTotalWarningsCount = function() {
        return (
          ctrl.validationIssues.length +
            ctrl.explorationValidationIssues.length +
            ctrl.prepublishValidationIssues.length);
      };

      var _initPage = function() {
        ctrl.story = StoryEditorStateService.getStory();
        setPageTitle();
        _validateStory();
      };

      ctrl.navigateToStoryPreviewTab = function() {
        StoryEditorNavigationService.navigateToStoryPreviewTab();
      };

      ctrl.navigateToStoryEditor = function() {
        StoryEditorNavigationService.navigateToStoryEditor();
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryInitialized.subscribe(
            () => _initPage()
          ));
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryReinitialized.subscribe(
            () => _initPage()
          ));
        ctrl.validationIssues = [];
        ctrl.prepublishValidationIssues = [];
        ctrl.explorationValidationIssues = [];
        ctrl.forceValidateExplorations = true;
        ctrl.warningsAreShown = false;
        BottomNavbarStatusService.markBottomNavbarStatus(true);
        StoryEditorStateService.loadStory(UrlService.getStoryIdFromUrl());
        ctrl.story = StoryEditorStateService.getStory();

        PageTitleService.setPageTitleForMobileView('Story Editor');

        if (StoryEditorNavigationService.checkIfPresentInChapterEditor()) {
          StoryEditorNavigationService.navigateToChapterEditor();
        } else if (
          StoryEditorNavigationService.checkIfPresentInStoryPreviewTab()) {
          StoryEditorNavigationService.navigateToStoryPreviewTab();
        }
        $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _initPage);
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
