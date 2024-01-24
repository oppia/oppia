// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend model for exploration opportunity summary.
 */

export interface TranslationCountsDict {
  [languageCode: string]: number;
}

export interface ExplorationOpportunitySummaryBackendDict {
  'id': string;
  'topic_name': string;
  'story_title': string;
  'chapter_title': string;
  'content_count': number;
  'translation_counts': TranslationCountsDict;
  'translation_in_review_counts': TranslationCountsDict;
  'language_code': string;
  'is_pinned': boolean;
}

export class ExplorationOpportunitySummary {
  id: string;
  topicName: string;
  storyTitle: string;
  chapterTitle: string;
  contentCount: number;
  translationCounts: TranslationCountsDict;
  translationInReviewCount: TranslationCountsDict;
  languageCode: string;
  isPinned: boolean;

  constructor(
      expId: string, topicName: string, storyTitle: string,
      chapterTitle: string, contentCount: number,
      translationCounts: TranslationCountsDict,
      translationInReviewCount: TranslationCountsDict,
      languageCode: string, isPinned: boolean) {
    this.id = expId;
    this.topicName = topicName;
    this.storyTitle = storyTitle;
    this.chapterTitle = chapterTitle;
    this.contentCount = contentCount;
    this.translationCounts = translationCounts;
    this.translationInReviewCount = translationInReviewCount;
    this.languageCode = languageCode;
    this.isPinned = isPinned;
  }

  static createFromBackendDict(
      backendDict: ExplorationOpportunitySummaryBackendDict):
      ExplorationOpportunitySummary {
    return new ExplorationOpportunitySummary(
      backendDict.id, backendDict.topic_name, backendDict.story_title,
      backendDict.chapter_title, backendDict.content_count,
      backendDict.translation_counts, backendDict.translation_in_review_counts,
      backendDict.language_code, backendDict.is_pinned);
  }

  getExplorationId(): string {
    return this.id;
  }

  getOpportunityHeading(): string {
    return this.chapterTitle;
  }

  getOpportunitySubheading(): string {
    return (this.topicName + ' - ' + this.storyTitle);
  }

  getContentCount(): number {
    return this.contentCount;
  }

  getTranslationProgressPercentage(languageCode: string): number {
    let progressPercentage = 0;
    if (this.translationCounts.hasOwnProperty(languageCode) && (
      this.contentCount > 0)) {
      progressPercentage = (
        (this.translationCounts[languageCode] / this.contentCount) * 100);
    }
    return progressPercentage;
  }

  getTranslationsInReviewCount(languageCode: string): number {
    let inReviewCount = 0;
    if (this.translationInReviewCount.hasOwnProperty(languageCode)) {
      inReviewCount = (
        this.translationInReviewCount[languageCode]);
    }
    return inReviewCount;
  }

  getTranslationsCount(languageCode: string): number {
    let translationsCount = 0;
    if (this.translationCounts.hasOwnProperty(languageCode) && (
      this.contentCount > 0)) {
      translationsCount = (
        this.translationCounts[languageCode]);
    }
    return translationsCount;
  }
}
