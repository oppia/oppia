// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import {
  StorySummary,
  StorySummaryBackendDict,
} from 'domain/story/story-summary.model';
import {DegreesOfMastery} from 'domain/topic_viewer/read-only-topic-object.factory';
import {
  SubtopicBackendDict,
  Subtopic,
  SkillIdToDescriptionMap,
} from './subtopic.model';

/**
 * @fileoverview Frontend Model for learner topic summary.
 */

export interface LearnerTopicSummaryBackendDict {
  id: string;
  name: string;
  language_code: string;
  description: string;
  version: number;
  story_titles: string[];
  total_published_node_count: number;
  canonical_story_summary_dict: StorySummaryBackendDict[];
  thumbnail_filename: string;
  thumbnail_bg_color: string;
  classroom_name: string;
  classroom_url_fragment: string;
  practice_tab_is_displayed: boolean;
  degrees_of_mastery: DegreesOfMastery;
  skill_descriptions: SkillIdToDescriptionMap;
  subtopics: SubtopicBackendDict[];
  url_fragment: string;
}

export class LearnerTopicSummary {
  constructor(
    public id: string,
    public name: string,
    public languageCode: string,
    public description: string,
    public version: number,
    public storyTitles: string[],
    public totalPublishedNodeCount: number,
    public canonicalStorySummaryDicts: StorySummary[],
    public thumbnailFilename: string,
    public thumbnailBgColor: string,
    public classroomName: string,
    public classroomUrlFragment: string,
    public practiceTabIsDisplayed: boolean,
    public degreesOfMastery: DegreesOfMastery,
    public skillDescriptions: SkillIdToDescriptionMap,
    public subtopics: Subtopic[],
    public urlFragment: string
  ) {}

  static createFromBackendDict(
    topicSummaryBackendDict: LearnerTopicSummaryBackendDict
  ): LearnerTopicSummary {
    let subtopics = topicSummaryBackendDict.subtopics.map(subtopic => {
      return Subtopic.create(
        subtopic,
        topicSummaryBackendDict.skill_descriptions
      );
    });
    let canonicalStorySummaries =
      topicSummaryBackendDict.canonical_story_summary_dict.map(story => {
        return StorySummary.createFromBackendDict(story);
      });

    return new LearnerTopicSummary(
      topicSummaryBackendDict.id,
      topicSummaryBackendDict.name,
      topicSummaryBackendDict.language_code,
      topicSummaryBackendDict.description,
      topicSummaryBackendDict.version,
      topicSummaryBackendDict.story_titles,
      topicSummaryBackendDict.total_published_node_count,
      canonicalStorySummaries,
      topicSummaryBackendDict.thumbnail_filename,
      topicSummaryBackendDict.thumbnail_bg_color,
      topicSummaryBackendDict.classroom_name,
      topicSummaryBackendDict.classroom_url_fragment,
      topicSummaryBackendDict.practice_tab_is_displayed,
      topicSummaryBackendDict.degrees_of_mastery,
      topicSummaryBackendDict.skill_descriptions,
      subtopics,
      topicSummaryBackendDict.url_fragment
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  getDescription(): string {
    return this.description;
  }

  getVersion(): number {
    return this.version;
  }

  getStoryTitles(): string[] {
    return this.storyTitles;
  }

  getTotalPublishedNodeCount(): number {
    return this.totalPublishedNodeCount;
  }

  getCanonicalStorySummaryDicts(): StorySummary[] {
    return this.canonicalStorySummaryDicts;
  }

  getThumbnailFilename(): string {
    return this.thumbnailFilename;
  }

  getThumbnailBgColor(): string {
    return this.thumbnailBgColor;
  }

  getClassroomName(): string {
    return this.classroomName;
  }

  getClassroomUrlFragment(): string {
    return this.classroomUrlFragment;
  }

  getPracticeTabIsDisplayed(): boolean {
    return this.practiceTabIsDisplayed;
  }

  getDegreesOfMastery(): DegreesOfMastery {
    return this.degreesOfMastery;
  }

  getSkillDescriptions(): SkillIdToDescriptionMap {
    return this.skillDescriptions;
  }

  getSubtopics(): Subtopic[] {
    return this.subtopics;
  }

  getUrlFragment(): string {
    return this.urlFragment;
  }
}
