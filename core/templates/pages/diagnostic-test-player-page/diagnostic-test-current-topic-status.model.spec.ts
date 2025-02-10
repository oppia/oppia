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
 * @fileoverview Test for the diagnostic test current topic status model.
 */

import {TestBed} from '@angular/core/testing';
import {DiagnosticTestQuestionsModel} from 'domain/question/diagnostic-test-questions.model';
import {Question} from 'domain/question/QuestionObjectFactory';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {
  DiagnosticTestCurrentTopicStatusModel,
  SkillIdToQuestionsDict,
} from './diagnostic-test-current-topic-status.model';

describe('Diagnostic test current topic status model', () => {
  let question1: Question, question2: Question, question3: Question;
  let question4: Question, question5: Question, question6: Question;
  let stateObject: StateObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });
    stateObject = TestBed.inject(StateObjectFactory);

    question1 = new Question(
      'question1',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID1'],
      [],
      2
    );
    question2 = new Question(
      'question2',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID2'],
      [],
      2
    );
    question3 = new Question(
      'question3',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID3'],
      [],
      2
    );
    question4 = new Question(
      'question4',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID4'],
      [],
      2
    );
    question5 = new Question(
      'question5',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID5'],
      [],
      2
    );
    question6 = new Question(
      'question6',
      stateObject.createDefaultState('state', 'content_0', 'default_outcome_1'),
      '',
      1,
      ['skillID6'],
      [],
      2
    );
  });

  it('should be able to get the next skill and its main question', () => {
    let skillIdToQuestionsDict: SkillIdToQuestionsDict = {
      skillID1: new DiagnosticTestQuestionsModel(question1, question2),
      skillID2: new DiagnosticTestQuestionsModel(question3, question4),
      skillID3: new DiagnosticTestQuestionsModel(question5, question6),
    };

    let diagnosticTestCurrentTopicStatusModel =
      new DiagnosticTestCurrentTopicStatusModel(skillIdToQuestionsDict);

    expect(diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()).toEqual([
      'skillID1',
      'skillID2',
      'skillID3',
    ]);

    let currentSkillId = 'skillID1';

    // Currently, none of the questions are answered incorrectly, so the
    // main question from current skill should be presented.
    let question =
      diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

    expect(question).toEqual(question1);

    // Marking answer as correct.
    diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(currentSkillId);

    // The current skill ID should be removed from the eligible skill IDs.
    expect(diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()).toEqual([
      'skillID2',
      'skillID3',
    ]);
  });

  it(
    'should be able to get the status of the current skill as true after ' +
      'passing',
    () => {
      let skillIdToQuestionsDict: SkillIdToQuestionsDict = {
        skillID1: new DiagnosticTestQuestionsModel(question1, question2),
        skillID2: new DiagnosticTestQuestionsModel(question3, question4),
        skillID3: new DiagnosticTestQuestionsModel(question5, question6),
      };

      let diagnosticTestCurrentTopicStatusModel =
        new DiagnosticTestCurrentTopicStatusModel(skillIdToQuestionsDict);

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID1', 'skillID2', 'skillID3']);

      let currentSkillId = 'skillID1';

      // Currently, none of the questions are answered incorrectly, so the
      // main question from current skill should be presented.
      let question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question1);

      // Status of current skill should be false initially.
      expect(
        diagnosticTestCurrentTopicStatusModel.getSkillIdToTestStatus()[
          currentSkillId
        ]
      ).toBeFalse();

      diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(
        currentSkillId
      );

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID2', 'skillID3']);

      // Status of current skill should be true, since the answer is correct.
      expect(
        diagnosticTestCurrentTopicStatusModel.getSkillIdToTestStatus()[
          currentSkillId
        ]
      ).toBeTrue();

      // Since the current question is answered correctly, the next skill
      // (skill 2) should be tested.
      currentSkillId = 'skillID2';

      // Getting the main question from skill 2 i.e., question 3.
      question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question3);
    }
  );

  it(
    'should be able to get the backup question of skill if the main question ' +
      'is marked as incorrect',
    () => {
      // The first wrong answer does not mark the topic as fail. The first
      // incorrect attempt for a topic is given another chance to try, so
      // the backup question from the same skill should be tested.
      let skillIdToQuestionsDict: SkillIdToQuestionsDict = {
        skillID1: new DiagnosticTestQuestionsModel(question1, question2),
        skillID2: new DiagnosticTestQuestionsModel(question3, question4),
        skillID3: new DiagnosticTestQuestionsModel(question5, question6),
      };

      let diagnosticTestCurrentTopicStatusModel =
        new DiagnosticTestCurrentTopicStatusModel(skillIdToQuestionsDict);

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID1', 'skillID2', 'skillID3']);

      let currentSkillId = 'skillID1';

      // Currently, none of the questions are answered incorrectly, so the
      // main question from skill 1 should be presented.
      let question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question1);

      diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
        currentSkillId
      );

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID1', 'skillID2', 'skillID3']);

      question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      // Currently, the question from skill 1 is answered incorrectly, so the
      // backup question from skill 1 should be presented.
      expect(question).toEqual(question2);
    }
  );

  it(
    'should be able to mark the topic as failed if two incorrect attempts ' +
      'were made in the same or different skill',
    () => {
      let skillIdToQuestionsDict: SkillIdToQuestionsDict = {
        skillID1: new DiagnosticTestQuestionsModel(question1, question2),
        skillID2: new DiagnosticTestQuestionsModel(question3, question4),
        skillID3: new DiagnosticTestQuestionsModel(question5, question6),
      };

      let diagnosticTestCurrentTopicStatusModel =
        new DiagnosticTestCurrentTopicStatusModel(skillIdToQuestionsDict);

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID1', 'skillID2', 'skillID3']);

      let currentSkillId = 'skillID1';

      // Currently, none of the questions are answered incorrectly, so the
      // main question from skill 1 should be presented.
      let question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question1);

      diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
        currentSkillId
      );

      expect(
        diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()
      ).toEqual(['skillID1', 'skillID2', 'skillID3']);

      expect(
        diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested()
      ).toBeFalse();

      // The earlier attempt was incorrect, so getting the backup question of
      // the current skill.
      question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question2);

      // Answering incorrectly twice in a topic marks the topic as fail.
      diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
        currentSkillId
      );

      // Since two questions are attempted incorrectly, so the next skill from
      // the topic (if any) should not be tested and the topic should be marked
      // as failed.
      expect(diagnosticTestCurrentTopicStatusModel.isTopicPassed()).toBeFalse();
      expect(
        diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested()
      ).toBeTrue();
    }
  );

  it(
    'should be able to mark the topic as passed if questions from all the ' +
      'skills were attempted correctly',
    () => {
      // Attempting questions from all the skills mark the topic as passed.
      let skillIdToQuestionsDict: SkillIdToQuestionsDict = {
        skillID1: new DiagnosticTestQuestionsModel(question1, question2),
        skillID2: new DiagnosticTestQuestionsModel(question3, question4),
      };

      let diagnosticTestCurrentTopicStatusModel =
        new DiagnosticTestCurrentTopicStatusModel(skillIdToQuestionsDict);

      let currentSkillId = 'skillID1';

      // Currently, none of the questions are answered incorrectly, so the
      // main question from skill 1 should be presented.
      let question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question1);

      diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(
        currentSkillId
      );

      expect(
        diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested()
      ).toBeFalse();

      // Since the current question is answered correctly, the next skill
      // (skill 2) should be tested.
      currentSkillId = 'skillID2';

      // Currently, none of the questions are answered incorrectly, so the
      // main question from skill 2 should be presented.
      question =
        diagnosticTestCurrentTopicStatusModel.getNextQuestion(currentSkillId);

      expect(question).toEqual(question3);

      diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(
        currentSkillId
      );

      expect(diagnosticTestCurrentTopicStatusModel.isTopicPassed()).toBeTrue();
      expect(
        diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested()
      ).toBeTrue();
    }
  );
});
