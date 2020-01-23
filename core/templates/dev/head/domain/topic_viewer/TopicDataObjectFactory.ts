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
 * @fileoverview Factory for creating instances of frontend topic-data domain
 * objects.
 */

export class TopicData {
  _topicName: string;
  _topicId: string;
  _canonicalStories: any;
  _additionalStories: any;
  _uncategorizedSkillIds: Array<string>;
  _subtopics: any;
  _degreesOfMastery: any;
  _skillDescriptions:any;

  constructor(topicName: string, topicId: string, canonicalStory: any,
      additionalStory: any, uncategorizedSkillIds: Array<string>,
      subtopics: any, degreesOfMastery: any, skillDescriptions: any) {
    this._topicName = topicName;
    this._topicId = topicId;
    this._canonicalStories = canonicalStory;
    this._additionalStories = additionalStory;
    this._uncategorizedSkillIds = uncategorizedSkillIds;
    this._subtopics = subtopics;
    this._degreesOfMastery = degreesOfMastery;
    this._skillDescriptions = skillDescriptions;
  }

  getTopicName(): string {
    return this._topicName;
  }

  getTopicId(): string {
    return this._topicId;
  }

  getCanonicalStories(): any {
    return this._canonicalStories;
  }

  getAdditionalStories(): any {
    return this._additionalStories;
  }

  getUncategorizedSkillIds(): Array<string> {
    return this._uncategorizedSkillIds;
  }

  getSubtopics(): any {
    return this._subtopics;
  }

  getDegreesOfMastery(): any {
    return this._degreesOfMastery;
  }

  getSkillDescriptions(): any {
    return this._skillDescriptions;
  }
}

export class TopicDataObjectFactory {
  createFromBackendDict(topicDataDict: any): TopicData {
    return new TopicData(
      topicDataDict.topic_name, topicDataDict.topic_id,
      topicDataDict.canonical_story_dicts,
      topicDataDict.additional_story_dicts,
      topicDataDict.uncategorized_skill_ids, topicDataDict.subtopics,
      topicDataDict.degrees_of_mastery, topicDataDict.skill_descriptions
    );
  }
}
