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
 * @fileoverview Frontend Model for skill mastery.
 */

export interface SkillMasteryBackendDict {
  [skillId: string]: number;
}

export class SkillMastery {
  private _skillMasteryDict: SkillMasteryBackendDict;

  constructor(backendDict: SkillMasteryBackendDict) {
    this._skillMasteryDict = {...backendDict};
  }

  static createFromBackendDict(
    backendDict: SkillMasteryBackendDict
  ): SkillMastery {
    return new SkillMastery(backendDict);
  }

  getMasteryDegree(skillId: string): number {
    return this._skillMasteryDict[skillId];
  }

  setMasteryDegree(skillId: string, masteryDegree: number): void {
    this._skillMasteryDict[skillId] = masteryDegree;
  }

  toBackendDict(): SkillMasteryBackendDict {
    return {...this._skillMasteryDict};
  }
}
