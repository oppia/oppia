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
 * @fileoverview Factory for creating frontend skill response objects
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SkillObjectFactory, Skill, ISkillBackendDict } from
  'domain/skill/SkillObjectFactory';

export interface ISkillResponseBackendDict {
  'skill': ISkillBackendDict;
  'grouped_skill_summaries': string;
}

export class SkillResponse {
  _skill: Skill;
  _groupedSkillSummaries: string;
  constructor(skill: Skill, groupedSkillSummaries: string) {
    this._skill = skill;
    this._groupedSkillSummaries = groupedSkillSummaries;
  }

  copyFromSkillResponse(skillResponse: SkillResponse): void {
    this._skill = skillResponse._skill;
    this._groupedSkillSummaries = skillResponse._groupedSkillSummaries;
  }

  getSkill(): Skill {
    return this._skill;
  }

  getGroupedSkillSummaries(): string {
    return this._groupedSkillSummaries;
  }

  toBackendDict(): ISkillResponseBackendDict {
    return {
      skill: this._skill.toBackendDict(),
      grouped_skill_summaries: this._groupedSkillSummaries
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillResponseObjectFactory {
  constructor(private skillObjectFactory: SkillObjectFactory) {}

  createFromBackendDict(skillResponseBackendDict: ISkillResponseBackendDict):
    SkillResponse {
    return new SkillResponse (
      this.skillObjectFactory.createFromBackendDict(
        skillResponseBackendDict.skill),
      skillResponseBackendDict.grouped_skill_summaries
    );
  }
}

angular.module('oppia').factory('SkillResponseObjectFactory',
  downgradeInjectable(SkillResponseObjectFactory));
