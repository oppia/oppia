// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillOpportunityModel.
 */

import { SkillOpportunity, SkillOpportunityBackendDict } from
  'domain/opportunity/skill-opportunity.model';

describe('Skill opportunity model', () => {
  describe('SkillOpportunityModel', () => {
    let backendDict: SkillOpportunityBackendDict;

    beforeEach(() => {
      backendDict = {
        id: 'skill_id',
        skill_description: 'A new skill for question',
        topic_name: 'A new topic',
        question_count: 30
      };
    });

    it('should return a correct skill id', () => {
      let skillOpportunity = (
        SkillOpportunity.createFromBackendDict(backendDict));

      expect(skillOpportunity.getSkillId()).toEqual(
        'skill_id');
    });

    it('should return a correct opportunity heading', () => {
      let skillOpportunity = (
        SkillOpportunity.createFromBackendDict(backendDict));

      expect(skillOpportunity.getOpportunityHeading()).toEqual(
        'A new skill for question');
    });

    it('should return a correct opportunity subheading', () => {
      let skillOpportunity = (
        SkillOpportunity.createFromBackendDict(backendDict));

      expect(skillOpportunity.getOpportunitySubheading()).toEqual(
        'A new topic');
    });

    it('should return a correct content count', () => {
      let skillOpportunity = (
        SkillOpportunity.createFromBackendDict(backendDict));

      expect(skillOpportunity.getQuestionCount()).toEqual(30);
    });
  });
});
