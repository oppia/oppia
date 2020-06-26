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

export interface IMultiSkillsResponseBackendDict {
  'skills': ISkillBackendDict[];
}

export class MultiSkillsResponse {
  _skills: Skill[];
  constructor(skills: Skill[]) {
    this._skills = skills;
  }

  copyFromMultiSkillsResponse(skillResponse: MultiSkillsResponse): void {
    this._skills = skillResponse._skills;
  }

  getSkills(): Skill[] {
    return this._skills;
  }

  toBackendDict(): IMultiSkillsResponseBackendDict {
    return {
      skills: this._skills.map((skill: Skill) => {
        return skill.toBackendDict();
      })
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class MultiSkillsResponseObjectFactory {
  constructor(private skillObjectFactory: SkillObjectFactory) {}

  generateSkillsFromBackendDict(skillsBackendDicts: ISkillBackendDict[]) {
    return skillsBackendDicts.map((skillsBackendDict) => {
      return this.skillObjectFactory.createFromBackendDict(
        skillsBackendDict);
    });
  }

  createFromBackendDict(multiSkillsResponseBackendDict:
    IMultiSkillsResponseBackendDict): MultiSkillsResponse {
    return new MultiSkillsResponse (
      this.generateSkillsFromBackendDict(
        multiSkillsResponseBackendDict.skills)
    );
  }
}

angular.module('oppia').factory('MultiSkillsResponseObjectFactory',
  downgradeInjectable(MultiSkillsResponseObjectFactory));
