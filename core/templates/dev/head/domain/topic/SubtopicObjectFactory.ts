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
 * subtopic domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory.ts';

export class Subtopic {
  _id: any;
  _title: any;
  _skillSummaries: any;
  _skillSummaryObjectFactory: SkillSummaryObjectFactory;
  constructor(
      subtopicId, title, skillIds, skillIdToDescriptionMap,
      skillSummaryObjectFactory) {
    this._id = subtopicId;
    this._title = title;
    this._skillSummaryObjectFactory = skillSummaryObjectFactory;
    this._skillSummaries = skillIds.map(
      (skillId) => {
        return this._skillSummaryObjectFactory.create(
          skillId, skillIdToDescriptionMap[skillId]);
      });
  }

  getId() {
    return this._id;
  }

  decrementId() {
    return --this._id;
  }

  incrementId() {
    return ++this._id;
  }

  // Returns the title of the subtopic.
  getTitle() {
    return this._title;
  }

  setTitle(title) {
    this._title = title;
  }

  validate() {
    var issues = [];
    if (this._title === '') {
      issues.push('Subtopic title should not be empty');
    }
    var skillIds = this._skillSummaries.map(function(skillSummary) {
      return skillSummary.getId();
    });
    for (var i = 0; i < skillIds.length; i++) {
      var skillId = skillIds[i];
      if (skillIds.indexOf(skillId) < skillIds.lastIndexOf(skillId)) {
        issues.push(
          'The skill with id ' + skillId + ' is duplicated in' +
          ' subtopic with id ' + this._id);
      }
    }
    return issues;
  }

  // Returns the summaries of the skills in the subtopic.
  getSkillSummaries() {
    return this._skillSummaries.slice();
  }

  hasSkill(skillId) {
    return this._skillSummaries.some(function(skillSummary) {
      return skillSummary.getId() === skillId;
    });
  }

  addSkill(skillId, skillDescription) {
    if (!this.hasSkill(skillId)) {
      this._skillSummaries.push(this._skillSummaryObjectFactory.create(
        skillId, skillDescription));
      return true;
    }
    return false;
  }

  removeSkill(skillId) {
    var index = this._skillSummaries.map(function(skillSummary) {
      return skillSummary.getId();
    }).indexOf(skillId);
    if (index > -1) {
      this._skillSummaries.splice(index, 1);
    } else {
      throw Error('The given skill doesn\'t exist in the subtopic');
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtopicObjectFactory {
  constructor(private skillSummaryObjectFactory: SkillSummaryObjectFactory) {}

  create(subtopicBackendDict, skillIdToDescriptionMap) {
    return new Subtopic(
      subtopicBackendDict.id, subtopicBackendDict.title,
      subtopicBackendDict.skill_ids, skillIdToDescriptionMap,
      this.skillSummaryObjectFactory);
  }

  createFromTitle(subtopicId, title) {
    return this.create({
      id: subtopicId,
      title: title,
      skill_ids: []
    }, {});
  }
}

angular.module('oppia').factory(
  'SubtopicObjectFactory', downgradeInjectable(SubtopicObjectFactory));
