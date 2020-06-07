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

import { SkillSummary, SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory';
import { StorySummary } from 'domain/story/StorySummaryObjectFactory';
import { ISubtopicBackendDict, Subtopic, SubtopicObjectFactory } from
  'domain/topic/SubtopicObjectFactory';

export interface ISkillDescriptions {
  [skillId: string]: string | null;
}

export interface IDegreesOfMastery {
  [skillId: string]: number | null;
}

export class ReadOnlyTopic {
  _topicName: string;
  _topicId: string;
  _topicDescription: string;
  _canonicalStorySummaries: Array<StorySummary>;
  _additionalStorySummaries: Array<StorySummary>;
  _uncategorizedSkillSummaries: Array<SkillSummary>;
  _subtopics: Array<Subtopic>;
  _degreesOfMastery: IDegreesOfMastery;
  _skillDescriptions: ISkillDescriptions;
  _trainTabShouldBeDisplayed: boolean;

  constructor(
      topicName: string, topicId: string, topicDescription: string,
      canonicalStorySummaries: Array<StorySummary>,
      additionalStorySummaries: Array<StorySummary>,
      uncategorizedSkillSummaries: Array<SkillSummary>,
      subtopics: Array<Subtopic>,
      degreesOfMastery: IDegreesOfMastery,
      skillDescriptions: ISkillDescriptions,
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

  getCanonicalStorySummaries(): Array<StorySummary> {
    return this._canonicalStorySummaries.slice();
  }

  getAdditionalStorySummaries(): Array<StorySummary> {
    return this._additionalStorySummaries.slice();
  }

  getUncategorizedSkillsSummaries(): Array<SkillSummary> {
    return this._uncategorizedSkillSummaries.slice();
  }

  getSubtopics(): Array<Subtopic> {
    return this._subtopics.slice();
  }

  getDegreesOfMastery(): IDegreesOfMastery {
    return this._degreesOfMastery;
  }

  getSkillDescriptions(): ISkillDescriptions {
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
  _subtopicObjectFactory: SubtopicObjectFactory;
  _skillSummaryObjectFactory: SkillSummaryObjectFactory;

  constructor(
    private subtopicObjectFactory: SubtopicObjectFactory,
    private skillSummaryObjectFactory: SkillSummaryObjectFactory) {
    this._subtopicObjectFactory = subtopicObjectFactory;
    this._skillSummaryObjectFactory = skillSummaryObjectFactory;
  }
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'topicDataDict' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  createFromBackendDict(topicDataDict: any): ReadOnlyTopic {
    let subtopics: Array<Subtopic> = topicDataDict.subtopics.map(
      (subtopic: ISubtopicBackendDict) => {
        return this._subtopicObjectFactory.create(
          subtopic, topicDataDict.skill_descriptions);
      });
    let uncategorizedSkills: Array<SkillSummary> =
        topicDataDict.uncategorized_skill_ids.map(
          (skillId: string) => {
            return this._skillSummaryObjectFactory.create(
              skillId, topicDataDict.skill_descriptions[skillId]);
          });
    let degreesOfMastery: IDegreesOfMastery = topicDataDict.degrees_of_mastery;
    let skillDescriptions: ISkillDescriptions =
        topicDataDict.skill_descriptions;
    let canonicalStories: Array<StorySummary> =
        topicDataDict.canonical_story_dicts.map(
          (storyDict: any) => {
            return new StorySummary(
              storyDict.id, storyDict.title, storyDict.node_titles,
              storyDict.thumbnail_filename, storyDict.thumbnail_bg_color,
              storyDict.description, true);
          });
    let additionalStories: Array<StorySummary> =
        topicDataDict.additional_story_dicts.map(
          (storyDict: any) => {
            return new StorySummary(
              storyDict.id, storyDict.title, storyDict.node_titles,
              storyDict.thumbnail_filename, storyDict.thumbnail_bg_color,
              storyDict.description, true);
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
