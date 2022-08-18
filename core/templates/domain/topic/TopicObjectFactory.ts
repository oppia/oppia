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

import { ShortSkillSummary } from
  'domain/skill/short-skill-summary.model';
import {
  StoryReferenceBackendDict,
  StoryReference,
} from 'domain/topic/story-reference-object.model';
import {
  SkillIdToDescriptionMap,
  Subtopic,
  SubtopicBackendDict,
} from 'domain/topic/subtopic.model';

export interface TopicBackendDict {
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
  'page_title_fragment_for_web': string;
  'skill_ids_for_diagnostic_test': string[];
}

import constants from 'assets/constants';

export class Topic {
  // The 'id' and 'thumbnailFilename' is 'null' for an interstitial
  // topic until the actual is fetched from the backend.
  _id: string | null;
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
  _thumbnailFilename: string | null;
  _thumbnailBgColor: string;
  _urlFragment: string;
  _practiceTabIsDisplayed: boolean;
  _metaTagContent: string;
  _pageTitleFragmentForWeb: string;
  _skillSummariesForDiagnosticTest: ShortSkillSummary[];
  constructor(
      id: string | null,
      name: string,
      abbreviatedName: string,
      urlFragment: string,
      description: string,
      languageCode: string,
      canonicalStoryReferences: StoryReference[],
      additionalStoryReferences: StoryReference[],
      uncategorizedSkillIds: string[],
      nextSubtopicId: number,
      version: number,
      subtopics: Subtopic[],
      thumbnailFilename: string | null,
      thumbnailBgColor: string,
      skillIdToDescriptionMap: SkillIdToDescriptionMap,
      practiceTabIsDisplayed: boolean,
      metaTagContent: string,
      pageTitleFragmentForWeb: string,
      skillIdsForDiagnosticTest: string[]
  ) {
    this._id = id;
    this._name = name;
    this._abbreviatedName = abbreviatedName;
    this._urlFragment = urlFragment;
    this._description = description;
    this._languageCode = languageCode;
    this._canonicalStoryReferences = canonicalStoryReferences;
    this._additionalStoryReferences = additionalStoryReferences;
    this._uncategorizedSkillSummaries = uncategorizedSkillIds.map(
      (skillId: string) => {
        return ShortSkillSummary.create(
          skillId, skillIdToDescriptionMap[skillId]);
      });
    this._nextSubtopicId = nextSubtopicId;
    this._version = version;
    this._subtopics = cloneDeep(subtopics);
    this._thumbnailFilename = thumbnailFilename;
    this._thumbnailBgColor = thumbnailBgColor;
    this._practiceTabIsDisplayed = practiceTabIsDisplayed;
    this._metaTagContent = metaTagContent;
    this._pageTitleFragmentForWeb = pageTitleFragmentForWeb;
    this._skillSummariesForDiagnosticTest = skillIdsForDiagnosticTest.map(
      (skillId: string) => {
        return ShortSkillSummary.create(
          skillId, skillIdToDescriptionMap[skillId]);
      });
  }

  // Returns 'null' when the topic is not yet fetched from the backend,
  // not saved.
  getId(): string | null {
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

  getPageTitleFragmentForWeb(): string {
    return this._pageTitleFragmentForWeb;
  }

  setPageTitleFragmentForWeb(pageTitleFragmentForWeb: string): void {
    this._pageTitleFragmentForWeb = pageTitleFragmentForWeb;
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  setUrlFragment(urlFragment: string): void {
    this._urlFragment = urlFragment;
  }

  setThumbnailFilename(thumbnailFilename: string | null): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailFilename(): string | null {
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
    if (this._skillSummariesForDiagnosticTest.length > 3) {
      issues.push(
        'The diagnostic test for the topic should test at most 3 skills.');
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
    const pageTitleFragForWebCharMaxLimit = (
      constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB);
    const pageTitleFragForWebCharMinLimit = (
      constants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB);
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
    let pageTitleFragForWebNumChars = this._pageTitleFragmentForWeb.length;
    if (!this._pageTitleFragmentForWeb) {
      issues.push('Topic should have page title fragment.');
    } else if (pageTitleFragForWebNumChars > pageTitleFragForWebCharMaxLimit) {
      issues.push(
        'Topic page title fragment should not be longer than ' +
        `${constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB} characters.`);
    } else if (pageTitleFragForWebNumChars < pageTitleFragForWebCharMinLimit) {
      issues.push(
        'Topic page title fragment should not be shorter than ' +
        `${constants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB} characters.`);
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
    if (this._skillSummariesForDiagnosticTest.length === 0) {
      issues.push(
        'The diagnostic test for the topic should test at least one skill.');
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
    let newSubtopic = Subtopic.createFromTitle(
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
              ShortSkillSummary.create(skillId, skillDescription));
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
      StoryReference.createFromStoryId(storyId));
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
    if (subtopic !== null) {
      const skillToMove = cloneDeep(subtopic.getSkillSummaries()[fromIndex]);
      subtopic._skillSummaries.splice(fromIndex, 1);
      subtopic._skillSummaries.splice(toIndex, 0, skillToMove);
    }
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
      StoryReference.createFromStoryId(storyId));
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
      ShortSkillSummary.create(skillId, skillDescription));
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

  getSkillSummariesForDiagnosticTest(): ShortSkillSummary[] {
    return this._skillSummariesForDiagnosticTest.slice();
  }

  setSkillSummariesForDiagnosticTest(
      skillSummariesForDiagnosticTest: ShortSkillSummary[]): void {
    this._skillSummariesForDiagnosticTest = skillSummariesForDiagnosticTest;
  }

  getAvailableSkillSummariesForDiagnosticTest(): ShortSkillSummary[] {
    let skillSummaries = cloneDeep(this._uncategorizedSkillSummaries);
    let subtopics = this._subtopics;
    for (let i = 0; i < subtopics.length; i++) {
      skillSummaries = skillSummaries.concat(
        subtopics[i].getSkillSummaries());
    }
    let diagnosticTestSkillSummaries = (
      this.getSkillSummariesForDiagnosticTest());

    const skillIdToDiagnosticTestMap: {[id: string]: boolean} = {};
    for (let skillSummary of diagnosticTestSkillSummaries) {
      skillIdToDiagnosticTestMap[skillSummary.getId()] = true;
    }

    return skillSummaries.filter(skillSummary => {
      return !skillIdToDiagnosticTestMap.hasOwnProperty(skillSummary.getId());
    });
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
    this.setPageTitleFragmentForWeb(otherTopic.getPageTitleFragmentForWeb());
    this.setSkillSummariesForDiagnosticTest(
      otherTopic.getSkillSummariesForDiagnosticTest());
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
  constructor() {}

  create(
      topicBackendDict: TopicBackendDict,
      skillIdToDescriptionDict: SkillIdToDescriptionMap): Topic {
    let subtopics = topicBackendDict.subtopics.map((
        subtopic: SubtopicBackendDict) => {
      return Subtopic.create(
        subtopic, skillIdToDescriptionDict);
    });
    let canonicalStoryReferences =
        topicBackendDict.canonical_story_references.map(
          (reference: StoryReferenceBackendDict) => {
            return StoryReference.createFromBackendDict(
              reference);
          });
    let additionalStoryReferences =
        topicBackendDict.additional_story_references.map(
          (reference: StoryReferenceBackendDict) => {
            return StoryReference.createFromBackendDict(
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
      skillIdToDescriptionDict,
      topicBackendDict.practice_tab_is_displayed,
      topicBackendDict.meta_tag_content,
      topicBackendDict.page_title_fragment_for_web,
      topicBackendDict.skill_ids_for_diagnostic_test
    );
  }

  // TODO(#14309): Remove the interstitial topic so that full topic can be
  // created from start.
  // Create an interstitial topic that until
  // the actual topic is fetched from the backend.
  createInterstitialTopic(): Topic {
    return new Topic(
      null, 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], null, '', {}, false, '', '', []
    );
  }
}

angular.module('oppia').factory(
  'TopicObjectFactory',
  downgradeInjectable(TopicObjectFactory));
