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

import { ShortSkillSummary, ShortSkillSummaryObjectFactory } from
  'domain/skill/ShortSkillSummaryObjectFactory';
import {
  StoryReferenceBackendDict,
  StoryReference,
  StoryReferenceObjectFactory
} from 'domain/topic/StoryReferenceObjectFactory';
import {
  SkillIdToDescriptionMap,
  Subtopic,
  SubtopicBackendDict,
  SubtopicObjectFactory
} from 'domain/topic/SubtopicObjectFactory';

interface TopicBackendDict {
  'id': string;
  'name': string;
  'abbreviated_name': string;
  'description': string;
  'language_code': string;
  'uncategorized_skill_ids': string[];
  'next_subtopic_id': number;
  'version': number;
  'thumbnail_filename': string;
  'thumbnail_bg_color': string;
  'subtopics': SubtopicBackendDict[];
  'canonical_story_references': StoryReferenceBackendDict[];
  'additional_story_references': StoryReferenceBackendDict[];
  'url_fragment': string;
  'practice_tab_is_displayed': boolean;
  'meta_tag_content': string;
}

const constants = require('constants.ts');

export class Topic {
  _id: string;
  _name: string;
  _abbreviatedName: string;
  _description: string;
  _languageCode: string;
  _canonicalStoryReferences: StoryReference[];
  _additionalStoryReferences: StoryReference[];
  _uncategorizedSkillSummaries: ShortSkillSummary[];
  _nextSubtopicId: number;
  _version: number;
  _subtopics: Subtopic[];
  _thumbnailFilename: string;
  _thumbnailBgColor: string;
  _urlFragment: string;
  _practiceTabIsDisplayed: boolean;
  _metaTagContent: string;
  skillSummaryObjectFactory: ShortSkillSummaryObjectFactory;
  subtopicObjectFactory: SubtopicObjectFactory;
  storyReferenceObjectFactory: StoryReferenceObjectFactory;
  constructor(
      id: string, name: string, abbreviatedName: string, urlFragment: string,
      description: string, languageCode: string,
      canonicalStoryReferences: StoryReference[],
      additionalStoryReferences: StoryReference[],
      uncategorizedSkillIds: string[],
      nextSubtopicId: number, version: number, subtopics: Subtopic[],
      thumbnailFilename: string,
      thumbnailBgColor: string,
      skillIdToDescriptionMap: SkillIdToDescriptionMap,
      skillSummaryObjectFactory: ShortSkillSummaryObjectFactory,
      subtopicObjectFactory: SubtopicObjectFactory,
      storyReferenceObjectFactory: StoryReferenceObjectFactory,
      practiceTabIsDisplayed: boolean,
      metaTagContent: string) {
    this._id = id;
    this._name = name;
    this._abbreviatedName = abbreviatedName;
    this._urlFragment = urlFragment;
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
    this._thumbnailBgColor = thumbnailBgColor;
    this.subtopicObjectFactory = subtopicObjectFactory;
    this.storyReferenceObjectFactory = storyReferenceObjectFactory;
    this._practiceTabIsDisplayed = practiceTabIsDisplayed;
    this._metaTagContent = metaTagContent;
  }

  // ---- Instance methods ----
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

  getPracticeTabIsDisplayed(): boolean {
    return this._practiceTabIsDisplayed;
  }

  setPracticeTabIsDisplayed(practiceTabIsDisplayed: boolean): void {
    this._practiceTabIsDisplayed = practiceTabIsDisplayed;
  }

  getMetaTagContent(): string {
    return this._metaTagContent;
  }

  setMetaTagContent(metaTagContent: string): void {
    this._metaTagContent = metaTagContent;
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  setUrlFragment(urlFragment: string): void {
    this._urlFragment = urlFragment;
  }

  setThumbnailFilename(thumbnailFilename: string): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  setThumbnailBgColor(thumbnailBgColor: string): void {
    this._thumbnailBgColor = thumbnailBgColor;
  }

  getThumbnailBgColor(): string {
    return this._thumbnailBgColor;
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

  validate(): string[] {
    let validUrlFragmentRegex = new RegExp(constants.VALID_URL_FRAGMENT_REGEX);
    let topicUrlFragmentCharLimit = constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT;
    let issues = [];
    if (this._name === '') {
      issues.push('Topic name should not be empty.');
    }
    if (!validUrlFragmentRegex.test(this._urlFragment)) {
      issues.push('Topic url fragment is not valid.');
    }
    if (this._urlFragment.length > topicUrlFragmentCharLimit) {
      issues.push(
        'Topic url fragment should not be longer than ' +
        `${topicUrlFragmentCharLimit} characters.`);
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
      this._uncategorizedSkillSummaries.map((
          skillSummary: ShortSkillSummary) => {
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

  prepublishValidate(): string[] {
    const metaTagContentCharLimit = constants.MAX_CHARS_IN_META_TAG_CONTENT;
    let issues = [];
    if (!this._thumbnailFilename) {
      issues.push('Topic should have a thumbnail.');
    }
    for (let i = 0; i < this._subtopics.length; i++) {
      if (this._subtopics[i].getSkillSummaries().length === 0) {
        issues.push(
          'Subtopic with title ' + this._subtopics[i].getTitle() +
          ' does not have any skill IDs linked.');
      }
    }
    if (!this._metaTagContent) {
      issues.push('Topic should have meta tag content.');
    } else if (this._metaTagContent.length > metaTagContentCharLimit) {
      issues.push(
        'Topic meta tag content should not be longer than ' +
        `${metaTagContentCharLimit} characters.`);
    }
    if (!this._subtopics.length) {
      issues.push('Topic should have at least 1 subtopic.');
    }
    return issues;
  }

  getSkillIds(): string[] {
    let topicSkillIds = cloneDeep(
      this._uncategorizedSkillSummaries.map((
          skillSummary: ShortSkillSummary) => {
        return skillSummary.getId();
      }));

    let subtopics = this._subtopics;
    for (let i = 0; i < subtopics.length; i++) {
      topicSkillIds = topicSkillIds.concat(
        subtopics[i].getSkillSummaries().map((
            skillSummary: ShortSkillSummary) => {
          return skillSummary.getId();
        })
      );
    }
    return topicSkillIds;
  }

  getSubtopicById(subtopicId: number): Subtopic | null {
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
  deleteSubtopic(subtopicId: number, isNewlyCreated: boolean): void {
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
      throw new Error('Subtopic to delete does not exist');
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

  getSubtopics(): Subtopic[] {
    return this._subtopics.slice();
  }

  getCanonicalStoryReferences(): StoryReference[] {
    return this._canonicalStoryReferences.slice();
  }

  getCanonicalStoryIds(): string[] {
    return this._canonicalStoryReferences.map((reference: StoryReference) => {
      return reference.getStoryId();
    });
  }

  addCanonicalStory(storyId: string): void {
    let canonicalStoryIds = this.getCanonicalStoryIds();
    if (canonicalStoryIds.indexOf(storyId) !== -1) {
      throw new Error(
        'Given story id already present in canonical story ids.');
    }
    this._canonicalStoryReferences.push(
      this.storyReferenceObjectFactory.createFromStoryId(storyId));
  }

  removeCanonicalStory(storyId: string): void {
    let canonicalStoryIds = this.getCanonicalStoryIds();
    let index = canonicalStoryIds.indexOf(storyId);
    if (index === -1) {
      throw new Error(
        'Given story id not present in canonical story ids.');
    }
    this._canonicalStoryReferences.splice(index, 1);
  }

  rearrangeCanonicalStory(fromIndex: number, toIndex: number): void {
    const canonicalStoryToMove = cloneDeep(
      this._canonicalStoryReferences[fromIndex]);
    this._canonicalStoryReferences.splice(fromIndex, 1);
    this._canonicalStoryReferences.splice(toIndex, 0, canonicalStoryToMove);
  }

  rearrangeSkillInSubtopic(
      subtopicId: number, fromIndex: number, toIndex: number): void {
    const subtopic = this.getSubtopicById(subtopicId);
    const skillToMove = cloneDeep(
      subtopic.getSkillSummaries()[fromIndex]);
    subtopic._skillSummaries.splice(fromIndex, 1);
    subtopic._skillSummaries.splice(toIndex, 0, skillToMove);
  }

  rearrangeSubtopic(fromIndex: number, toIndex: number): void {
    const subtopicToMove = cloneDeep(this._subtopics[fromIndex]);
    this._subtopics.splice(fromIndex, 1);
    this._subtopics.splice(toIndex, 0, subtopicToMove);
  }

  clearCanonicalStoryReferences(): void {
    this._canonicalStoryReferences.length = 0;
  }

  getAdditionalStoryIds(): string[] {
    return this._additionalStoryReferences.map((reference: StoryReference) => {
      return reference.getStoryId();
    });
  }

  getAdditionalStoryReferences(): StoryReference[] {
    return this._additionalStoryReferences.slice();
  }

  addAdditionalStory(storyId: string): void {
    let additionalStoryIds = this.getAdditionalStoryIds();
    if (additionalStoryIds.indexOf(storyId) !== -1) {
      throw new Error(
        'Given story id already present in additional story ids.');
    }
    this._additionalStoryReferences.push(
      this.storyReferenceObjectFactory.createFromStoryId(storyId));
  }

  removeAdditionalStory(storyId: string): void {
    let additionalStoryIds = this.getAdditionalStoryIds();
    let index = additionalStoryIds.indexOf(storyId);
    if (index === -1) {
      throw new Error(
        'Given story id not present in additional story ids.');
    }
    this._additionalStoryReferences.splice(index, 1);
  }

  clearAdditionalStoryReferences(): void {
    this._additionalStoryReferences.length = 0;
  }

  hasUncategorizedSkill(skillId: string): boolean {
    return this._uncategorizedSkillSummaries.some(
      (skillSummary: ShortSkillSummary) => {
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
      throw new Error('Given skillId is already present in a subtopic.');
    }
    if (this.hasUncategorizedSkill(skillId)) {
      throw new Error('Given skillId is already an uncategorized skill.');
    }
    this._uncategorizedSkillSummaries.push(
      this.skillSummaryObjectFactory.create(skillId, skillDescription));
  }

  removeUncategorizedSkill(skillId: string): void {
    let index = this._uncategorizedSkillSummaries.map(
      (skillSummary: ShortSkillSummary) => {
        return skillSummary.getId();
      }).indexOf(skillId);
    if (index === -1) {
      throw new Error('Given skillId is not an uncategorized skill.');
    }
    this._uncategorizedSkillSummaries.splice(index, 1);
  }

  clearUncategorizedSkills(): void {
    this._uncategorizedSkillSummaries.length = 0;
  }

  getUncategorizedSkillSummaries(): ShortSkillSummary[] {
    return this._uncategorizedSkillSummaries.slice();
  }

  // Reassigns all values within this topic to match the existing
  // topic. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this topic.
  copyFromTopic(otherTopic: Topic): void {
    this._id = otherTopic.getId();
    this.setName(otherTopic.getName());
    this.setAbbreviatedName(otherTopic.getAbbreviatedName());
    this.setUrlFragment(otherTopic.getUrlFragment());
    this.setThumbnailFilename(otherTopic.getThumbnailFilename());
    this.setThumbnailBgColor(otherTopic.getThumbnailBgColor());
    this.setDescription(otherTopic.getDescription());
    this.setLanguageCode(otherTopic.getLanguageCode());
    this.setPracticeTabIsDisplayed(otherTopic.getPracticeTabIsDisplayed());
    this.setMetaTagContent(otherTopic.getMetaTagContent());
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
      private skillSummaryObjectFactory: ShortSkillSummaryObjectFactory) {}
  create(
      topicBackendDict: TopicBackendDict,
      skillIdToDescriptionDict: SkillIdToDescriptionMap): Topic {
    let subtopics = topicBackendDict.subtopics.map((
        subtopic: SubtopicBackendDict) => {
      return this.subtopicObjectFactory.create(
        subtopic, skillIdToDescriptionDict);
    });
    let canonicalStoryReferences =
        topicBackendDict.canonical_story_references.map(
          (reference: StoryReferenceBackendDict) => {
            return this.storyReferenceObjectFactory.createFromBackendDict(
              reference);
          });
    let additionalStoryReferences =
        topicBackendDict.additional_story_references.map(
          (reference: StoryReferenceBackendDict) => {
            return this.storyReferenceObjectFactory.createFromBackendDict(
              reference);
          });
    return new Topic(
      topicBackendDict.id, topicBackendDict.name,
      topicBackendDict.abbreviated_name,
      topicBackendDict.url_fragment,
      topicBackendDict.description, topicBackendDict.language_code,
      canonicalStoryReferences, additionalStoryReferences,
      topicBackendDict.uncategorized_skill_ids,
      topicBackendDict.next_subtopic_id, topicBackendDict.version,
      subtopics, topicBackendDict.thumbnail_filename,
      topicBackendDict.thumbnail_bg_color,
      skillIdToDescriptionDict, this.skillSummaryObjectFactory,
      this.subtopicObjectFactory, this.storyReferenceObjectFactory,
      topicBackendDict.practice_tab_is_displayed,
      topicBackendDict.meta_tag_content
    );
  }

  // Create an interstitial topic that would be displayed in the editor until
  // the actual topic is fetched from the backend.
  createInterstitialTopic(): Topic {
    return new Topic(
      null, 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], '', '', {},
      this.skillSummaryObjectFactory, this.subtopicObjectFactory,
      this.storyReferenceObjectFactory, false, ''
    );
  }
}

angular.module('oppia').factory(
  'TopicObjectFactory',
  downgradeInjectable(TopicObjectFactory));
