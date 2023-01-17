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
 * @fileoverview Component for the topic preview tab.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StorySummary } from 'domain/story/story-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic } from 'domain/topic/topic-object.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-topic-preview-tab',
  templateUrl: './topic-preview-tab.component.html'
})
export class TopicPreviewTabComponent {
  private _TAB_STORY: string = 'story';
  private _TAB_SUBTOPIC: string = 'subtopic';
  private _TAB_PRACTICE: string = 'practice';
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topic!: Topic;
  topicName!: string;
  subtopics!: Subtopic[];
  cannonicalStorySummaries!: StorySummary[];
  activeTab: string = this._TAB_STORY;
  chapterCount: number = 0;

  constructor(
    private topicEditorStateService: TopicEditorStateService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.topicName = this.topic.getName();
    this.subtopics = this.topic.getSubtopics();
    this.cannonicalStorySummaries = (
      this.topicEditorStateService.getCanonicalStorySummaries());
    for (let idx in this.cannonicalStorySummaries) {
      this.chapterCount += (
        this.cannonicalStorySummaries[idx].getNodeTitles().length);
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  changePreviewTab(tabName: string): void {
    switch (tabName) {
      case this._TAB_STORY:
        this.activeTab = this._TAB_STORY;
        break;
      case this._TAB_SUBTOPIC:
        this.activeTab = this._TAB_SUBTOPIC;
        break;
      case this._TAB_PRACTICE:
        this.activeTab = this._TAB_PRACTICE;
        break;
    }
  }
}

angular.module('oppia').directive('oppiaTopicPreviewTab',
  downgradeComponent({
    component: TopicPreviewTabComponent
  }) as angular.IDirectiveFactory);
