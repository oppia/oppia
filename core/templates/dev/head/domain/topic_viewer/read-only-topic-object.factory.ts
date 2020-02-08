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
import { Subtopic, SubtopicObjectFactory } from
  'domain/topic/SubtopicObjectFactory';

export interface ISkillDescriptions {
  [skill_id: string]: string | null  ;
}

export interface IDegreesOfMastery {
  [skill_id: string]: number | null;
}

export class ReadOnlyTopic {
  _topicName: string;
  _topicId: string;
  _canonicalStories: any;
  _additionalStories: any;
  _uncategorizedSkills: Array<SkillSummary>;
  _subtopics: Array<Subtopic>;
  _degreesOfMastery: IDegreesOfMastery;
  _skillDescriptions: ISkillDescriptions;

  constructor(topicName: string, topicId: string, canonicalStories: any,
      additionalStories: any, uncategorizedSkills: Array<SkillSummary>,
      subtopics: Array<Subtopic>, degreesOfMastery: IDegreesOfMastery,
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

  getCanonicalStories(): any {
    return this._canonicalStories.slice();
  }

  getAdditionalStories(): any {
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

  createFromBackendDict(topicDataDict: any): ReadOnlyTopic {
    let subtopics = topicDataDict.subtopics.map((subtopic: Subtopic) => {
      return this._subtopicObjectFactory.create(
        subtopic, topicDataDict.skill_descriptions);
    });
    let uncategorizedSkills =
    topicDataDict.uncategorized_skill_ids.map((skillId: string) => {
      return this._skillSummaryObjectFactory.create(
        skillId, topicDataDict.skill_descriptions[skillId]);
    });
    let degreesOfMastery: IDegreesOfMastery = topicDataDict.degrees_of_mastery;
    let skillDescriptions: ISkillDescriptions = topicDataDict.skill_descriptions;

    return new ReadOnlyTopic(
      topicDataDict.topic_name, topicDataDict.topic_id,
      topicDataDict.canonical_story_dicts, topicDataDict.additional_story_dicts,
      uncategorizedSkills, subtopics, degreesOfMastery, skillDescriptions);
  }
}

angular.module('oppia').factory(
  'ReadOnlyTopicObjectFactory',
  downgradeInjectable(ReadOnlyTopicObjectFactory));
