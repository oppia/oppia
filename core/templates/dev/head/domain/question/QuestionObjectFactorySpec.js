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

describe('Question object factory', function() {
  var QuestionObjectFactory = null;
  var _sampleQuestion = null;
  var _sampleQuestionBackendDict = null;
  var MisconceptionObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(function() {
    module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          can_have_solution: true
        }
      });
    });
  });

  beforeEach(inject(function($injector) {
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

    _sampleQuestionBackendDict = {
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
        content_ids_to_audio_translations: {
          content_1: {},
          content_2: {},
          content_3: {},
          content_4: {},
          content_5: {}
        },
        written_translations: {
          translations_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {}
          }
        }
      },
      language_code: 'en',
      version: 1
    };
    _sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      _sampleQuestionBackendDict);
  }));

  it('should correctly get various fields of the question', function() {
    expect(_sampleQuestion.getId()).toEqual('question_id');
    expect(_sampleQuestion.getLanguageCode()).toEqual('en');
    var stateData = _sampleQuestion.getStateData();
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

  it('should correctly get backend dict', function() {
    expect(_sampleQuestion.toBackendDict(true).id).toEqual(null);
    expect(_sampleQuestion.toBackendDict(false).id).toEqual('question_id');
  });

  it('should correctly validate question', function() {
    var interaction = _sampleQuestion.getStateData().interaction;
    var misconception1 = MisconceptionObjectFactory.create(
      'id', 'name', 'notes', 'feedback');
    var misconception2 = MisconceptionObjectFactory.create(
      'id_2', 'name_2', 'notes', 'feedback');
    expect(
      _sampleQuestion.validate([misconception1, misconception2])).toEqual(
      'The following misconceptions should also be caught: name, name_2.' +
      ' Click on (or create) an answer that is neither marked correct nor ' +
      'is a default answer (marked above as [All other answers]) to tag a ' +
      'misconception to that answer group.');

    interaction.answerGroups[0].outcome.labelledAsCorrect = false;
    expect(_sampleQuestion.validate([])).toEqual(
      'At least one answer should be marked correct');

    interaction.solution = null;
    expect(_sampleQuestion.validate([])).toEqual(
      'A solution must be specified');

    interaction.hints = [];
    expect(_sampleQuestion.validate([])).toEqual(
      'At least 1 hint should be specfied');
  });
});
