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
 * @fileoverview Model for creating and mutating instances of frontend
 * skill summary domain objects.
 */

export interface ShortSkillSummaryBackendDict {
  skill_id: string;
  skill_description: string;
}

export class ShortSkillSummary {
  constructor(
    public id: string,
    public description: string
  ) {}

  getId(): string {
    return this.id;
  }

  getDescription(): string {
    return this.description;
  }

  static create(skillId: string, skillDescription: string): ShortSkillSummary {
    return new ShortSkillSummary(skillId, skillDescription);
  }

  static createFromBackendDict(
    backendDict: ShortSkillSummaryBackendDict
  ): ShortSkillSummary {
    return new ShortSkillSummary(
      backendDict.skill_id,
      backendDict.skill_description
    );
  }
}
