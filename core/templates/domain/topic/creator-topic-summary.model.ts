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
 * @fileoverview Frontend Model for creator topic summary.
 */

export interface CreatorTopicSummaryBackendDict {
  id: string;
  name: string;
  language_code: string;
  description: string;
  version: number;
  canonical_story_count: number;
  additional_story_count: number;
  subtopic_count: number;
  total_skill_count: number;
  total_published_node_count: number;
  uncategorized_skill_count: number;
  thumbnail_filename: string;
  thumbnail_bg_color: string;
  topic_model_created_on: number;
  topic_model_last_updated: number;
  can_edit_topic: boolean;
  is_published: boolean;
  total_upcoming_chapters_count: number;
  total_overdue_chapters_count: number;
  total_chapter_counts_for_each_story: number[];
  published_chapter_counts_for_each_story: number[];
  url_fragment: string;
  // This property is optional because it is only present in the
  // topic summary dict of topic dashboard page.
  classroom?: string | null;
}

export class CreatorTopicSummary {
  constructor(
    public id: string,
    public name: string,
    public canonicalStoryCount: number,
    public subtopicCount: number,
    public totalSkillCount: number,
    public totalPublishedNodeCount: number,
    public uncategorizedSkillCount: number,
    public languageCode: string,
    public description: string,
    public version: number,
    public additionalStoryCount: number,
    public topicModelCreatedOn: number,
    public topicModelLastUpdated: number,
    public canEditTopic: boolean,
    public isPublished: boolean,
    public classroom: string | null,
    public thumbnailFilename: string,
    public thumbnailBgColor: string,
    public urlFragment: string,
    public totalUpcomingChaptersCount: number,
    public totalOverdueChaptersCount: number,
    public totalChaptersCounts: number[],
    public publishedChaptersCounts: number[]
  ) {}

  static createFromBackendDict(
    topicSummaryBackendDict: CreatorTopicSummaryBackendDict
  ): CreatorTopicSummary {
    return new CreatorTopicSummary(
      topicSummaryBackendDict.id,
      topicSummaryBackendDict.name,
      topicSummaryBackendDict.canonical_story_count,
      topicSummaryBackendDict.subtopic_count,
      topicSummaryBackendDict.total_skill_count,
      topicSummaryBackendDict.total_published_node_count,
      topicSummaryBackendDict.uncategorized_skill_count,
      topicSummaryBackendDict.language_code,
      topicSummaryBackendDict.description,
      topicSummaryBackendDict.version,
      topicSummaryBackendDict.additional_story_count,
      topicSummaryBackendDict.topic_model_created_on,
      topicSummaryBackendDict.topic_model_last_updated,
      topicSummaryBackendDict.can_edit_topic,
      topicSummaryBackendDict.is_published,
      topicSummaryBackendDict.classroom ?? null,
      topicSummaryBackendDict.thumbnail_filename,
      topicSummaryBackendDict.thumbnail_bg_color,
      topicSummaryBackendDict.url_fragment,
      topicSummaryBackendDict.total_upcoming_chapters_count,
      topicSummaryBackendDict.total_overdue_chapters_count,
      topicSummaryBackendDict.total_chapter_counts_for_each_story,
      topicSummaryBackendDict.published_chapter_counts_for_each_story
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCanonicalStoryCount(): number {
    return this.canonicalStoryCount;
  }

  getSubtopicCount(): number {
    return this.subtopicCount;
  }

  getTotalSkillCount(): number {
    return this.totalSkillCount;
  }

  getTotalPublishedNodeCount(): number {
    return this.totalPublishedNodeCount;
  }

  getUncategorizedSkillCount(): number {
    return this.uncategorizedSkillCount;
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

  getAdditionalStoryCount(): number {
    return this.additionalStoryCount;
  }

  getTopicModelCreatedOn(): number {
    return this.topicModelCreatedOn;
  }

  getTopicModelLastUpdated(): number {
    return this.topicModelLastUpdated;
  }

  getClassroom(): string | null {
    return this.classroom;
  }

  getUrlFragment(): string {
    return this.urlFragment;
  }

  getThumbnailFilename(): string {
    return this.thumbnailFilename;
  }

  getThumbnailBgColor(): string {
    return this.thumbnailBgColor;
  }

  isTopicPublished(): boolean {
    return this.isPublished;
  }

  getTotalUpcomingChaptersCount(): number {
    return this.totalUpcomingChaptersCount;
  }

  getTotalOverdueChaptersCount(): number {
    return this.totalOverdueChaptersCount;
  }

  getTotalChaptersCounts(): number[] {
    return this.totalChaptersCounts;
  }

  getPublishedChaptersCounts(): number[] {
    return this.publishedChaptersCounts;
  }
}
