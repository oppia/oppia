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
 * @fileoverview Tests for QuestionContentsObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { MisconceptionObjectFactory }
  from 'domain/skill/MisconceptionObjectFactory';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';

describe('Question object factory', () => {
  let questionObjectFactory: QuestionObjectFactory = null;
  let stateObjectFactory: StateObjectFactory = null;
  let sampleQuestion = null;
  let sampleQuestionBackendDict = null;
  let misconceptionObjectFactory: MisconceptionObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuestionObjectFactory, CamelCaseToHyphensPipe]
    });

    questionObjectFactory = TestBed.get(QuestionObjectFactory);
    stateObjectFactory = TestBed.get(StateObjectFactory);
    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);

    sampleQuestionBackendDict = {
      id: 'question_id',
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
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
          }],
          confirmed_unclassified_answers: [],
          customization_args: {},
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
      version: 1
    };
    sampleQuestion = questionObjectFactory.createFromBackendDict(
      sampleQuestionBackendDict);
  });

  it('should correctly get various fields of the question', () => {
    expect(sampleQuestion.getId()).toEqual('question_id');
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
    sampleQuestion.setLanguageCode('cn');
    expect(sampleQuestion.getLanguageCode()).toEqual('cn');
    expect(sampleQuestion.getVersion()).toEqual(1);
    sampleQuestion.setLinkedSkillIds(['skill_id1', 'skill_id2']);
    expect(sampleQuestion.getLinkedSkillIds()).toEqual(
      ['skill_id1', 'skill_id2']);
    var stateData = sampleQuestion.getStateData();
    expect(stateData.name).toEqual('question');
    expect(stateData.content.getHtml()).toEqual('Question 1');
    var interaction = stateData.interaction;
    expect(interaction.id).toEqual('TextInput');
    expect(interaction.hints[0].hintContent.getHtml()).toEqual('Hint 1');
    expect(interaction.solution.explanation.getHtml()).toEqual(
      'Solution explanation');
    expect(interaction.solution.correctAnswer).toEqual(
      'This is the correct answer');
    var defaultOutcome = interaction.defaultOutcome;
    expect(defaultOutcome.labelledAsCorrect).toEqual(false);
    expect(defaultOutcome.feedback.getHtml()).toEqual('Correct Answer');
  });

  it('should correctly get backend dict', () => {
    var newQuestionBackendDict = sampleQuestion.toBackendDict(true);
    expect(newQuestionBackendDict.id).toEqual(null);
    expect(newQuestionBackendDict.linked_skill_ids).not.toBeDefined();
    expect(newQuestionBackendDict.version).toEqual(1);
    expect(sampleQuestion.toBackendDict(false).id).toEqual('question_id');
  });

  it('should correctly validate question', () => {
    var interaction = sampleQuestion.getStateData().interaction;
    var misconception1 = misconceptionObjectFactory.create(
      'id', 'name', 'notes', 'feedback', true);
    var misconception2 = misconceptionObjectFactory.create(
      'id_2', 'name_2', 'notes', 'feedback', true);
    var misconception3 = misconceptionObjectFactory.create(
      'id_3', 'name_3', 'notes', 'feedback', false);
    var misconceptionsDict = {
      skillId1: [misconception1],
      skillId2: [misconception2, misconception3]
    };

    expect(sampleQuestion.validate([])).toBe(false);

    expect(
      sampleQuestion.validate(misconceptionsDict)).toEqual(
      'Click on (or create) an answer ' +
      'that is neither marked correct nor is a default answer (marked ' +
      'above as [All other answers]) and tag the following misconceptions ' +
      'to that answer group: name, name_2');

    interaction.answerGroups[0].outcome.labelledAsCorrect = false;
    expect(sampleQuestion.validate([])).toEqual(
      'At least one answer should be marked correct');

    interaction.solution = null;
    expect(sampleQuestion.validate([])).toEqual(
      'A solution must be specified');

    interaction.hints = [];
    expect(sampleQuestion.validate([])).toEqual(
      'At least 1 hint should be specfied');

    interaction.id = null;
    expect(sampleQuestion.validate([])).toEqual(
      'An interaction must be specified');
  });

  it('should correctly create a Default Question', () => {
    var sampleQuestion1 = questionObjectFactory.createDefaultQuestion(
      ['skill_id3', 'skill_id4']);
    var state = stateObjectFactory.createDefaultState(null);

    expect(sampleQuestion1.getId()).toEqual(null);
    expect(sampleQuestion1.getLanguageCode()).toEqual('en');
    expect(sampleQuestion1.getVersion()).toEqual(1);
    expect(sampleQuestion1.getStateData()).toEqual(state);
    expect(sampleQuestion1.getLinkedSkillIds()).toEqual(
      ['skill_id3', 'skill_id4']);
  });

  it('should correctly set state data', () => {
    var stateData = sampleQuestion.getStateData();
    expect(stateData.name).toEqual('question');
    expect(stateData.content.getHtml()).toEqual('Question 1');
    var interaction = stateData.interaction;
    expect(interaction.id).toEqual('TextInput');
    expect(interaction.hints[0].hintContent.getHtml()).toEqual('Hint 1');
    expect(interaction.solution.explanation.getHtml()).toEqual(
      'Solution explanation');
    expect(interaction.solution.correctAnswer).toEqual(
      'This is the correct answer');
    var defaultOutcome = interaction.defaultOutcome;
    expect(defaultOutcome.labelledAsCorrect).toEqual(false);
    expect(defaultOutcome.feedback.getHtml()).toEqual('Correct Answer');

    sampleQuestion.setStateData(stateObjectFactory.createFromBackendDict(
      'question', {
        content: {
          html: 'Question 2',
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
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
          }],
          confirmed_unclassified_answers: [],
          customization_args: {},
          default_outcome: {
            dest: null,
            feedback: {
              html: 'Correct Answer 2',
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
            correct_answer: 'This is the new answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation 2',
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
      }));

    var stateData = sampleQuestion.getStateData();
    expect(stateData.name).toEqual('question');
    expect(stateData.content.getHtml()).toEqual('Question 2');
    var interaction = stateData.interaction;
    expect(interaction.id).toEqual('TextInput');
    expect(interaction.hints[0].hintContent.getHtml()).toEqual('Hint 1');
    expect(interaction.solution.explanation.getHtml()).toEqual(
      'Solution explanation 2');
    expect(interaction.solution.correctAnswer).toEqual(
      'This is the new answer');
    var defaultOutcome = interaction.defaultOutcome;
    expect(defaultOutcome.labelledAsCorrect).toEqual(false);
    expect(defaultOutcome.feedback.getHtml()).toEqual('Correct Answer 2');
  });
});
