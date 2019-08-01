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
 * skill summary domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SkillSummary {
  _id: string;
  _description: string;

  constructor(skillId: string, skillDescription: string) {
    this._id = skillId;
    this._description = skillDescription;
  }
  getId(): string {
    return this._id;
  }

  getDescription(): string {
    return this._description;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillSummaryObjectFactory {
  create(skillId: string, skillDescription: string): SkillSummary {
    return new SkillSummary(skillId, skillDescription);
  }
}

angular.module('oppia').factory(
  'SkillSummaryObjectFactory',
  downgradeInjectable(SkillSummaryObjectFactory));
