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

import { Subscription } from 'rxjs';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';

require('objects/objectComponentsRequires.ts');
require('pages/interaction-specs.constants.ajs.ts');

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.component.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.component.ts');
require('pages/story-editor-page/navbar/story-editor-navbar.component.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');
require(
  'pages/story-editor-page/story-preview-tab/story-preview-tab.component.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/services/story-editor-navigation.service');
require(
  'pages/story-editor-page/chapter-editor/chapter-editor-tab.component.ts');
require('domain/story/editable-story-backend-api.service.ts');
require('domain/story/story-validation.service');
require('pages/story-editor-page/story-editor-page.constants.ajs.ts');
require('services/bottom-navbar-status.service.ts');
require('services/page-title.service.ts');
require('services/loader.service.ts');
require('services/ngb-modal.service.ts');
require('services/prevent-page-unload-event.service.ts');
require('services/local-storage.service.ts');
require(
  'pages/story-editor-page/services/' +
  'story-editor-staleness-detection.service.ts');

angular.module('oppia').component('storyEditorPage', {
  template: require('./story-editor-page.component.html'),
  controller: [
    '$rootScope', '$window', 'BottomNavbarStatusService',
    'EditableStoryBackendApiService', 'LoaderService',
    'LocalStorageService', 'NgbModal',
    'PageTitleService', 'PreventPageUnloadEventService',
    'StoryEditorNavigationService',
    'StoryEditorStalenessDetectionService',
    'StoryEditorStateService',
    'StoryValidationService', 'UndoRedoService',
    'UrlInterpolationService', 'UrlService',
    'MAX_COMMIT_MESSAGE_LENGTH',
    function(
        $rootScope, $window, BottomNavbarStatusService,
        EditableStoryBackendApiService, LoaderService,
        LocalStorageService, NgbModal,
        PageTitleService, PreventPageUnloadEventService,
        StoryEditorNavigationService,
        StoryEditorStalenessDetectionService,
        StoryEditorStateService,
        StoryValidationService, UndoRedoService,
        UrlInterpolationService, UrlService,
        MAX_COMMIT_MESSAGE_LENGTH) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.MAX_COMMIT_MESSAGE_LENGTH = MAX_COMMIT_MESSAGE_LENGTH;
      var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
      ctrl.returnToTopicEditorPage = function() {
        if (UndoRedoService.getChangeCount() > 0) {
          const modalRef = NgbModal.open(
            SavePendingChangesModalComponent, {
              backdrop: true
            });

          modalRef.componentInstance.body = (
            'Please save all pending changes before returning to the topic.');

          modalRef.result.then(function() {}, function() {
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
      var setDocumentTitle = function() {
        PageTitleService.setDocumentTitle(
          StoryEditorStateService.getStory().getTitle() + ' - Oppia');
        PageTitleService.setNavbarSubtitleForMobileView(
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
        var nodes = ctrl.story.getStoryContents().getNodes();
        let skillIdsInTopic = StoryEditorStateService.getSkillSummaries().map(
          skill => skill.id);
        if (ctrl.validationIssues.length === 0 && nodes.length > 0) {
          let prerequisiteSkillValidationIssues = (
            StoryValidationService.validatePrerequisiteSkillsInStoryContents(
              skillIdsInTopic, ctrl.story.getStoryContents()));
          ctrl.validationIssues = (
            ctrl.validationIssues.concat(prerequisiteSkillValidationIssues));
        }
        if (StoryEditorStateService.getStoryWithUrlFragmentExists()) {
          ctrl.validationIssues.push(
            'Story URL fragment already exists.');
        }
        _validateExplorations();
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
            EditableStoryBackendApiService.validateExplorationsAsync(
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
        setDocumentTitle();
        _validateStory();
      };

      ctrl.navigateToStoryPreviewTab = function() {
        StoryEditorNavigationService.navigateToStoryPreviewTab();
      };

      ctrl.navigateToStoryEditor = function() {
        StoryEditorNavigationService.navigateToStoryEditor();
      };

      ctrl.onClosingStoryEditorBrowserTab = function() {
        const story = StoryEditorStateService.getStory();

        const storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
          LocalStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants
              .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

        if (storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges() &&
            UndoRedoService.getChangeCount() > 0) {
          storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
        }
        storyEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

        LocalStorageService.updateEntityEditorBrowserTabsInfo(
          storyEditorBrowserTabsInfo,
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_STORY_EDITOR_BROWSER_TABS);
      };

      let createStoryEditorBrowserTabsInfo = function() {
        const story = StoryEditorStateService.getStory();

        let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
          LocalStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants
              .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

        if (storyEditorBrowserTabsInfo) {
          storyEditorBrowserTabsInfo.setLatestVersion(story.getVersion());
          storyEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();
        } else {
          storyEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
            'story', story.getId(), story.getVersion(), 1, false);
        }

        LocalStorageService.updateEntityEditorBrowserTabsInfo(
          storyEditorBrowserTabsInfo,
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_STORY_EDITOR_BROWSER_TABS);
      };

      let updateStoryEditorBrowserTabsInfo = function() {
        const story = StoryEditorStateService.getStory();

        const storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
          LocalStorageService.getEntityEditorBrowserTabsInfo(
            EntityEditorBrowserTabsInfoDomainConstants
              .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

        storyEditorBrowserTabsInfo.setLatestVersion(story.getVersion());
        storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);

        LocalStorageService.updateEntityEditorBrowserTabsInfo(
          storyEditorBrowserTabsInfo,
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_STORY_EDITOR_BROWSER_TABS);
      };

      let onCreateOrUpdateStoryEditorBrowserTabsInfo = function(event) {
        if (event.key === (
          EntityEditorBrowserTabsInfoDomainConstants
            .OPENED_STORY_EDITOR_BROWSER_TABS)
        ) {
          StoryEditorStalenessDetectionService
            .staleTabEventEmitter.emit();
          StoryEditorStalenessDetectionService
            .presenceOfUnsavedChangesEventEmitter.emit();
          $rootScope.$applyAsync();
        }
      };

      ctrl.$onInit = function() {
        LoaderService.showLoadingScreen('Loading Story');
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryInitialized.subscribe(
            () => {
              _initPage();
              createStoryEditorBrowserTabsInfo();
              LoaderService.hideLoadingScreen();
              $rootScope.$applyAsync();
            }
          ));
        ctrl.directiveSubscriptions.add(
          StoryEditorStateService.onStoryReinitialized.subscribe(
            () => {
              _initPage();
              updateStoryEditorBrowserTabsInfo();
              $rootScope.$applyAsync();
            }
          ));
        ctrl.validationIssues = [];
        ctrl.prepublishValidationIssues = [];
        ctrl.explorationValidationIssues = [];
        ctrl.forceValidateExplorations = true;
        ctrl.warningsAreShown = false;
        BottomNavbarStatusService.markBottomNavbarStatus(true);
        PreventPageUnloadEventService.addListener(
          UndoRedoService.getChangeCount.bind(UndoRedoService));
        StoryEditorStateService.loadStory(UrlService.getStoryIdFromUrl());
        ctrl.story = StoryEditorStateService.getStory();

        PageTitleService.setNavbarTitleForMobileView('Story Editor');

        if (StoryEditorNavigationService.checkIfPresentInChapterEditor()) {
          StoryEditorNavigationService.navigateToChapterEditor();
        } else if (
          StoryEditorNavigationService.checkIfPresentInStoryPreviewTab()) {
          StoryEditorNavigationService.navigateToStoryPreviewTab();
        }
        ctrl.directiveSubscriptions.add(
          UndoRedoService.getUndoRedoChangeEventEmitter().subscribe(
            () => _initPage()
          )
        );

        StoryEditorStalenessDetectionService.init();
        $window.addEventListener(
          'beforeunload', ctrl.onClosingStoryEditorBrowserTab);
        LocalStorageService.registerNewStorageEventListener(
          onCreateOrUpdateStoryEditorBrowserTabsInfo);
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
