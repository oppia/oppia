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
import { Question } from 'domain/question/QuestionObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { DiagnosticTestTopicStateData, SkillIdToQuestions } from './diagnostic-test-topic-state.model';


describe('Diagnostic test model', () => {
  let question1: Question, question2: Question, question3: Question;
  let question4: Question, question5: Question, question6: Question;
  let stateObject: StateObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });
    stateObject = TestBed.inject(StateObjectFactory);

    question1 = new Question(
      'question1', stateObject.createDefaultState('state'), '', 1,
      ['skillID1'], []
    );
    question2 = new Question(
      'question2', stateObject.createDefaultState('state'), '', 1,
      ['skillID2'], []
    );
    question3 = new Question(
      'question3', stateObject.createDefaultState('state'), '', 1,
      ['skillID3'], []
    );
    question4 = new Question(
      'question4', stateObject.createDefaultState('state'), '', 1,
      ['skillID4'], []
    );
    question5 = new Question(
      'question5', stateObject.createDefaultState('state'), '', 1,
      ['skillID5'], []
    );
    question6 = new Question(
      'question6', stateObject.createDefaultState('state'), '', 1,
      ['skillID6'], []
    );
  });

  it('should be able to get the next question', () => {
    let skillIdToQuestions: SkillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    };

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID1');

    let question = diagnosticTestTopicStateData.getNextQuestion();

    expect(question).toEqual(question1);
  });

  it(
    'should be able to get the next question from a different skill after ' +
    'marking the answer for the current question as correct', () => {
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4],
        skillID3: [question5, question6]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID1');

      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID2');

      question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question3);
    });

  it(
    'should be able to get the next question from the same skill after ' +
    'marking the answer for the current question as incorrect', () => {
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4],
        skillID3: [question5, question6]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID1');

      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID1');

      question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question2);
    });

  it(
    'should be able to fail the topic if the attempted answer for the ' +
    'current question is incorrect and a lifeline is already used', () => {
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4],
        skillID3: [question5, question6]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      diagnosticTestTopicStateData._lifeLineIsConsumed = true;

      diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData.isTopicPassed()).toBeFalse();
    });

  it(
    'should be able to mark the topic as passed if questions from all the ' +
    'skills were attempted correctly, with or without using the lifeline',
    () => {
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID1');

      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData._currentSkill).toEqual('skillID2');
      expect(
        diagnosticTestTopicStateData.isTopicCompletelyTested()).toBeFalse();

      question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question3);

      diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData.isTopicPassed()).toBeTrue();
      expect(diagnosticTestTopicStateData.isTopicCompletelyTested()).toBeTrue();
    });

  it('should be able to get the total number of attempted questions', () => {
    let skillIdToQuestions: SkillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4]
    };

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
  });
});
