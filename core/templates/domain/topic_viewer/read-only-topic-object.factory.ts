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
 * @fileoverview Factory for creating instances of ReadOnlyTopic from
 * topic data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ShortSkillSummary, ShortSkillSummaryObjectFactory } from
  'domain/skill/ShortSkillSummaryObjectFactory';
import { StorySummaryBackendDict, StorySummary } from
  'domain/story/StorySummaryObjectFactory';
import {
  SkillIdToDescriptionMap,
  SubtopicBackendDict,
  Subtopic,
  SubtopicObjectFactory
} from 'domain/topic/SubtopicObjectFactory';

export interface DegreesOfMastery {
  [skillId: string]: number | null;
}

export interface ReadOnlyTopicBackendDict {
  'subtopics': SubtopicBackendDict[];
  'skill_descriptions': SkillIdToDescriptionMap;
  'uncategorized_skill_ids': string[];
  'degrees_of_mastery': DegreesOfMastery;
  'canonical_story_dicts': StorySummaryBackendDict[];
  'additional_story_dicts': StorySummaryBackendDict[];
  'topic_name': string;
  'topic_id': string;
  'topic_description': string;
  'train_tab_should_be_displayed': boolean;
}

export class ReadOnlyTopic {
  _topicName: string;
  _topicId: string;
  _topicDescription: string;
  _canonicalStorySummaries: StorySummary[];
  _additionalStorySummaries: StorySummary[];
  _uncategorizedSkillSummaries: ShortSkillSummary[];
  _subtopics: Subtopic[];
  _degreesOfMastery: DegreesOfMastery;
  _skillDescriptions: SkillIdToDescriptionMap;
  _trainTabShouldBeDisplayed: boolean;

  constructor(
      topicName: string, topicId: string, topicDescription: string,
      canonicalStorySummaries: StorySummary[],
      additionalStorySummaries: StorySummary[],
      uncategorizedSkillSummaries: ShortSkillSummary[],
      subtopics: Subtopic[],
      degreesOfMastery: DegreesOfMastery,
      skillDescriptions: SkillIdToDescriptionMap,
      trainTabShouldBeDisplayed: boolean) {
    this._topicName = topicName;
    this._topicId = topicId;
    this._topicDescription = topicDescription;
    this._canonicalStorySummaries = canonicalStorySummaries;
    this._additionalStorySummaries = additionalStorySummaries;
    this._uncategorizedSkillSummaries = uncategorizedSkillSummaries;
    this._subtopics = subtopics;
    this._degreesOfMastery = degreesOfMastery;
    this._skillDescriptions = skillDescriptions;
    this._trainTabShouldBeDisplayed = trainTabShouldBeDisplayed;
  }

  getTopicName(): string {
    return this._topicName;
  }

  getTopicDescription(): string {
    return this._topicDescription;
  }

  getTopicId(): string {
    return this._topicId;
  }

  getCanonicalStorySummaries(): StorySummary[] {
    return this._canonicalStorySummaries.slice();
  }

  getAdditionalStorySummaries(): StorySummary[] {
    return this._additionalStorySummaries.slice();
  }

  getUncategorizedSkillsSummaries(): ShortSkillSummary[] {
    return this._uncategorizedSkillSummaries.slice();
  }

  getSubtopics(): Subtopic[] {
    return this._subtopics.slice();
  }

  getDegreesOfMastery(): DegreesOfMastery {
    return this._degreesOfMastery;
  }

  getSkillDescriptions(): SkillIdToDescriptionMap {
    return this._skillDescriptions;
  }

  getTrainTabShouldBeDisplayed(): boolean {
    return this._trainTabShouldBeDisplayed;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyTopicObjectFactory {
  constructor(
    private subtopicObjectFactory: SubtopicObjectFactory,
    private skillSummaryObjectFactory: ShortSkillSummaryObjectFactory) {}

  createFromBackendDict(
      topicDataDict: ReadOnlyTopicBackendDict): ReadOnlyTopic {
    let subtopics = topicDataDict.subtopics.map(subtopic => {
      return this.subtopicObjectFactory.create(
        subtopic, topicDataDict.skill_descriptions);
    });
    let uncategorizedSkills =
        topicDataDict.uncategorized_skill_ids.map(skillId => {
          return this.skillSummaryObjectFactory.create(
            skillId, topicDataDict.skill_descriptions[skillId]);
        });
    let degreesOfMastery: DegreesOfMastery = topicDataDict.degrees_of_mastery;
    let skillDescriptions: SkillIdToDescriptionMap =
        topicDataDict.skill_descriptions;
    let canonicalStories =
        topicDataDict.canonical_story_dicts.map(storyDict => {
          return new StorySummary(
            storyDict.id, storyDict.title, storyDict.node_titles,
            storyDict.thumbnail_filename, storyDict.thumbnail_bg_color,
            storyDict.description, true, storyDict.completed_node_titles,
            storyDict.url_fragment);
        });
    let additionalStories =
        topicDataDict.additional_story_dicts.map(storyDict => {
          return new StorySummary(
            storyDict.id, storyDict.title, storyDict.node_titles,
            storyDict.thumbnail_filename, storyDict.thumbnail_bg_color,
            storyDict.description, true, storyDict.completed_node_titles,
            storyDict.url_fragment);
        });
    return new ReadOnlyTopic(
      topicDataDict.topic_name, topicDataDict.topic_id,
      topicDataDict.topic_description, canonicalStories,
      additionalStories, uncategorizedSkills, subtopics, degreesOfMastery,
      skillDescriptions, topicDataDict.train_tab_should_be_displayed);
  }
}

angular.module('oppia').factory(
  'ReadOnlyTopicObjectFactory',
  downgradeInjectable(ReadOnlyTopicObjectFactory));
