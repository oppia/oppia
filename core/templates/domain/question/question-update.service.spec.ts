// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for question update service.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { TestBed } from '@angular/core/testing';
import {QuestionUpdateService} from 'domain/question/question-update.service';
import { QuestionObjectFactory } from './QuestionObjectFactory';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';

describe('Question update service', function() {
  var questionUpdateService = null;
  var questionObjectFactory = null;
  var questionUndoRedoService = null;
  var stateObjectFactory = null;
  var sampleQuestion = null;
  var sampleStateDict = null;
  var expectedOutputStateDict = null;
  var expectedOutputState = null;
  var sampleQuestionBackendObject = null;
  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(() =>{
    questionUpdateService = TestBed.inject(QuestionUpdateService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    questionUndoRedoService = TestBed.inject(UndoRedoService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);

    sampleStateDict = {
      name: 'question',
      classifier_model_id: 0,
      content: {
        html: 'old content',
        content_id: 'content'
      },
      param_changes: [],
      interaction: {
        answer_groups: [{
          rule_specs: [{
            rule_type: 'Contains',
            inputs: {x: {
              contentId: 'rule_input',
              normalizedStrSet: ['hola']
            }}
          }],
          outcome: {
            dest: 'Me Llamo',
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'test_answer',
          explanation: {
            content_id: 'content_2',
            html: 'test_explanation1'
          }
        },
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
          dest: 'Hola',
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [{
          hint_content: {
            html: 'Hint 1',
            content_id: 'hints_1'
          }}],
        id: 'TextInput',
      },
      linked_skill_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          hints_1: {}
        }
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      }
    };

    expectedOutputStateDict = {
      name: 'question',
      classifier_model_id: 0,
      content: {
        html: 'test content',
        content_id: 'content_1'
      },
      param_changes: [],
      interaction: {
        answer_groups: [{
          rule_specs: [{
            rule_type: 'Contains',
            inputs: {x: {
              contentId: 'rule_input',
              normalizedStrSet: ['hola']
            }}
          }],
          outcome: {
            dest: 'Me Llamo',
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'test_answer',
          explanation: {
            content_id: 'content_2',
            html: 'test_explanation1'
          }
        },
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
          dest: 'Hola',
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [{
          hint_content: {
            html: 'Hint 1',
            content_id: 'hints_1'
          }}],
        id: 'TextInput',
      },
      linked_skill_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          default_outcome: {},
          hints_1: {},
          content_1: {}
        }
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content_1: {},
          default_outcome: {}
        }
      }
    };

    expectedOutputState = stateObjectFactory.createFromBackendDict(
      'question', expectedOutputStateDict);

    sampleQuestionBackendObject = {
      id: '0',
      question_state_data: sampleStateDict,
      language_code: 'en',
      version: 1
    };
    sampleQuestion = questionObjectFactory.createFromBackendDict(
      sampleQuestionBackendObject);
  });

  it('should update the language code of the question', () => {
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
    questionUpdateService.setQuestionLanguageCode(sampleQuestion, 'zh');
    expect(sampleQuestion.getLanguageCode()).toEqual('zh');
    questionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
  });

  it('should update the state data of the question', () => {
    var oldStateData = angular.copy(sampleQuestion.getStateData());
    var updateFunction = function() {
      var stateData = sampleQuestion.getStateData();
      stateData.content = SubtitledHtml.createDefault(
        'test content', 'content_1');
    };
    questionUpdateService.setQuestionStateData(
      sampleQuestion, updateFunction);
    expect(sampleQuestion.getStateData()).toEqual(expectedOutputState);
    questionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getStateData()).toEqual(oldStateData);
  });

  it('should set question inapplicable skills misconception ids when ' +
    'calling \'setQuestionInapplicableSkillMisconceptionIds\'', function() {
    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toBe(undefined);

    questionUpdateService.setQuestionInapplicableSkillMisconceptionIds(
      sampleQuestion, ['id1']);

    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toEqual(['id1']);

    questionUndoRedoService.undoChange(sampleQuestion);

    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toBe(undefined);
  });
});
