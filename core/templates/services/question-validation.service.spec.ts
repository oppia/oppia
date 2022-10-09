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
import { QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { MisconceptionObjectFactory, MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { QuestionValidationService } from './question-validation.service';

describe('Question Validation Service', () => {
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject: MisconceptionSkillMap;
  let mockQuestionDict: QuestionBackendDict;
  let questionObjectFactory: QuestionObjectFactory;
  let qvs: QuestionValidationService;
  let ses: StateEditorService;

  beforeEach(() => {
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    qvs = TestBed.inject(QuestionValidationService);
    ses = TestBed.inject(StateEditorService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    spyOn(ses, 'isCurrentSolutionValid').and.returnValue(true);
  });

  beforeEach(() => {
    mockQuestionDict = {
      id: '',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
        solicit_answer_details: false,
        content: {
          content_id: '1',
          html: 'Question 1'
        },
        written_translations: {
          translations_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'State 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '<p>Try Again.</p>'
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: true,
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
            }],
            training_data: [],
            tagged_skill_misconception_id: null,
          },
          {
            outcome: {
              dest: 'State 2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: '<p>Try Again.</p>'
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: true,
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
            }],
            training_data: [],
            tagged_skill_misconception_id: 'misconceptionId',
          }],
          default_outcome: {
            dest: 'dest',
            dest_if_really_stuck: null,
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            param_changes: [],
            feedback: {
              content_id: 'feedback_id',
              html: '<p>Dummy Feedback</p>'
            }
          },
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0'
              }
            }
          },
          confirmed_unclassified_answers: [],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>This is a hint.</p>'
              }
            }
          ],
          solution: {
            correct_answer: 'Solution',
            explanation: {
              content_id: 'solution',
              html: '<p>This is a solution.</p>'
            },
            answer_is_exclusive: false
          }
        },
        linked_skill_id: null,
        card_is_checkpoint: true,
        recorded_voiceovers: {
          voiceovers_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        }
      },
      question_state_data_schema_version: 2,
      language_code: '',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: []
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
    ses.isCurrentSolutionValid = () => false;
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

  it('should return false if question is not valid', () => {
    expect(qvs.isQuestionValid(undefined, mockMisconceptionObject)).toBeFalse();
  });
});
