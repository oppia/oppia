// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Shared redesigned content of the topic viewer page, used by
 * both the learner-facing topic viewer page and the topic editor preview tab.
 */

import {Component, Input} from '@angular/core';
import {StorySummary} from 'domain/story/story-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';

import './topic-viewer-content.component.css';

export interface TopicViewerStorySectionData {
  storyId: string;
  storyTitle: string;
  storyDescription: string;
  storySummary: StorySummary;
  practiceSubtopicIds: number[];
  classroomUrlFragment: string;
  topicUrlFragment: string;
  lessonCount: number;
  practiceCount: number;
}

@Component({
  selector: 'topic-viewer-content',
  templateUrl: './topic-viewer-content.component.html',
  styleUrls: ['./topic-viewer-content.component.css'],
})
export class TopicViewerContentComponent {
  readonly VIEW_NAMES = {
    STORY: 'story',
    STUDYGUIDE: 'studyguide',
  } as const;

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicName!: string;
  @Input() topicDescription!: string;
  @Input() topicId!: string;
  @Input() classroomName!: string | null;
  @Input() classroomUrlFragment: string = '';
  @Input() topicUrlFragment: string = '';
  @Input() canonicalStorySectionData: readonly TopicViewerStorySectionData[] =
    [];
  @Input() activeView: string = this.VIEW_NAMES.STORY;
  @Input() topicIsLoading: boolean = false;
  @Input() subtopics: Subtopic[] = [];
  // True when this content is rendered inside the topic editor's preview tab,
  // where the editor's fixed header bar adds height to the header stack.
  @Input() isInTopicEditorPreview: boolean = false;

  trackStoryDataById(
    index: number,
    storyData: TopicViewerStorySectionData
  ): string {
    return storyData.storyId;
  }
}
