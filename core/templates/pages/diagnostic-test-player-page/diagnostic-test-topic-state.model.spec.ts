// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Test for the diagnostic test topic state model.
 */


import { TestBed } from '@angular/core/testing';
import { DiagnosticTestTopicStateData } from './diagnostic-test-topic-state.model';


class MockQuestion {
  id: string;
  description: string;

  constructor(id, description) {
    id = id;
    description = description;
  }
}


describe('Diagnostic test model', () => {
  let skillID1: string, skillID2: string, skillID3: string;
  let question1: MockQuestion, question2: MockQuestion, question3: MockQuestion;
  let question4: MockQuestion, question5: MockQuestion, question6: MockQuestion;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });
    skillID1 = 'skillID1';
    skillID2 = 'skillID2';
    skillID3 = 'skillID3';

    question1 = new MockQuestion('question1', 'Question 1');
    question2 = new MockQuestion('question2', 'Question 2');
    question3 = new MockQuestion('question3', 'Question 3');
    question4 = new MockQuestion('question4', 'Question 4');
    question5 = new MockQuestion('question5', 'Question 5');
    question6 = new MockQuestion('question6', 'Question 6');
  });

  it('should be able to get the next question', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    // After initialization, the next question will be selected from the first skill.

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID1);

    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);
  });

  it('should be able to get the next question from different skill after marking the answer from current question as correct', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID1);

    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);

    diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID2);

    question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question3);
  });

  it('should be able to get the next quesion from same skill after marking the answer for current question as incorrect', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID1);

    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);

    diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID1);

    question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question2);
  });

  it('should be able to fail the topic if the attempted answer for current question is incorrect and a lifeline is already used', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    diagnosticTestTopicStateData._lifeLineIsConsumed = true;

    diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData.isTopicPassed()).toBeFalse();
  });

  it('should be able to mark the topic as passed if questions from all the skills were attempted correctly, with or without using lifeline', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID1);

    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);

    diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData._currentSkill).toEqual(skillID2);
    expect(diagnosticTestTopicStateData.isTopicCompletelyTested()).toBeFalse();

    question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question3);

    diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData.isTopicPassed()).toBeTrue();
    expect(diagnosticTestTopicStateData.isTopicCompletelyTested()).toBeTrue();
  });

  it('should be able to get number of attempted questions', () => {
    let skillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4]
    }

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);


    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);

    diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData.getTotalNumberOfAttemptedQuestions())
      .toEqual(1);

    question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question3);

    diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

    expect(diagnosticTestTopicStateData.getTotalNumberOfAttemptedQuestions())
      .toEqual(2);
  })
});