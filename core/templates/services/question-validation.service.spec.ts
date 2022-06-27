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

import { TestBed } from '@angular/core/testing';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { QuestionValidationService } from './question-validation.service';

describe('Question Validation Service', () => {
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject;
  let mockQuestionDict;
  let questionObjectFactory: QuestionObjectFactory;
  let qvs: QuestionValidationService;
  let ses;

  beforeEach(() => {
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    qvs = TestBed.inject(QuestionValidationService);
    ses = TestBed.inject(StateEditorService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    spyOn(ses, 'isCurrentSolutionValid').and.returnValue(true);
  });

  beforeEach(() => {
    mockQuestionDict = {
      id: 'question_1',
      question_state_data: {
        content: {
          html: 'Question 1',
          content_id: 'content_1'
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 10}
            }],
            tagged_skill_misconception_id: null
          }, {
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 10}
            }],
            tagged_skill_misconception_id: 'abc-1'
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: null,
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2'
            },
            param_changes: [],
            labelled_as_correct: false
          },
          hints: [
            {
              hint_content: {
                html: 'Hint 1',
                content_id: 'content_3'
              }
            }
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          id: 'TextInput'
        },
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {}
          }
        },
        written_translations: {
          translations_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {}
          }
        },
        solicit_answer_details: false
      },
      language_code: 'en',
      version: 1,
      linked_skill_ids: ['abc'],
      inapplicable_skill_misconception_ids: ['abc-2']
    };
    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          1, 'misc1', 'notes1', 'feedback1', true),
        misconceptionObjectFactory.create(
          2, 'misc2', 'notes2', 'feedback1', false)
      ]
    };
  });

  it('should return false if question validation fails', () => {
    let interaction = mockQuestionDict.question_state_data.interaction;
    interaction.answer_groups[0].outcome.labelled_as_correct = false;
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject)).toBeFalse();
  });

  it('should return false if misconceptions are not addressed', () => {
    let interaction = mockQuestionDict.question_state_data.interaction;
    interaction.answer_groups[1].tagged_skill_misconception_id = null;
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject)).toBeFalse();
  });

  it('should return false if solution is invalid', () => {
    ses.isCurrentSolutionValid.and.returnValue(false);
    expect(
      qvs.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject)).toBeFalse();
  });

  it('should return true if validation is successful', () => {
    let question = questionObjectFactory.createFromBackendDict(
      mockQuestionDict);
    expect(qvs.isQuestionValid(question, mockMisconceptionObject)).toBeTrue();
  });
});
