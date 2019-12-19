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
 * @fileoverview Factory for creating and mutating instances of frontend
 * topic domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { SkillSummary, SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory';
import { StoryReference, StoryReferenceObjectFactory } from
  'domain/topic/StoryReferenceObjectFactory';
import { Subtopic, SubtopicObjectFactory } from
  'domain/topic/SubtopicObjectFactory';

export class Topic {
  _id: string;
  _name: string;
  _abbreviatedName: string;
  _description: string;
  _languageCode: string;
  _canonicalStoryReferences: Array<StoryReference>;
  _additionalStoryReferences: Array<StoryReference>;
  _uncategorizedSkillSummaries: Array<SkillSummary>;
  _nextSubtopicId: number;
  _version: number;
  _subtopics: Array<Subtopic>;
  _thumbnailFilename: string;
  skillSummaryObjectFactory: SkillSummaryObjectFactory;
  subtopicObjectFactory: SubtopicObjectFactory;
  storyReferenceObjectFactory: StoryReferenceObjectFactory;
  constructor(
      id: string, name: string, abbreviatedName: string, description: string,
      languageCode: string, canonicalStoryReferences: Array<StoryReference>,
      additionalStoryReferences: Array<StoryReference>,
      uncategorizedSkillIds: Array<string>,
      nextSubtopicId: number, version: number, subtopics: Array<Subtopic>,
      thumbnailFilename: string,
      // TODO(#7165): Replace any with exact type.
      skillIdToDescriptionMap: any,
      skillSummaryObjectFactory: SkillSummaryObjectFactory,
      subtopicObjectFactory: SubtopicObjectFactory,
      storyReferenceObjectFactory: StoryReferenceObjectFactory) {
    this._id = id;
    this._name = name;
    this._abbreviatedName = abbreviatedName;
    this._description = description;
    this._languageCode = languageCode;
    this._canonicalStoryReferences = canonicalStoryReferences;
    this._additionalStoryReferences = additionalStoryReferences;
    this.skillSummaryObjectFactory = skillSummaryObjectFactory;
    this._uncategorizedSkillSummaries = uncategorizedSkillIds.map(
      (skillId: string) => {
        return this.skillSummaryObjectFactory.create(
          skillId, skillIdToDescriptionMap[skillId]);
      });
    this._nextSubtopicId = nextSubtopicId;
    this._version = version;
    this._subtopics = cloneDeep(subtopics);
    this._thumbnailFilename = thumbnailFilename;
    this.subtopicObjectFactory = subtopicObjectFactory;
    this.storyReferenceObjectFactory = storyReferenceObjectFactory;
  }

  // Instance methods
  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  setName(name: string): void {
    this._name = name;
  }

  getAbbreviatedName(): string {
    return this._abbreviatedName;
  }

  setAbbreviatedName(abbreviatedName: string): void {
    this._abbreviatedName = abbreviatedName;
  }

  setThumbnailFilename(thumbnailFilename: string): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  getDescription(): string {
    return this._description;
  }

  getNextSubtopicId(): number {
    return this._nextSubtopicId;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this._languageCode = languageCode;
  }

  getVersion(): number {
    return this._version;
  }

  validate(): Array<string> {
    let issues = [];
    if (this._name === '') {
      issues.push('Topic name should not be empty.');
    }

    if (!this._abbreviatedName) {
      issues.push('Abbreviated name should not be empty.');
    }

    let subtopics = this._subtopics;
    let canonicalStoryIds = this.getCanonicalStoryIds();
    let additionalStoryIds = this.getAdditionalStoryIds();

    for (let i = 0; i < canonicalStoryIds.length; i++) {
      let storyId = canonicalStoryIds[i];
      if (canonicalStoryIds.indexOf(storyId) <
          canonicalStoryIds.lastIndexOf(storyId)) {
        issues.push(
          'The canonical story with id ' + storyId + ' is duplicated in' +
            ' the topic.');
      }
    }
    for (let i = 0; i < additionalStoryIds.length; i++) {
      let storyId = additionalStoryIds[i];
      if (additionalStoryIds.indexOf(storyId) <
          additionalStoryIds.lastIndexOf(storyId)) {
        issues.push(
          'The additional story with id ' + storyId + ' is duplicated in' +
            ' the topic.');
      }
    }
    for (let i = 0; i < canonicalStoryIds.length; i++) {
      if (additionalStoryIds.indexOf(canonicalStoryIds[i]) !== -1) {
        issues.push(
          'The story with id ' + canonicalStoryIds[i] +
            ' is present in both canonical and additional stories.');
      }
    }
    let topicSkillIds = cloneDeep(
      this._uncategorizedSkillSummaries.map((skillSummary: SkillSummary) =>{
        return skillSummary.getId();
      }));
    for (let i = 0; i < subtopics.length; i++) {
      issues = issues.concat(subtopics[i].validate());
      let skillIds = subtopics[i].getSkillSummaries().map(
        (skillSummary) => {
          return skillSummary.getId();
        }
      );
      for (let j = 0; j < skillIds.length; j++) {
        if (topicSkillIds.indexOf(skillIds[j]) === -1) {
          topicSkillIds.push(skillIds[j]);
        } else {
          issues.push(
            'The skill with id ' + skillIds[j] +
              ' is duplicated in the topic');
        }
      }
    }
    return issues;
  }

  prepublishValidate(): Array<string> {
    let issues = [];
    if (!this._thumbnailFilename) {
      issues.push('Topic should have a thumbnail.');
    }
    return issues;
  }

  getSkillIds(): Array<string> {
    let topicSkillIds = cloneDeep(
      this._uncategorizedSkillSummaries.map((skillSummary: SkillSummary) => {
        return skillSummary.getId();
      }));

    let subtopics = this._subtopics;
    for (let i = 0; i < subtopics.length; i++) {
      topicSkillIds = topicSkillIds.concat(
        subtopics[i].getSkillSummaries().map((skillSummary: SkillSummary) => {
          return skillSummary.getId();
        })
      );
    }
    return topicSkillIds;
  }

  getSubtopicById(subtopicId: string): Subtopic | null {
    for (let i = 0; i < this._subtopics.length; i++) {
      let id = this._subtopics[i].getId();
      if (id === subtopicId) {
        return this._subtopics[i];
      }
    }
    return null;
  }

  // Adds a new frontend subtopic domain object to this topic.
  addSubtopic(title: string): void {
    let newSubtopic = this.subtopicObjectFactory.createFromTitle(
      this._nextSubtopicId, title);
    this._subtopics.push(newSubtopic);
    this._nextSubtopicId++;
  }

  // Attempts to remove a subtopic from this topic given the
  // subtopic ID.
  deleteSubtopic(subtopicId: string, isNewlyCreated: boolean): void {
    let subtopicDeleted = false;
    for (let i = 0; i < this._subtopics.length; i++) {
      if (this._subtopics[i].getId() === subtopicId) {
        // When a subtopic is deleted, all the skills in it are moved to
        // uncategorized skill ids.
        let skillSummaries = this._subtopics[i].getSkillSummaries();
        for (let j = 0; j < skillSummaries.length; j++) {
          let skillId = skillSummaries[j].getId();
          let skillDescription = skillSummaries[j].getDescription();
          if (!this.hasUncategorizedSkill(skillId)) {
            this._uncategorizedSkillSummaries.push(
              this.skillSummaryObjectFactory.create(skillId, skillDescription));
          }
        }
        this._subtopics.splice(i, 1);
        subtopicDeleted = true;
        break;
      }
    }
    if (!subtopicDeleted) {
      throw Error('Subtopic to delete does not exist');
    }
    if (isNewlyCreated) {
      for (let i = 0; i < this._subtopics.length; i++) {
        if (this._subtopics[i].getId() > subtopicId) {
          this._subtopics[i].decrementId();
        }
      }
      this._nextSubtopicId--;
    }
  }

  clearSubtopics(): void {
    this._subtopics.length = 0;
  }

  getSubtopics(): Array<Subtopic> {
    return this._subtopics.slice();
  }

  getCanonicalStoryReferences(): Array<StoryReference> {
    return this._canonicalStoryReferences.slice();
  }

  getCanonicalStoryIds(): Array<string> {
    return this._canonicalStoryReferences.map((reference: StoryReference) => {
      return reference.getStoryId();
    });
  }

  addCanonicalStory(storyId: string): void {
    let canonicalStoryIds = this.getCanonicalStoryIds();
    if (canonicalStoryIds.indexOf(storyId) !== -1) {
      throw Error(
        'Given story id already present in canonical story ids.');
    }
    this._canonicalStoryReferences.push(
      this.storyReferenceObjectFactory.createFromStoryId(storyId));
  }

  removeCanonicalStory(storyId: string): void {
    let canonicalStoryIds = this.getCanonicalStoryIds();
    let index = canonicalStoryIds.indexOf(storyId);
    if (index === -1) {
      throw Error(
        'Given story id not present in canonical story ids.');
    }
    this._canonicalStoryReferences.splice(index, 1);
  }

  clearCanonicalStoryReferences(): void {
    this._canonicalStoryReferences.length = 0;
  }

  getAdditionalStoryIds(): Array<string> {
    return this._additionalStoryReferences.map((reference: StoryReference) => {
      return reference.getStoryId();
    });
  }

  getAdditionalStoryReferences(): Array<StoryReference> {
    return this._additionalStoryReferences.slice();
  }

  addAdditionalStory(storyId: string): void {
    let additionalStoryIds = this.getAdditionalStoryIds();
    if (additionalStoryIds.indexOf(storyId) !== -1) {
      throw Error(
        'Given story id already present in additional story ids.');
    }
    this._additionalStoryReferences.push(
      this.storyReferenceObjectFactory.createFromStoryId(storyId));
  }

  removeAdditionalStory(storyId: string): void {
    let additionalStoryIds = this.getAdditionalStoryIds();
    let index = additionalStoryIds.indexOf(storyId);
    if (index === -1) {
      throw Error(
        'Given story id not present in additional story ids.');
    }
    this._additionalStoryReferences.splice(index, 1);
  }

  clearAdditionalStoryReferences(): void {
    this._additionalStoryReferences.length = 0;
  }

  hasUncategorizedSkill(skillId: string): boolean {
    return this._uncategorizedSkillSummaries.some(
      (skillSummary: SkillSummary) => {
        return skillSummary.getId() === skillId;
      });
  }

  addUncategorizedSkill(
      skillId: string, skillDescription: string): void {
    let skillIsPresentInSomeSubtopic = false;
    for (let i = 0; i < this._subtopics.length; i++) {
      if (this._subtopics[i].hasSkill(skillId)) {
        skillIsPresentInSomeSubtopic = true;
        break;
      }
    }
    if (skillIsPresentInSomeSubtopic) {
      throw Error('Given skillId is already present in a subtopic.');
    }
    if (this.hasUncategorizedSkill(skillId)) {
      throw Error('Given skillId is already an uncategorized skill.');
    }
    this._uncategorizedSkillSummaries.push(
      this.skillSummaryObjectFactory.create(skillId, skillDescription));
  }

  removeUncategorizedSkill(skillId: string): void {
    let index = this._uncategorizedSkillSummaries.map(
      (skillSummary: SkillSummary) => {
        return skillSummary.getId();
      }).indexOf(skillId);
    if (index === -1) {
      throw Error('Given skillId is not an uncategorized skill.');
    }
    this._uncategorizedSkillSummaries.splice(index, 1);
  }

  clearUncategorizedSkills(): void {
    this._uncategorizedSkillSummaries.length = 0;
  }

  getUncategorizedSkillSummaries(): Array<SkillSummary> {
    return this._uncategorizedSkillSummaries.slice();
  }

  // Reassigns all values within this topic to match the existing
  // topic. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this topic.
  copyFromTopic(otherTopic: Topic): void {
    this._id = otherTopic.getId();
    this.setName(otherTopic.getName());
    this.setAbbreviatedName(otherTopic.getAbbreviatedName());
    this.setThumbnailFilename(otherTopic.getThumbnailFilename());
    this.setDescription(otherTopic.getDescription());
    this.setLanguageCode(otherTopic.getLanguageCode());
    this._version = otherTopic.getVersion();
    this._nextSubtopicId = otherTopic.getNextSubtopicId();
    this.clearAdditionalStoryReferences();
    this.clearCanonicalStoryReferences();
    this.clearUncategorizedSkills();
    this.clearSubtopics();

    this._canonicalStoryReferences = otherTopic.getCanonicalStoryReferences();
    this._additionalStoryReferences =
        otherTopic.getAdditionalStoryReferences();

    let uncategorizedSkillSummaries =
        otherTopic.getUncategorizedSkillSummaries();
    for (let i = 0; i < uncategorizedSkillSummaries.length; i++) {
      this.addUncategorizedSkill(
        uncategorizedSkillSummaries[i].getId(),
        uncategorizedSkillSummaries[i].getDescription());
    }

    this._subtopics = cloneDeep(otherTopic.getSubtopics());
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicObjectFactory {
  constructor(
      private subtopicObjectFactory: SubtopicObjectFactory,
      private storyReferenceObjectFactory: StoryReferenceObjectFactory,
      private skillSummaryObjectFactory: SkillSummaryObjectFactory) {}
  // TODO(#7165): Replace any with exact type
  create(topicBackendDict: any, skillIdToDescriptionDict: any): Topic {
    let subtopics = topicBackendDict.subtopics.map((subtopic: Subtopic) => {
      return this.subtopicObjectFactory.create(
        subtopic, skillIdToDescriptionDict);
    });
    let canonicalStoryReferences =
        topicBackendDict.canonical_story_references.map(
          (reference: StoryReference) => {
            return this.storyReferenceObjectFactory.createFromBackendDict(
              reference);
          });
    let additionalStoryReferences =
        topicBackendDict.additional_story_references.map(
          (reference: StoryReference) => {
            return this.storyReferenceObjectFactory.createFromBackendDict(
              reference);
          });
    return new Topic(
      topicBackendDict.id, topicBackendDict.name,
      topicBackendDict.abbreviated_name,
      topicBackendDict.description, topicBackendDict.language_code,
      canonicalStoryReferences, additionalStoryReferences,
      topicBackendDict.uncategorized_skill_ids,
      topicBackendDict.next_subtopic_id, topicBackendDict.version,
      subtopics, topicBackendDict.thumbnail_filename,
      skillIdToDescriptionDict, this.skillSummaryObjectFactory,
      this.subtopicObjectFactory, this.storyReferenceObjectFactory
    );
  }

  // Create an interstitial topic that would be displayed in the editor until
  // the actual topic is fetched from the backend.
  createInterstitialTopic(): Topic {
    return new Topic(
      null, 'Topic name loading', 'Topic abbreviated name loading',
      'Topic description loading', 'en', [], [], [], 1, 1, [], '', {},
      this.skillSummaryObjectFactory, this.subtopicObjectFactory,
      this.storyReferenceObjectFactory
    );
  }
}

angular.module('oppia').factory(
  'TopicObjectFactory',
  downgradeInjectable(TopicObjectFactory));
