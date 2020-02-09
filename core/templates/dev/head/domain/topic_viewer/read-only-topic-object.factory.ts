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
* topic data domain objects.
*/

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SkillSummary, SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory';
import { StoryReference, StoryReferenceObjectFactory } from
  'domain/topic/StoryReferenceObjectFactory';
import { StorySummary } from
  'domain/story/StorySummaryObjectFactory';
import { Subtopic, SubtopicObjectFactory } from
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
  _canonicalStories: Array<StorySummary>;
  _additionalStories: Array<StorySummary>;
  _uncategorizedSkills: Array<SkillSummary>;
  _subtopics: Array<Subtopic>;
  _degreesOfMastery: IDegreesOfMastery;
  _skillDescriptions: ISkillDescriptions;

  constructor(topicName: string, topicId: string,
      canonicalStories: Array<StorySummary>,
      additionalStories: Array<StorySummary>,
      uncategorizedSkills: Array<SkillSummary>, subtopics: Array<Subtopic>,
      degreesOfMastery: IDegreesOfMastery,
      skillDescriptions: ISkillDescriptions) {
    this._topicName = topicName;
    this._topicId = topicId;
    this._canonicalStories = canonicalStories;
    this._additionalStories = additionalStories;
    this._uncategorizedSkills = uncategorizedSkills;
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

  getCanonicalStories(): Array<StorySummary> {
    return this._canonicalStories.slice();
  }

  getAdditionalStories(): Array<StorySummary> {
    return this._additionalStories.slice();
  }

  getUncategorizedSkills(): Array<SkillSummary> {
    return this._uncategorizedSkills.slice();
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

  getStorySummaryArray(storyDicts: any): Array<StorySummary> {
    var storyReferenceObjectFactory = new StoryReferenceObjectFactory();
    let storySummaryArray: Array<StorySummary> =
    storyDicts.map((storyDict: any) => {
      return new StorySummary( storyDict.id, storyDict.title,
        storyDict.node_count, storyDict.description,
        storyReferenceObjectFactory.createFromStoryId(storyDict.id).
          isStoryPublished());
    });
    return storySummaryArray;
  }

  createFromBackendDict(topicDataDict: any): ReadOnlyTopic {
    let storyReferenceObjectFactory = new StoryReferenceObjectFactory();
    let subtopics: Array<Subtopic> =
    topicDataDict.subtopics.map((subtopic: Subtopic) => {
      return this._subtopicObjectFactory.create(
        subtopic, topicDataDict.skill_descriptions);
    });
    let uncategorizedSkills: Array<SkillSummary> =
    topicDataDict.uncategorized_skill_ids.map((skillId: string) => {
      return this._skillSummaryObjectFactory.create(
        skillId, topicDataDict.skill_descriptions[skillId]);
    });
    let degreesOfMastery: IDegreesOfMastery = topicDataDict.degrees_of_mastery;
    let skillDescriptions: ISkillDescriptions =
      topicDataDict.skill_descriptions;
    let canonicalStories: Array<StorySummary> = this.getStorySummaryArray(
      topicDataDict.canonical_story_dicts);
    let additionalStories: Array<StorySummary> = this.getStorySummaryArray(
      topicDataDict.additional_story_dicts);

    return new ReadOnlyTopic(
      topicDataDict.topic_name, topicDataDict.topic_id, canonicalStories,
      additionalStories, uncategorizedSkills, subtopics, degreesOfMastery,
      skillDescriptions);
  }
}

angular.module('oppia').factory(
  'ReadOnlyTopicObjectFactory',
  downgradeInjectable(ReadOnlyTopicObjectFactory));
