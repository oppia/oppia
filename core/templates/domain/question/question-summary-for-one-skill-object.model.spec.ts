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
 * @fileoverview Unit tests for QuestionSummaryModel.
 */

import {TestBed} from '@angular/core/testing';

import {
  QuestionSummaryForOneSkillBackendDict,
  QuestionSummaryForOneSkill,
} from 'domain/question/question-summary-for-one-skill-object.model';

describe('Question summary for one skill object factory', () => {
  describe('QuestionSummaryForOneSkill', () => {
    let backendDict: QuestionSummaryForOneSkillBackendDict;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [QuestionSummaryForOneSkill],
      });

      backendDict = {
        skill_id: 'skill_id',
        skill_description: 'Skill 1',
        skill_difficulty: 0.6,
        summary: {
          id: 'question_id',
          question_content: 'Question 1',
          interaction_id: 'TextInput',
          misconception_ids: [],
        },
      };
    });

    it('should create a new question summary for one skill object', () => {
      var questionSummaryForOneSkill =
        QuestionSummaryForOneSkill.createFromBackendDict(backendDict);
      expect(
        questionSummaryForOneSkill.getQuestionSummary().getQuestionId()
      ).toEqual('question_id');
      expect(
        questionSummaryForOneSkill.getQuestionSummary().getQuestionContent()
      ).toEqual('Question 1');
      expect(questionSummaryForOneSkill.getSkillId()).toEqual('skill_id');
      expect(questionSummaryForOneSkill.getSkillDescription()).toEqual(
        'Skill 1'
      );
      expect(questionSummaryForOneSkill.getSkillDifficulty()).toEqual(0.6);
    });
  });
});
