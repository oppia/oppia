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
 * @fileoverview Unit tests for SkillSummary.
 */

import { SkillSummary } from 'domain/skill/skill-summary.model';

describe('Skill Summary Model', () => {
  it('should correctly convert backend dict to domain object.', () => {
    let backendDict = {
      language_code: 'en',
      skill_model_last_updated: 1594649197855.071,
      skill_model_created_on: 1594649197855.059,
      id: 'Q5JuLf64rzV0',
      worked_examples_count: 0,
      description: 'Dummy Skill 1',
      misconception_count: 0,
      version: 1
    };

    let skillSummary = SkillSummary.createFromBackendDict(backendDict);

    expect(skillSummary.languageCode).toEqual('en');
    expect(skillSummary.id).toEqual('Q5JuLf64rzV0');
    expect(skillSummary.description).toEqual('Dummy Skill 1');
    expect(skillSummary.workedExamplesCount).toEqual(0);
    expect(skillSummary.misconceptionCount).toEqual(0);
    expect(skillSummary.version).toEqual(1);
    expect(skillSummary.skillModelCreatedOn).toEqual(1594649197855.059);
    expect(skillSummary.skillModelLastUpdated).toEqual(1594649197855.071);
  });
});
