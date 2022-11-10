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
 * @fileoverview Tests for the diagnostic test questions model.
 */

import { DiagnosticTestQuestionsModel } from './diagnostic-test-questions.model';
import { Question, QuestionBackendDict, QuestionObjectFactory } from './QuestionObjectFactory';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Diagnostic test questions model', () => {
  let diagnosticTestQuestionsModel: DiagnosticTestQuestionsModel;
  let question1: Question, question2: Question;

  beforeEach(() => {
    let questionObjectFactory: QuestionObjectFactory;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        QuestionObjectFactory
      ]
    });

    questionObjectFactory = TestBed.inject(QuestionObjectFactory);

    let questionBackendDict1: QuestionBackendDict = {
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
            tagged_skill_misconception_id: '',
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
            dest: '',
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

    let questionBackendDict2: QuestionBackendDict = {
      id: '',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
        solicit_answer_details: false,
        content: {
          content_id: '2',
          html: 'Question 2'
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
            tagged_skill_misconception_id: '',
          }],
          default_outcome: {
            dest: '',
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

    question1 = questionObjectFactory.createFromBackendDict(
      questionBackendDict1);
    question2 = questionObjectFactory.createFromBackendDict(
      questionBackendDict2);
  });

  it('should be able to create model', () => {
    diagnosticTestQuestionsModel = new DiagnosticTestQuestionsModel(
      question1, question2);

    expect(diagnosticTestQuestionsModel.getMainQuestion()).toEqual(question1);
    expect(diagnosticTestQuestionsModel.getBackupQuestion()).toEqual(question2);
  });
});
