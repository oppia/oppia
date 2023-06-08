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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppConstants } from 'app.constants';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StoryEditorStateService } from './services/story-editor-state.service';
import { PageTitleService } from 'services/page-title.service';
import { StoryEditorNavigationService } from './services/story-editor-navigation.service';
import { LocalStorageService } from 'services/local-storage.service';
import { LoaderService } from 'services/loader.service';
import { StoryValidationService } from 'domain/story/story-validation.service';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StoryEditorStalenessDetectionService } from './services/story-editor-staleness-detection.service';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { UrlService } from 'services/contextual/url.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { Story } from 'domain/story/story.model';

@Component({
  selector: 'oppia-story-editor-page',
  templateUrl: './story-editor-page.component.html'
})
export class StoryEditorPageComponent implements OnInit, OnDestroy {
  warningsAreShown: boolean;
  validationIssues: string[];
  story: Story;
  prepublishValidationIssues: string[];
  forceValidateExplorations: boolean;
  explorationValidationIssues: string[];

  constructor(
    private undoRedoService: UndoRedoService,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private urlInterpolationService: UrlInterpolationService,
    private storyEditorStateService: StoryEditorStateService,
    private pageTitleService: PageTitleService,
    private storyEditorNavigationService: StoryEditorNavigationService,
    private localStorageService: LocalStorageService,
    private loaderService: LoaderService,
    private storyValidationService: StoryValidationService,
    private editableStoryBackendApiService: EditableStoryBackendApiService,
    private storyEditorStalenessDetectionService:
      StoryEditorStalenessDetectionService,
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private urlService: UrlService
  ) {}

  directiveSubscriptions = new Subscription();

  MAX_COMMIT_MESSAGE_LENGTH = AppConstants.MAX_COMMIT_MESSAGE_LENGTH;

  TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';

  returnToTopicEditorPage(): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(
        SavePendingChangesModalComponent, {
          backdrop: true
        });

      modalRef.componentInstance.body = (
        'Please save all pending changes before returning to the topic.');

      modalRef.result.then(() => {}, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.windowRef.nativeWindow.open(
        this.urlInterpolationService.interpolateUrl(
          this.TOPIC_EDITOR_URL_TEMPLATE, {
            topicId:
              this.storyEditorStateService.
                getStory().getCorrespondingTopicId()
          }
        ), '_self');
    }
  }

  setDocumentTitle(): void {
    this.pageTitleService.setDocumentTitle(
      this.storyEditorStateService.getStory().getTitle() + ' - Oppia');
    this.pageTitleService.setNavbarSubtitleForMobileView(
      this.storyEditorStateService.getStory().getTitle());
  }

  getActiveTab(): string {
    return this.storyEditorNavigationService.getActiveTab();
  }

  getNavbarText(): string {
    const activeTab = this.storyEditorNavigationService.getActiveTab();
    if (activeTab === 'story_editor') {
      return 'Story Editor';
    } else if (activeTab === 'story_preview') {
      return 'Story Preview';
    } else if (activeTab === 'chapter_editor') {
      return 'Chapter Editor';
    }
  }

  isWarningsAreShown(value: boolean): void {
    this.warningsAreShown = value;
  }

  isMainEditorTabSelected(): boolean {
    const activeTab = this.storyEditorNavigationService.getActiveTab();
    return activeTab === 'story_editor' || activeTab === 'chapter_editor';
  }

  _validateStory(): void {
    this.validationIssues = this.story.validate();
    let nodes = this.story.getStoryContents().getNodes();
    let skillIdsInTopic = this.storyEditorStateService.getSkillSummaries().map(
      skill => skill.id);
    if (this.validationIssues.length === 0 && nodes.length > 0) {
      let prerequisiteSkillValidationIssues = (
        this.storyValidationService.validatePrerequisiteSkillsInStoryContents(
          skillIdsInTopic, this.story.getStoryContents()));
      this.validationIssues = (
        this.validationIssues.concat(prerequisiteSkillValidationIssues));
    }
    if (this.storyEditorStateService.getStoryWithUrlFragmentExists()) {
      this.validationIssues.push(
        'Story URL fragment already exists.');
    }
    this._validateExplorations();
    let storyPrepublishValidationIssues = (
      this.story.prepublishValidate());
    let nodePrepublishValidationIssues = (
      [].concat.apply([], nodes.map(
        (node) => node.prepublishValidate())));
    this.prepublishValidationIssues = (
      storyPrepublishValidationIssues.concat(
        nodePrepublishValidationIssues));
  }

  _validateExplorations(): void {
    let nodes = this.story.getStoryContents().getNodes();
    let explorationIds = [];

    if (
      this.storyEditorStateService.areAnyExpIdsChanged() ||
        this.forceValidateExplorations) {
      this.explorationValidationIssues = [];
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].getExplorationId() !== null) {
          explorationIds.push(nodes[i].getExplorationId());
        } else {
          this.explorationValidationIssues.push(
            'Some chapters don\'t have exploration IDs provided.');
        }
      }
      this.forceValidateExplorations = false;
      if (explorationIds.length > 0) {
        this.editableStoryBackendApiService.validateExplorationsAsync(
          this.story.getId(), explorationIds
        ).then((validationIssues) => {
          this.explorationValidationIssues =
              this.explorationValidationIssues.concat(validationIssues);
        });
      }
    }
    this.storyEditorStateService.resetExpIdsChanged();
  }

  getTotalWarningsCount(): number {
    return (
      this.validationIssues.length +
        this.explorationValidationIssues.length +
        this.prepublishValidationIssues.length);
  }

  _initPage(): void {
    this.story = this.storyEditorStateService.getStory();
    this.setDocumentTitle();
    this._validateStory();
  }

  navigateToStoryPreviewTab(): void {
    this.storyEditorNavigationService.navigateToStoryPreviewTab();
  }

  navigateToStoryEditor(): void {
    this.storyEditorNavigationService.navigateToStoryEditor();
  }

  onClosingStoryEditorBrowserTab(): void {
    const story = this.storyEditorStateService.getStory();

    const storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    if (storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges() &&
        this.undoRedoService.getChangeCount() > 0) {
      storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);
    }
    storyEditorBrowserTabsInfo.decrementNumberOfOpenedTabs();

    this.localStorageService.updateEntityEditorBrowserTabsInfo(
      storyEditorBrowserTabsInfo,
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);
  }

  createStoryEditorBrowserTabsInfo(): void {
    const story = this.storyEditorStateService.getStory();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    if (storyEditorBrowserTabsInfo) {
      storyEditorBrowserTabsInfo.setLatestVersion(story.getVersion());
      storyEditorBrowserTabsInfo.incrementNumberOfOpenedTabs();
    } else {
      storyEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'story', story.getId(), story.getVersion(), 1, false);
    }

    this.localStorageService.updateEntityEditorBrowserTabsInfo(
      storyEditorBrowserTabsInfo,
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);
  }

  updateStoryEditorBrowserTabsInfo(): void {
    const story = this.storyEditorStateService.getStory();

    const storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    storyEditorBrowserTabsInfo.setLatestVersion(story.getVersion());
    storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(false);

    this.localStorageService.updateEntityEditorBrowserTabsInfo(
      storyEditorBrowserTabsInfo,
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);
  }

  onCreateOrUpdateStoryEditorBrowserTabsInfo(event: { key: string }): void {
    if (event.key === (
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS)
    ) {
      this.storyEditorStalenessDetectionService
        .staleTabEventEmitter.emit();
      this.storyEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter.emit();
    }
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading Story');
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(
        () => {
          this._initPage();
          this.createStoryEditorBrowserTabsInfo();
          this.loaderService.hideLoadingScreen();
        }
      ));
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(
        () => {
          this._initPage();
          this.updateStoryEditorBrowserTabsInfo();
        }
      ));
    this.validationIssues = [];
    this.prepublishValidationIssues = [];
    this.explorationValidationIssues = [];
    this.forceValidateExplorations = true;
    this.warningsAreShown = false;
    this.bottomNavbarStatusService.markBottomNavbarStatus(true);
    this.preventPageUnloadEventService.addListener(
      this.undoRedoService.getChangeCount.bind(this.undoRedoService));
    this.storyEditorStateService.loadStory(this.urlService.getStoryIdFromUrl());
    this.story = this.storyEditorStateService.getStory();

    this.pageTitleService.setNavbarTitleForMobileView('Story Editor');

    if (this.storyEditorNavigationService.checkIfPresentInChapterEditor()) {
      this.storyEditorNavigationService.navigateToChapterEditor();
    } else if (
      this.storyEditorNavigationService.checkIfPresentInStoryPreviewTab()) {
      this.storyEditorNavigationService.navigateToStoryPreviewTab();
    }
    this.directiveSubscriptions.add(
      this.undoRedoService.getUndoRedoChangeEventEmitter().subscribe(
        () => this._initPage()
      )
    );

    this.storyEditorStalenessDetectionService.init();
    this.windowRef.nativeWindow.addEventListener(
      'beforeunload', this.onClosingStoryEditorBrowserTab);
    this.localStorageService.registerNewStorageEventListener(
      this.onCreateOrUpdateStoryEditorBrowserTabsInfo);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStoryEditorPage', downgradeComponent({
  component: StoryEditorPageComponent
}));
