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
 * @fileoverview Tests for SkillMasteryModel.
 */

import { SkillMastery } from
  'domain/skill/skill-mastery.model';

describe('Skill mastery model', () => {
  it('should be able to create a skill mastery object',
    () => {
      const skillMastery = SkillMastery.createFromBackendDict(
        {
          skillId1: 1.0,
          skillId2: 0.3
        }
      );

      expect(skillMastery.getMasteryDegree('skillId1')).toBe(1.0);
      expect(skillMastery.getMasteryDegree('skillId2')).toBe(0.3);
    });

  it('should be able to convert to a dict object',
    () => {
      const skillMastery = SkillMastery.createFromBackendDict(
        {
          skillId1: 1.0,
          skillId2: 0.3
        }
      );
      const skillMasteryBackendDict = skillMastery.toBackendDict();

      expect(skillMasteryBackendDict.skillId1).toBe(1.0);
      expect(skillMasteryBackendDict.skillId2).toBe(0.3);
    });

  it('should be able to set degree of mastery',
    () => {
      const skillMastery = SkillMastery.createFromBackendDict(
        {
          skillId1: 1.0,
          skillId2: 0.3
        }
      );

      expect(skillMastery.getMasteryDegree('skillId1')).toBe(1.0);
      skillMastery.setMasteryDegree('skillId1', 0.5);
      expect(skillMastery.getMasteryDegree('skillId1')).toBe(0.5);
    });
});
