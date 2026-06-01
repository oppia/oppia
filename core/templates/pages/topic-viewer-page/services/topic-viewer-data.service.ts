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
 * @fileoverview Service for holding topic viewer page data derived from the
 * readonly topic model.
 */

import {Injectable} from '@angular/core';

import {StorySummary} from 'domain/story/story-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';

export interface TopicViewerStorySectionData {
  storyId: string;
  storyTitle: string;
  storyDescription: string;
  lessonCount: number;
  practiceCount: number;
}

export interface TopicViewerData {
  topicId?: string;
  topicName?: string;
  topicDescription?: string;
  classroomName?: string | null;
  storyTitle?: string;
  storyDescription?: string;
  classroomUrlFragment?: string;
  topicUrlFragment?: string;
  lessonCount?: number;
  practiceCount?: number;
  canonicalStoryData: TopicViewerStorySectionData[];
}

@Injectable({
  providedIn: 'root',
})
export class TopicViewerDataService {
  private data: TopicViewerData = {
    lessonCount: 0,
    practiceCount: 0,
    canonicalStoryData: [],
  };

  setTopicData(d: Partial<TopicViewerData>): void {
    this.data = {...this.data, ...d};
  }

  setFromReadOnlyTopic(
    readOnlyTopic: ReadOnlyTopic,
    classroomUrlFragment?: string,
    topicUrlFragment?: string
  ): void {
    const canonicalStorySummaries = readOnlyTopic.getCanonicalStorySummaries();
    const subtopics = readOnlyTopic.getSubtopics();
    const lessonCount = this.getTotalLessonCount(canonicalStorySummaries);
    const practiceCount = this.getPracticeCountFromSubtopics(subtopics);
    const canonicalStoryData = canonicalStorySummaries.map(storySummary => {
      return {
        storyId: storySummary.getId(),
        storyTitle: storySummary.getTitle(),
        storyDescription: storySummary.getDescription() || '',
        lessonCount: storySummary.getNodeTitles().length,
        practiceCount,
      };
    });

    const firstCanonicalStoryData = canonicalStoryData[0];
    this.data = {
      topicId: readOnlyTopic.getTopicId(),
      topicName: readOnlyTopic.getTopicName(),
      topicDescription: readOnlyTopic.getTopicDescription(),
      classroomName: readOnlyTopic.getClassroomName(),
      storyTitle: firstCanonicalStoryData
        ? firstCanonicalStoryData.storyTitle
        : readOnlyTopic.getTopicName(),
      storyDescription: firstCanonicalStoryData
        ? firstCanonicalStoryData.storyDescription
        : readOnlyTopic.getTopicDescription(),
      classroomUrlFragment,
      topicUrlFragment,
      lessonCount,
      practiceCount,
      canonicalStoryData,
    };
  }

  getTopicId(): string | undefined {
    return this.data.topicId;
  }

  getTopicName(): string | undefined {
    return this.data.topicName;
  }

  getTopicDescription(): string | undefined {
    return this.data.topicDescription;
  }

  getClassroomName(): string | null | undefined {
    return this.data.classroomName;
  }

  getStoryTitle(): string | undefined {
    return this.data.storyTitle;
  }

  getStoryDescription(): string | undefined {
    return this.data.storyDescription;
  }

  getClassroomUrlFragment(): string | undefined {
    return this.data.classroomUrlFragment;
  }

  getTopicUrlFragment(): string | undefined {
    return this.data.topicUrlFragment;
  }

  getLessonCount(): number {
    return this.data.lessonCount ?? 0;
  }

  getPracticeCount(): number {
    return this.data.practiceCount ?? 0;
  }

  getCanonicalStoryData(): readonly TopicViewerStorySectionData[] {
    return this.data.canonicalStoryData;
  }

  private getTotalLessonCount(storySummaries: StorySummary[]): number {
    return storySummaries.reduce((sum, storySummary) => {
      return sum + storySummary.getNodeTitles().length;
    }, 0);
  }

  private getPracticeCountFromSubtopics(subtopics: Subtopic[]): number {
    return subtopics.filter(subtopic => {
      return subtopic.getSkillSummaries().length > 0;
    }).length;
  }
}
