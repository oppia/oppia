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
 * skill rights domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SkillRights {
  _skillId: string;
  _creatorId: string;
  _skillIsPrivate: boolean;
  _skillDescriptionIsEditable: boolean;

  constructor(
      skillId: string, creatorId: string,
      skillIsPrivate: boolean, canEditSkillDescription: boolean) {
    this._skillId = skillId;
    this._creatorId = creatorId;
    this._skillIsPrivate = skillIsPrivate;
    this._skillDescriptionIsEditable = canEditSkillDescription;
  }

  getSkillId(): string {
    return this._skillId;
  }

  getCreatorId(): string {
    return this._creatorId;
  }

  isPrivate(): boolean {
    return this._skillIsPrivate;
  }

  isPublic(): boolean {
    return !this._skillIsPrivate;
  }

  canEditSkillDescription(): boolean {
    return this._skillDescriptionIsEditable;
  }

  setPublic(): void {
    this._skillIsPrivate = false;
  }

  copyFromSkillRights(otherSkillRights: {
      getSkillId: () => string; getCreatorId: () => string;
      isPrivate: () => boolean; canEditSkillDescription: () => boolean;
    }): void {
    this._skillId = otherSkillRights.getSkillId();
    this._creatorId = otherSkillRights.getCreatorId();
    this._skillIsPrivate = otherSkillRights.isPrivate();
    this._skillDescriptionIsEditable =
      otherSkillRights.canEditSkillDescription();
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillRightsObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'skillRightsBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(skillRightsBackendDict: any): SkillRights {
    return new SkillRights(
      skillRightsBackendDict.skill_id,
      skillRightsBackendDict.creator_id,
      skillRightsBackendDict.skill_is_private,
      skillRightsBackendDict.can_edit_skill_description);
  }
  createInterstitialSkillRights(): SkillRights {
    return new SkillRights(null, null, true, false);
  }
}

angular.module('oppia').factory(
  'SkillRightsObjectFactory',
  downgradeInjectable(SkillRightsObjectFactory));
