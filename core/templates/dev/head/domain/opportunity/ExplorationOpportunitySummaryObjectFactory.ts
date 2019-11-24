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
 * @fileoverview Object factory for creating frontend instances of
 * exploration opportunity summary domain object.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface ITranslationCountsDict {
  [languageCode: string]: number
}

export class ExplorationOpportunitySummary {
  id: string;
  topicName: string;
  storyTitle: string;
  chapterTitle: string;
  contentCount: number;
  translationCounts: ITranslationCountsDict;

  constructor(
      expId: string, topicName: string, storyTitle: string,
      chapterTitle: string, contentCount: number,
      translationCounts: ITranslationCountsDict) {
    this.id = expId;
    this.topicName = topicName;
    this.storyTitle = storyTitle;
    this.chapterTitle = chapterTitle;
    this.contentCount = contentCount;
    this.translationCounts = translationCounts;
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
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationOpportunitySummaryObjectFactory {
  createFromBackendDict(backendDict: any): ExplorationOpportunitySummary {
    return new ExplorationOpportunitySummary(
      backendDict.id, backendDict.topic_name, backendDict.story_title,
      backendDict.chapter_title, backendDict.content_count,
      backendDict.translation_counts);
  }
}

angular.module('oppia').factory(
  'ExplorationOpportunitySummaryObjectFactory',
  downgradeInjectable(ExplorationOpportunitySummaryObjectFactory));
