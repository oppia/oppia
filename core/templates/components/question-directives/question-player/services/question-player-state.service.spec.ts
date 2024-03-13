// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for question player state service.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {Question} from 'domain/question/QuestionObjectFactory';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {QuestionPlayerStateService} from './question-player-state.service';

describe('Question player state service', () => {
  let qpss: QuestionPlayerStateService;
  let questionId = 'question_id';
  let stateObject: StateObjectFactory;
  let question: Question;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({}).compileComponents();
    stateObject = TestBed.inject(StateObjectFactory);
    question = new Question(
      questionId,
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      7,
      [],
      [],
      2
    );
  }));

  beforeEach(() => {
    qpss = TestBed.inject(QuestionPlayerStateService);
  });

  it('should register hint as used', () => {
    qpss.hintUsed(question);

    expect(qpss.questionPlayerState[questionId]).toBeDefined();
  });

  it('should register solution viewed', () => {
    qpss.solutionViewed(question);

    expect(qpss.questionPlayerState[questionId].viewedSolution).toBeDefined();
  });

  it('should submit answer', () => {
    qpss.answerSubmitted(question, true, '');
    qpss.solutionViewed(question);
    qpss.answerSubmitted(question, true, '');

    expect(qpss.questionPlayerState[questionId].answers.length).toEqual(1);
  });

  it('should get question player state data', () => {
    expect(qpss.getQuestionPlayerStateData()).toBeDefined();
  });

  it('should access on question session completed', () => {
    expect(qpss.onQuestionSessionCompleted).toBeDefined();
  });
});
