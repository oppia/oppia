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

import {
  QuestionSummaryBackendDict,
  QuestionSummary,
} from 'domain/question/question-summary-object.model';

describe('Question summary', () => {
  let summaryDict: QuestionSummaryBackendDict;

  beforeEach(() => {
    summaryDict = {
      id: 'question_id',
      question_content: 'Question 1',
      interaction_id: 'TextInput',
      misconception_ids: ['skillid-0'],
    };
  });

  it('should create a new question summary', () => {
    const questionSummary = QuestionSummary.createFromBackendDict(summaryDict);
    expect(questionSummary.getQuestionId()).toEqual('question_id');
    expect(questionSummary.getQuestionContent()).toEqual('Question 1');
    expect(questionSummary.getInteractionId()).toEqual('TextInput');
    expect(questionSummary.getMisconceptionIds()).toEqual(['skillid-0']);
  });

  it('should change question content in a question summary', () => {
    const newQuestionContent = 'New question content';
    const questionSummary = QuestionSummary.createFromBackendDict(summaryDict);
    expect(questionSummary.getQuestionContent()).toEqual('Question 1');

    questionSummary.setQuestionContent(newQuestionContent);
    expect(questionSummary.getQuestionContent()).toEqual(newQuestionContent);
  });
});
