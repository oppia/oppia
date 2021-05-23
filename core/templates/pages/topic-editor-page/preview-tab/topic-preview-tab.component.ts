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
import { StorySummaryBackendDict } from 'domain/story/story-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic } from 'domain/topic/TopicObjectFactory';
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
  topic: Topic;
  topicName: string;
  subtopics: Subtopic[];
  activeTab: string = this._TAB_STORY;
  cannonicalStorySummaries: StorySummaryBackendDict[];
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
    console.log(this.cannonicalStorySummaries);
    for (let idx in this.cannonicalStorySummaries) {
      this.chapterCount += (
        this.cannonicalStorySummaries[idx].getNodeTitles().length());
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

// angular.module('oppia').component('topicPreviewTab', {
//   template: require('./topic-preview-tab.component.html'),
//   controllerAs: '$ctrl',
//   controller: ['TopicEditorStateService', 'UrlInterpolationService',
//     function(TopicEditorStateService, UrlInterpolationService) {
//       var ctrl = this;
//       var TAB_STORY = 'story';
//       var TAB_SUBTOPIC = 'subtopic';
//       var TAB_PRACTICE = 'practice';
//       ctrl.$onInit = function() {
//         ctrl.topic = TopicEditorStateService.getTopic();
//         ctrl.topicName = ctrl.topic.getName();
//         ctrl.subtopics = ctrl.topic.getSubtopics();
//         ctrl.activeTab = TAB_STORY;
//         ctrl.canonicalStorySummaries = (
//           TopicEditorStateService.getCanonicalStorySummaries());
//         ctrl.chapterCount = 0;
//         for (var idx in ctrl.canonicalStorySummaries) {
//           ctrl.chapterCount += (
//             ctrl.canonicalStorySummaries[idx].getNodeTitles().length);
//         }
//       };
//       ctrl.getStaticImageUrl = function(imagePath) {
//         return UrlInterpolationService.getStaticImageUrl(imagePath);
//       };
//       ctrl.changePreviewTab = function(tabName) {
//         switch (tabName) {
//           case TAB_STORY: ctrl.activeTab = TAB_STORY; break;
//           case TAB_SUBTOPIC: ctrl.activeTab = TAB_SUBTOPIC; break;
//           case TAB_PRACTICE: ctrl.activeTab = TAB_PRACTICE; break;
//         }
//       };
//     }
//   ]
// });
