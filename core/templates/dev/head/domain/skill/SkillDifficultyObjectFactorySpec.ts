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
 * @fileoverview Unit tests for SkillDifficultyObjectFactory.
 */

import { SkillDifficultyObjectFactory } from
  'domain/skill/SkillDifficultyObjectFactory.ts';

describe('Skill Difficulty object factory', function() {
  describe('SkillDifficultyObjectFactory', function() {
    let skillDifficultyObjectFactory: SkillDifficultyObjectFactory;

    beforeEach(() => {
      skillDifficultyObjectFactory = new SkillDifficultyObjectFactory();
    });

    it('should create a new skill difficulty instance', function() {
      var skillDifficulty =
        skillDifficultyObjectFactory.create('1', 'test skill', 0.3);
      expect(skillDifficulty.getId()).toEqual('1');
      expect(skillDifficulty.getDescription()).toEqual('test skill');
      expect(skillDifficulty.getDifficulty()).toEqual(0.3);
    });

    it('should convert to a backend dictionary', function() {
      var skillDifficulty =
        skillDifficultyObjectFactory.create('1', 'test skill', 0.3);
      var skillDifficultyDict = {
        id: '1',
        description: 'test skill',
        difficulty: 0.3
      };
      expect(skillDifficulty.toBackendDict()).toEqual(skillDifficultyDict);
    });
  });
});
