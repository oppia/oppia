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

  it('should be able to get the next question from the topic', () => {
    let skillIdToQuestions: SkillIdToQuestions = {
      skillID1: [question1, question2],
      skillID2: [question3, question4],
      skillID3: [question5, question6]
    };

    let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
      skillIdToQuestions);

    expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');

    // Getting the first question from skill 1 i.e., question 1.
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

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');

      // Getting the first question from skill 1 i.e., question1.
      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

      // Since the current question is answered correctly, the next skill
      // (skill 2) should be tested.
      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID2');

      // Getting the first question from skill 2 i.e., question 3.
      question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question3);
    });

  it(
    'should be able to get the next question from the same skill after ' +
    'marking the answer for the current question as incorrect', () => {
      // The first wrong answer does not mark the topic as fail. The first
      // incorrect attempt for a topic is given another chance to try, so
      // another question from the same skill should be tested.
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4],
        skillID3: [question5, question6]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');

      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

      // Since the answer to the current question is wrong, skill 1 is
      // not passed.
      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');

      // Getting the second question from skill 1 i.e., question 2.
      question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question2);
    });

  it(
    'should be able to fail the topic, if two incorrect answers were ' +
    'recorded for any topic', () => {
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4],
        skillID3: [question5, question6]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');
      expect(diagnosticTestTopicStateData.getNextQuestion()).toEqual(question1);

      diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

      // Answering wrongly twice in a topic marks the topic as fail.
      diagnosticTestTopicStateData.recordIncorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');
      expect(diagnosticTestTopicStateData.getNextQuestion()).toEqual(question2);

      expect(diagnosticTestTopicStateData.isTopicPassed()).toBeFalse();
    });

  it(
    'should be able to mark the topic as passed if questions from all the ' +
    'skills were attempted correctly', () => {
      // Attempting questions from all the skills mark the topic as passed.
      let skillIdToQuestions: SkillIdToQuestions = {
        skillID1: [question1, question2],
        skillID2: [question3, question4]
      };

      let diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID1');

      let question = diagnosticTestTopicStateData.getNextQuestion();

      expect(question).toEqual(question1);

      diagnosticTestTopicStateData.recordCorrectAttemptForCurrentQuestion();

      expect(diagnosticTestTopicStateData._currentSkillId).toEqual('skillID2');
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
