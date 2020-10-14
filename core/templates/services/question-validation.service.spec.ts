// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { QuestionObjectFactory } from
  'domain/question/QuestionObjectFactory.ts';
import { QuestionValidationService } from
  'services/question-validation.service.ts';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

describe('Question Validation Service', () => {
  let questionValidationService: QuestionValidationService = null;
  let stateEditorService: StateEditorService = null;
  let questionObjectFactory = null;
  let misconceptionObjectFactory = null;
  let mockMisconceptionObject = null;
  let mockQuestionDict = null;

  beforeEach(() => {
    questionValidationService = TestBed.get(QuestionValidationService);
    questionObjectFactory = TestBed.get(QuestionObjectFactory);
    stateEditorService = TestBed.get(StateEditorService);
    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);

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
          '1', 'misc1', 'notes1', 'feedback1', true),
        misconceptionObjectFactory.create(
          '2', 'misc2', 'notes2', 'feedback1', false)
      ]
    };
  });

  it('should return false if question validation fails', fakeAsync(() => {
    var interaction = mockQuestionDict.question_state_data.interaction;
    interaction.answer_groups[0].outcome.labelled_as_correct = false;
    flushMicrotasks();
    expect(
      questionValidationService.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject)).toBeFalse();
  }));

  it('should return false if misconceptions are not addressed',
    fakeAsync(() => {
      var interaction = mockQuestionDict.question_state_data.interaction;
      interaction.answer_groups[1].tagged_skill_misconception_id = null;
      flushMicrotasks();
      expect(
        questionValidationService.isQuestionValid(
          questionObjectFactory.createFromBackendDict(mockQuestionDict),
          mockMisconceptionObject)).toBeFalse();
    }));

  it('should return false if solution is invalid', fakeAsync(() => {
    spyOn(stateEditorService, 'isCurrentSolutionValid').and.returnValue(false);
    flushMicrotasks();
    expect(
      questionValidationService.isQuestionValid(
        questionObjectFactory.createFromBackendDict(mockQuestionDict),
        mockMisconceptionObject)).toBeFalse();
  }));

  it('should return true if validation is successful', fakeAsync(() => {
    var question = questionObjectFactory.createFromBackendDict(
      mockQuestionDict);
    spyOn(stateEditorService, 'isCurrentSolutionValid').and.returnValue(true);
    flushMicrotasks();
    expect(questionValidationService.isQuestionValid(
      question, mockMisconceptionObject)).toBeTrue();
  }));
});
