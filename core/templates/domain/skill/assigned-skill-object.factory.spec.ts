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
 * @fileoverview Unit tests for AssignedSkillObjectFactory.ts.
 */

import { AssignedSkillObjectFactory } from
  'domain/skill/assigned-skill-object.factory';

describe('Assigned Skill Object Factory', () => {
  let asof: AssignedSkillObjectFactory;

  beforeEach(() => {
    asof = new AssignedSkillObjectFactory();
  });

  it('should correctly convert backend dict to Assigned Skill Object.',
    () => {
      let backendDict = {
        topic_id: 'topicId',
        topic_name: 'topic',
        topic_version: 1,
        subtopic_id: 2
      };

      let assignedSkill = asof.createFromBackendDict(backendDict);

      expect(assignedSkill.topicId).toEqual('topicId');
      expect(assignedSkill.topicName).toEqual('topic');
      expect(assignedSkill.topicVersion).toEqual(1);
      expect(assignedSkill.subtopicId).toEqual(2);
    });
});
