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
 * @fileoverview Factory for creating and mutating instances of frontend
 * skill mastery domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface ISkillMasteryBackend {
  [skillId: string]: number;
}

export class SkillMastery {
  private _skillMasteryDict: ISkillMasteryBackend;

  constructor(backendDict: ISkillMasteryBackend) {
    this._skillMasteryDict = { ...backendDict };
  }

  getMasteryDegree(skillId: string): number {
    return this._skillMasteryDict[skillId];
  }

  setMasteryDegree(skillId: string, masteryDegree: number) {
    this._skillMasteryDict[skillId] = masteryDegree;
  }

  toBackendDict(): ISkillMasteryBackend {
    return { ...this._skillMasteryDict };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillMasteryObjectFactory {
  createFromBackendDict(backendDict: ISkillMasteryBackend): SkillMastery {
    return new SkillMastery(backendDict);
  }
}

angular.module('oppia').factory(
  'SkillMasteryObjectFactory',
  downgradeInjectable(SkillMasteryObjectFactory));
