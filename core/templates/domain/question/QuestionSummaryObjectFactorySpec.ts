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
 * @fileoverview Unit tests for QuestionSummaryObjectFactory.
 */

import { QuestionSummaryObjectFactory } from
  'domain/question/QuestionSummaryObjectFactory';

describe('Question summary object factory', () => {
  describe('QuestionSummaryObjectFactory', () => {
    let questionSummaryObjectFactory: QuestionSummaryObjectFactory;
    let summaryDict: any;

    beforeEach(() => {
      questionSummaryObjectFactory = new QuestionSummaryObjectFactory();
      summaryDict = {
        id: 'question_id',
        question_content: 'Question 1'
      };
    });

    it('should create a new question summary', () => {
      var questionSummary = questionSummaryObjectFactory.createFromBackendDict(
        summaryDict);
      expect(questionSummary.getQuestionId()).toEqual('question_id');
      expect(questionSummary.getQuestionContent()).toEqual('Question 1');
    });
  });
});
