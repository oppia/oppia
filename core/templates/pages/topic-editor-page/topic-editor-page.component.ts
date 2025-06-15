// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the topic editor page.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {Topic} from 'domain/topic/topic-object.model';
import {TopicRights} from 'domain/topic/topic-rights.model';
import {Subscription} from 'rxjs';
import {BottomNavbarStatusService} from 'services/bottom-navbar-status.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {TopicEditorRoutingService} from './services/topic-editor-routing.service';
import {TopicEditorStateService} from './services/topic-editor-state.service';

@Component({
  selector: 'oppia-topic-editor-page',
  templateUrl: './topic-editor-page.component.html',
})
export class TopicEditorPageComponent implements OnInit, OnDestroy {
  topic: Topic;
  validationIssues: string[];
  prepublishValidationIssues: string[];
  warningsAreShown: boolean;
  topicRights: TopicRights;

  constructor(
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private contextService: ContextService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService,
    private undoRedoService: UndoRedoService,
    private urlService: UrlService
  ) {}

  directiveSubscriptions = new Subscription();

  getActiveTabName(): string {
    return this.topicEditorRoutingService.getActiveTabName();
  }

  getEntityType(): string {
    return this.contextService.getEntityType();
  }

  setDocumentTitle(): void {
    let topicName = this.topicEditorStateService.getTopic().getName();
    this.pageTitleService.setDocumentTitle(topicName + ' - Oppia');
    this.pageTitleService.setNavbarSubtitleForMobileView(topicName);
    this.topic = this.topicEditorStateService.getTopic();
    this._validateTopic();
  }

  getChangeListLength(): number {
    return this.undoRedoService.getChangeCount();
  }

  isInTopicEditorTabs(): boolean {
    let activeTab = this.topicEditorRoutingService.getActiveTabName();
    return !activeTab.startsWith('subtopic');
  }

  openTopicViewer(): void {
    let activeTab = this.topicEditorRoutingService.getActiveTabName();
    let lastSubtopicIdVisited =
      this.topicEditorRoutingService.getLastSubtopicIdVisited();
    if (!activeTab.startsWith('subtopic') && !lastSubtopicIdVisited) {
      this.topicEditorRoutingService.navigateToTopicPreviewTab();
    } else {
      let subtopicId = this.topicEditorRoutingService.getSubtopicIdFromUrl();
      this.topicEditorRoutingService.navigateToSubtopicPreviewTab(subtopicId);
    }
  }

  isInPreviewTab(): boolean {
    let activeTab = this.topicEditorRoutingService.getActiveTabName();
    return activeTab === 'subtopic_preview' || activeTab === 'topic_preview';
  }

  selectMainTab(): void {
    const activeTab = this.getActiveTabName();
    const subtopicId =
      this.topicEditorRoutingService.getSubtopicIdFromUrl() ||
      this.topicEditorRoutingService.getLastSubtopicIdVisited();
    const lastTabVisited = this.topicEditorRoutingService.getLastTabVisited();
    if (activeTab.startsWith('subtopic') || lastTabVisited === 'subtopic') {
      this.topicEditorRoutingService.navigateToSubtopicEditorWithId(subtopicId);
      return;
    }
    this.topicEditorRoutingService.navigateToMainTab();
  }

  hideWarnings(): void {
    this.warningsAreShown = false;
  }

  isMainEditorTabSelected(): boolean {
    const activeTab = this.getActiveTabName();
    return activeTab === 'main' || activeTab === 'subtopic_editor';
  }

  selectQuestionsTab(): void {
    this.topicEditorRoutingService.navigateToQuestionsTab();
  }

  getNavbarText(): string {
    if (this.topicEditorStateService.hasLoadedTopic()) {
      const activeTab = this.getActiveTabName();
      if (activeTab === 'main') {
        return 'Topic Editor';
      } else if (activeTab === 'subtopic_editor') {
        return 'Subtopic Editor';
      } else if (activeTab === 'subtopic_preview') {
        return 'Subtopic Preview';
      } else if (activeTab === 'questions') {
        return 'Question Editor';
      } else if (activeTab === 'topic_preview') {
        return 'Topic Preview';
      }
    }
  }

  _validateTopic(): void {
    this.validationIssues = this.topic.validate();
    if (this.topicEditorStateService.getTopicWithNameExists()) {
      this.validationIssues.push('A topic with this name already exists.');
    }
    if (this.topicEditorStateService.getTopicWithUrlFragmentExists()) {
      this.validationIssues.push('Topic URL fragment already exists.');
    }
    let prepublishTopicValidationIssues = this.topic.prepublishValidate();
    let subtopicPrepublishValidationIssues = [].concat.apply(
      [],
      this.topic.getSubtopics().map(subtopic => subtopic.prepublishValidate())
    );
    this.prepublishValidationIssues = prepublishTopicValidationIssues.concat(
      subtopicPrepublishValidationIssues
    );
  }

  getWarningsCount(): number {
    return this.validationIssues.length;
  }

  getTotalWarningsCount(): number {
    let validationIssuesCount = this.validationIssues.length;
    let prepublishValidationIssuesCount =
      this.prepublishValidationIssues.length;
    return validationIssuesCount + prepublishValidationIssuesCount;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading Topic');
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() => {
        this.loaderService.hideLoadingScreen();
        this.setDocumentTitle();
      })
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() => {
        this.setDocumentTitle();
      })
    );
    this.topicEditorStateService.loadTopic(this.urlService.getTopicIdFromUrl());
    this.pageTitleService.setNavbarTitleForMobileView('Topic Editor');
    this.preventPageUnloadEventService.addListener(
      this.undoRedoService.getChangeCount.bind(this.undoRedoService)
    );
    this.validationIssues = [];
    this.prepublishValidationIssues = [];
    this.warningsAreShown = false;
    this.bottomNavbarStatusService.markBottomNavbarStatus(true);
    this.topicRights = this.topicEditorStateService.getTopicRights();
    this.directiveSubscriptions.add(
      this.undoRedoService
        .getUndoRedoChangeEventEmitter()
        .subscribe(() => this.setDocumentTitle())
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
