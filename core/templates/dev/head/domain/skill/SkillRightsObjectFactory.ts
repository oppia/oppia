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
  _skillId: number;
  _creatorId: number;
  _skillIsPrivate: boolean;
  _skillDescriptionIsEditable: boolean;
  constructor(
      skillId: number, creatorId: number, skillIsPrivate: boolean,
      canEditSkillDescription: boolean) {
    this._skillId = skillId;
    this._creatorId = creatorId;
    this._skillIsPrivate = skillIsPrivate;
    this._skillDescriptionIsEditable = canEditSkillDescription;
  }
  getSkillId() {
    return this._skillId;
  }
  getCreatorId() {
    return this._creatorId;
  }
  isPrivate() {
    return this._skillIsPrivate;
  }
  isPublic() {
    return !this._skillIsPrivate;
  }
  canEditSkillDescription() {
    return this._skillDescriptionIsEditable;
  }
  setPublic() {
    this._skillIsPrivate = false;
  }
  copyFromSkillRights(otherSkillRights: {
      getSkillId: () => number; getCreatorId: () => number;
      isPrivate: () => boolean; canEditSkillDescription: () => boolean; }) {
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
  createFromBackendDict(skillRightsBackendDict) {
    return new SkillRights(
      skillRightsBackendDict.skill_id,
      skillRightsBackendDict.creator_id,
      skillRightsBackendDict.skill_is_private,
      skillRightsBackendDict.can_edit_skill_description);
  }
  createInterstitialSkillRights() {
    return new SkillRights(null, null, true, false);
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'SkillRightsObjectFactory',
  downgradeInjectable(SkillRightsObjectFactory));
