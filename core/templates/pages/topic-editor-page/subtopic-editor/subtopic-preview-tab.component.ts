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
 * @fileoverview Component for the subtopic preview tab directive.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic } from 'domain/topic/topic-object.model';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { TopicEditorRoutingService } from '../services/topic-editor-routing.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-subtopic-preview-tab',
  templateUrl: './subtopic-preview-tab.component.html'
})
export class SubtopicPreviewTab {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topic!: Topic;
  subtopicId!: number;
  // Below property is null when their is no subtopic for the topic.
  subtopic!: Subtopic | null;
  editableTitle!: string;
  // 'null' if there is no thumbnail file.
  editableThumbnailFilename!: string | null;
  // 'null' if there is no thumbnail background color.
  editableThumbnailBgColor!: string | null;
  subtopicPage!: SubtopicPage;
  pageContents!: SubtopicPageContents;
  htmlData!: string;
  thumbnailIsShown!: boolean;
  THUMBNAIL: string = 'thumbnail';
  CONTENT: string = 'content';

  constructor(
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  private _initEditor(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.subtopicId = (
      this.topicEditorRoutingService.getSubtopicIdFromUrl());
    this.subtopic = (
      this.topic.getSubtopicById(this.subtopicId));

    if (this.topic.getId() && this.subtopic) {
      this.topicEditorStateService.loadSubtopicPage(
        this.topic.getId(), this.subtopicId);
      this.editableTitle = this.subtopic.getTitle();
      this.editableThumbnailFilename = (
        this.subtopic.getThumbnailFilename());
      this.editableThumbnailBgColor = (
        this.subtopic.getThumbnailBgColor());
      this.subtopicPage = (
        this.topicEditorStateService.getSubtopicPage());
      this.pageContents = this.subtopicPage.getPageContents();
      if (this.pageContents) {
        this.htmlData = this.pageContents.getHtml();
      }
    }
  }

  navigateToSubtopic(): void {
    this.topicEditorRoutingService.navigateToSubtopicEditorWithId(
      this.subtopicId);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onSubtopicPageLoaded.subscribe(() => {
        this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
        this.pageContents = this.subtopicPage.getPageContents();
        this.htmlData = this.pageContents.getHtml();
      })
    );

    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(
        () => this._initEditor()
      ));

    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(
        () => this._initEditor()
      ));

    this.thumbnailIsShown = !this.windowDimensionsService.isWindowNarrow();
    this._initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaSubtopicPreviewTab',
  downgradeComponent({
    component: SubtopicPreviewTab
  }) as angular.IDirectiveFactory);
