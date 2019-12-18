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
 * @fileoverview Factory for creating instances of frontend
 * topic summary domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

class TopicSummary {
  _id: string;
  _name: string;
  _canonicalStoryCount: number;
  _subtopicCount: number;
  _totalSkillCount: number;
  _uncategorizedSkillCount: number;

  constructor(id, name, canonicalStoryCount, subtopicCount, totalSkillCount,
      uncategorizedSkillCount) {
    this._id = id;
    this._name = name;
    this._canonicalStoryCount = canonicalStoryCount;
    this._totalSkillCount = totalSkillCount;
    this._uncategorizedSkillCount = uncategorizedSkillCount;
    this._subtopicCount = subtopicCount;
  }
  // Instance methods

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getCanonicalStoryCount(): number {
    return this._canonicalStoryCount;
  }

  getSubtopicCount(): number {
    return this._subtopicCount;
  }

  getTotalSkillCount(): number {
    return this._totalSkillCount;
  }

  getUncategorizedSkillCount(): number {
    return this._uncategorizedSkillCount;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicSummaryObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'topicSummaryBackendDict' is a dict with  underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(topicSummaryBackendDict: any): TopicSummary {
    return new TopicSummary(
      topicSummaryBackendDict.id,
      topicSummaryBackendDict.name,
      topicSummaryBackendDict.canonical_story_count,
      topicSummaryBackendDict.subtopic_count,
      topicSummaryBackendDict.total_skill_count,
      topicSummaryBackendDict.uncategorized_skill_count
    );
  }
}

angular.module('oppia').factory(
  'TopicSummaryObjectFactory',
  downgradeInjectable(TopicSummaryObjectFactory));
