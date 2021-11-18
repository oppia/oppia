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
 * @fileoverview Frontend Model for skill rights.
 */

export interface SkillRightsBackendDict {
  'can_edit_skill_description': boolean;
  'skill_id': string;
}

export class SkillRights {
  _skillId: string;
  _canEditSkillDescription: boolean;

  constructor(skillId: string, canEditSkillDescription: boolean) {
    this._skillId = skillId;
    this._canEditSkillDescription = canEditSkillDescription;
  }

  static createFromBackendDict(
      skillRightsBackendDict: SkillRightsBackendDict): SkillRights {
    return new SkillRights(
      skillRightsBackendDict.skill_id,
      skillRightsBackendDict.can_edit_skill_description);
  }

  getSkillId(): string {
    return this._skillId;
  }

  canEditSkillDescription(): boolean {
    return this._canEditSkillDescription;
  }

  copyFromSkillRights(otherSkillRights: SkillRights): void {
    this._skillId = otherSkillRights.getSkillId();
    this._canEditSkillDescription =
      otherSkillRights.canEditSkillDescription();
  }
}
