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
 * @fileoverview Frontend Model for topic summary.
 */

export interface TopicSummaryBackendDict {
  'id': string;
  'name': string;
  'language_code': string;
  'description': string;
  'version': number;
  'canonical_story_count': number;
  'additional_story_count': number;
  'subtopic_count': number;
  'total_skill_count': number;
  'uncategorized_skill_count': number;
  'thumbnail_filename': string;
  'thumbnail_bg_color': string;
  'topic_model_created_on': number;
  'topic_model_last_updated': number;
  // These properties are optional because they are only present in the
  // topic summary dict of topic dashboard page.
  'can_edit_topic'?: boolean;
  'is_published'?: boolean;
  'classroom'?: string;
  'url_fragment': string;
}

export class TopicSummary {
  constructor(
      public id: string,
      public name: string,
      public canonicalStoryCount: number,
      public subtopicCount: number,
      public totalSkillCount: number,
      public uncategorizedSkillCount: number,
      public languageCode: string,
      public description: string,
      public version: number,
      public additionalStoryCount: number,
      public topicModelCreatedOn: number,
      public topicModelLastUpdated: number,
      public canEditTopic: boolean,
      public isPublished: boolean,
      public classroom: string,
      public thumbnailFilename: string,
      public thumbnailBgColor: string,
      public urlFragment: string) { }

  static createFromBackendDict(
      topicSummaryBackendDict: TopicSummaryBackendDict): TopicSummary {
    return new TopicSummary(
      topicSummaryBackendDict.id,
      topicSummaryBackendDict.name,
      topicSummaryBackendDict.canonical_story_count,
      topicSummaryBackendDict.subtopic_count,
      topicSummaryBackendDict.total_skill_count,
      topicSummaryBackendDict.uncategorized_skill_count,
      topicSummaryBackendDict.language_code,
      topicSummaryBackendDict.description,
      topicSummaryBackendDict.version,
      topicSummaryBackendDict.additional_story_count,
      topicSummaryBackendDict.topic_model_created_on,
      topicSummaryBackendDict.topic_model_last_updated,
      topicSummaryBackendDict.can_edit_topic,
      topicSummaryBackendDict.is_published,
      topicSummaryBackendDict.classroom,
      topicSummaryBackendDict.thumbnail_filename,
      topicSummaryBackendDict.thumbnail_bg_color,
      topicSummaryBackendDict.url_fragment);
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

  getClassroom(): string {
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
}
