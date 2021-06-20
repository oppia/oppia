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
<<<<<<< HEAD
 * @fileoverview Model class for creating and mutating instances of frontend
=======
 * @fileoverview Model for creating and mutating instances of frontend
>>>>>>> upstream/develop
 * subtopic domain objects.
 */

import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
<<<<<<< HEAD
import { AppConstants } from 'app.constants';
=======

import constants from 'assets/constants';
>>>>>>> upstream/develop

export interface SubtopicBackendDict {
  'id': number;
  'title': string;
  'skill_ids': string[];
  // For a newly created subtopic, properties below are initialized
  // with a null value and should be passed by user to create a subtopic.
  // Here null implies that properties are yet to be assigned.
  'thumbnail_filename': string | null;
  'thumbnail_bg_color': string | null;
  'url_fragment': string | null;
}

export interface SkillIdToDescriptionMap {
  [skillId: string]: string;
}

export class Subtopic {
  _id: number;
  _title: string;
  _skillSummaries: ShortSkillSummary[];
  _skillIds: string[];
<<<<<<< HEAD
  _skillSummary: ShortSkillSummary | undefined;
  _thumbnailFilename: string | null;
  _thumbnailBgColor: string | null;
  _urlFragment: string | null;
=======
  _thumbnailFilename: string;
  _thumbnailBgColor: string;
  _urlFragment: string;
>>>>>>> upstream/develop
  constructor(
      subtopicId: number, title: string, skillIds: string[],
      skillIdToDescriptionMap: SkillIdToDescriptionMap,
      thumbnailFilename: string | null, thumbnailBgColor: string | null,
      urlFragment: string | null) {
    this._id = subtopicId;
    this._title = title;
    this._skillIds = skillIds;
    this._thumbnailFilename = thumbnailFilename;
    this._thumbnailBgColor = thumbnailBgColor;
    this._urlFragment = urlFragment;
    this._skillSummaries = skillIds.map(
      (skillId) => {
        return ShortSkillSummary.create(
          skillId, skillIdToDescriptionMap[skillId]);
      });
  }

  getId(): number {
    return this._id;
  }

  decrementId(): number {
    return --this._id;
  }

  incrementId(): number {
    return ++this._id;
  }

  // Returns the title of the subtopic.
  getTitle(): string {
    return this._title;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  getUrlFragment(): string | null {
    return this._urlFragment;
  }

  setUrlFragment(urlFragment: string | null): void {
    this._urlFragment = urlFragment;
  }

  validate(): string[] {
    let issues: string[] = [];
    const VALID_URL_FRAGMENT_REGEX = new RegExp(
<<<<<<< HEAD
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (this._urlFragment !== '' && this._urlFragment !== null) {
      if (!VALID_URL_FRAGMENT_REGEX.test(this._urlFragment)) {
        issues.push('Subtopic url fragment is invalid.');
      }
    } else {
      issues.push('Subtopic URL fragment should not be empty');
=======
      constants.VALID_URL_FRAGMENT_REGEX);
    if (this._urlFragment !== null) {
      if (!VALID_URL_FRAGMENT_REGEX.test(this._urlFragment)) {
        issues.push('Subtopic url fragment is invalid.');
      }
>>>>>>> upstream/develop
    }

    if (this._title === '') {
      issues.push('Subtopic title should not be empty');
    }
    let skillIds = this._skillSummaries.map((skillSummary) => {
      return skillSummary.getId();
    });
    for (let i = 0; i < skillIds.length; i++) {
      let skillId = skillIds[i];
      if (skillIds.indexOf(skillId) < skillIds.lastIndexOf(skillId)) {
        issues.push(
          'The skill with id ' + skillId + ' is duplicated in' +
          ' subtopic with id ' + this._id);
      }
    }
    return issues;
  }

  prepublishValidate(): string[] {
    let issues: string[] = [];
    if (!this._thumbnailFilename) {
      issues.push('Subtopic ' + this._title + ' should have a thumbnail.');
    }
    return issues;
  }

  // Returns the summaries of the skills in the subtopic.
  getSkillSummaries(): ShortSkillSummary[] {
    return this._skillSummaries.slice();
  }

  getSkillIds(): string[] {
    return this._skillIds.slice();
  }

  hasSkill(skillId: string): boolean {
    return this._skillSummaries.some(function(skillSummary) {
      return skillSummary.getId() === skillId;
    });
  }

  addSkill(skillId: string, skillDescription: string): boolean {
    if (!this.hasSkill(skillId)) {
      this._skillSummaries.push(ShortSkillSummary.create(
        skillId, skillDescription));
      return true;
    }
    return false;
  }

  removeSkill(skillId: string): void {
<<<<<<< HEAD
    let index = this._skillSummaries.map(function(skillSummary) {
=======
    let index = this._skillSummaries.map((skillSummary) => {
>>>>>>> upstream/develop
      return skillSummary.getId();
    }).indexOf(skillId);
    if (index > -1) {
      this._skillSummaries.splice(index, 1);
    } else {
      throw new Error('The given skill doesn\'t exist in the subtopic');
    }
  }

  setThumbnailFilename(thumbnailFilename: string): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailFilename(): string | null {
    return this._thumbnailFilename;
  }

  setThumbnailBgColor(thumbnailBgColor: string): void {
    this._thumbnailBgColor = thumbnailBgColor;
  }

  getThumbnailBgColor(): string | null {
    return this._thumbnailBgColor;
  }

  static createFromBackendDict(
      subtopicBackendDict: SubtopicBackendDict,
      skillIdToDescriptionMap: SkillIdToDescriptionMap): Subtopic {
    return new Subtopic(
      subtopicBackendDict.id, subtopicBackendDict.title,
      subtopicBackendDict.skill_ids, skillIdToDescriptionMap,
      subtopicBackendDict.thumbnail_filename,
      subtopicBackendDict.thumbnail_bg_color,
      subtopicBackendDict.url_fragment);
  }
}
