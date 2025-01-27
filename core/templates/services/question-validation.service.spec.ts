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
 * @fileoverview Unit tests for QuestionValidationService.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {
  MisconceptionObjectFactory,
  MisconceptionSkillMap,
} from 'domain/skill/MisconceptionObjectFactory';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {QuestionValidationService} from './question-validation.service';
import {AnswerGroupObjectFactory} from 'domain/exploration/AnswerGroupObjectFactory';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {Rule} from 'domain/exploration/rule.model';

describe('Question Validation Service', () => {
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject: MisconceptionSkillMap;
  let mockQuestionDict: QuestionBackendDict;
  let questionObjectFactory: QuestionObjectFactory;
  let qvs: QuestionValidationService;
  let rs: ResponsesService;
  let ses: StateEditorService;
  let shouldHideDefaultAnswerGroupSpy: jasmine.Spy;
  let goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory;
  let agof: AnswerGroupObjectFactory;
  let createAnswerGroupByRules: (rules: Rule[]) => AnswerGroup;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StateEditorService, ResponsesService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    qvs = TestBed.inject(QuestionValidationService);
    rs = TestBed.inject(ResponsesService);
    ses = TestBed.inject(StateEditorService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    spyOn(qvs, 'getInteractionValidationErrorMessage').and.returnValue(null);
    spyOn(ses, 'isCurrentSolutionValid').and.returnValue(true);
    shouldHideDefaultAnswerGroupSpy = spyOn(rs, 'shouldHideDefaultAnswerGroup');
    shouldHideDefaultAnswerGroupSpy.and.returnValue(false);
    createAnswerGroupByRules = rules =>
      agof.createNew(rules, goodDefaultOutcome, [], null);
  });

  beforeEach(() => {
    mockQuestionDict = {
      id: 'question_1',
      question_state_data: {
        content: {
          html: 'Question 1',
          content_id: 'content_1',
        },
        interaction: {
          answer_groups: [
            {
              outcome: {
                dest: 'outcome 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'content_5',
                  html: '',
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 10},
                },
              ],
              tagged_skill_misconception_id: null,
            },
            {
              outcome: {
                dest: 'outcome 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'content_5',
                  html: '',
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 10},
                },
              ],
              tagged_skill_misconception_id: 'abc-1',
            },
          ],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: '',
              },
            },
            rows: {value: 1},
          },
          default_outcome: {
            dest: null,
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2',
            },
            param_changes: [],
            labelled_as_correct: false,
          },
          hints: [
            {
              hint_content: {
                html: 'Hint 1',
                content_id: 'content_3',
              },
            },
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4',
            },
          },
          id: 'TextInput',
        },
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {},
          },
        },
        solicit_answer_details: false,
      },
      language_code: 'en',
      version: 1,
      linked_skill_ids: ['abc'],
      inapplicable_skill_misconception_ids: ['abc-2'],
    } as unknown as QuestionBackendDict;
    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          1,
          'misc1',
          'notes1',
          'feedback1',
          true
        ),
        misconceptionObjectFactory.create(
          2,
          'misc2',
          'notes2',
          'feedback1',
          false
        ),
      ],
    };
  });

  it('should return false if question validation fails', () => {
    let interaction = mockQuestionDict.question_state_data.interaction;
    interaction.answer_groups[0].outcome.labelled_as_correct = false;
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject
      )
    ).toBeFalse();
  });

  it('should return false if misconceptions are not addressed', () => {
    let interaction = mockQuestionDict.question_state_data.interaction;
    interaction.answer_groups[1].tagged_skill_misconception_id = null;
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject
      )
    ).toBeFalse();
  });

  it('should return false if solution is invalid', () => {
    ses.isCurrentSolutionValid = () => false;
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject
      )
    ).toBeFalse();
  });

  it('should return an error message if interaction has errors', () => {
    const originalSpy = qvs.getInteractionValidationErrorMessage as jasmine.Spy;
    originalSpy.and.callThrough();
    const question =
      questionObjectFactory.createFromBackendDict(mockQuestionDict);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: null,
      dest_if_really_stuck: null,
      feedback: {
        html: 'good',
        content_id: null,
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    let answerGroups = [
      createAnswerGroupByRules([
        Rule.createFromBackendDict(
          {
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_4',
                normalizedStrSet: ['xyz'],
              },
            },
          },
          'TextInput'
        ),
      ]),
      createAnswerGroupByRules([
        Rule.createFromBackendDict(
          {
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input',
                normalizedStrSet: ['xyz'],
              },
            },
          },
          'TextInput'
        ),
      ]),
    ];
    question._stateData.interaction.answerGroups = answerGroups;

    const errorMessage = qvs.getInteractionValidationErrorMessage(question);
    expect(qvs.isQuestionValid(question, mockMisconceptionObject)).toBeFalse();
    expect(errorMessage).toBe(
      'Learner answer 1 from Oppia response 2 will never be matched' +
        " because it is preceded by a 'Equals' answer" +
        ' with a matching input.'
    );

    originalSpy.and.returnValue(null);
  });

  it('should return true if validation is successful', () => {
    let question =
      questionObjectFactory.createFromBackendDict(mockQuestionDict);
    expect(qvs.isQuestionValid(question, mockMisconceptionObject)).toBeTrue();
  });

  it('should return false if question is not valid', () => {
    expect(qvs.isQuestionValid(undefined, mockMisconceptionObject)).toBeFalse();
  });

  describe('getValidationErrorMessage()', () => {
    it('should return null when there are no errors', () => {
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);
      expect(qvs.getValidationErrorMessage(question)).toBeNull();
    });

    it('should return error message if no feedback for default outcome', () => {
      const interaction = mockQuestionDict.question_state_data.interaction;
      // This throws "Object is possibly 'null'.". We need to suppress this
      // error because the object is initialized in the beforeEach().
      // @ts-ignore
      interaction.default_outcome.feedback.html = '';
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        "Please enter feedback for the '[All other answers]' outcome."
      );
    });

    it(
      'should return null if no feedback for default outcome but default ' +
        'answer group is hidden',
      () => {
        shouldHideDefaultAnswerGroupSpy.and.returnValue(true);
        const interaction = mockQuestionDict.question_state_data.interaction;
        // This throws "Object is possibly 'null'.". We need to suppress this
        // error because the object is initialized in the beforeEach().
        // @ts-ignore
        interaction.default_outcome.feedback.html = '';
        const question =
          questionObjectFactory.createFromBackendDict(mockQuestionDict);

        expect(qvs.getValidationErrorMessage(question)).toBeNull();
      }
    );

    it('should return error message if no answer is marked correct', () => {
      const interaction = mockQuestionDict.question_state_data.interaction;
      interaction.answer_groups[0].outcome.labelled_as_correct = false;
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        'At least one answer should be marked correct'
      );
    });

    it('should return error message if no solution', () => {
      const interaction = mockQuestionDict.question_state_data.interaction;
      interaction.solution = null;
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        'A solution must be specified'
      );
    });

    it('should return error message if no hint', () => {
      const interaction = mockQuestionDict.question_state_data.interaction;
      interaction.hints = [];
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        'At least 1 hint should be specified'
      );
    });

    it('should return error message if no interaction', () => {
      const interaction = mockQuestionDict.question_state_data.interaction;
      interaction.id = null;
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        'An interaction must be specified'
      );
    });

    it('should return error message if no question content', () => {
      const questionContent = mockQuestionDict.question_state_data.content;
      questionContent.html = '';
      const question =
        questionObjectFactory.createFromBackendDict(mockQuestionDict);

      expect(qvs.getValidationErrorMessage(question)).toEqual(
        'Please enter a question.'
      );
    });
  });
});
