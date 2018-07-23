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

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');

    var sampleQuestionBackendDict = {
      id: 'question_id',
      question_state_data: {
        content: {
          html: 'Question 1'
        },
        content_ids_to_audio_translations: {},
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {},
          default_outcome: {
            dest: null,
            feedback: {
              html: 'Correct Answer'
            },
            param_changes: [],
            labelled_as_correct: true
          },
          hints: [
            {
              hint_content: {
                html: 'Hint 1'
              }
            }
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation'
            }
          },
          id: 'TextInput'
        },
        param_changes: []
      },
      language_code: 'en',
      version: 1
    };
    _sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      sampleQuestionBackendDict);
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
    expect(defaultOutcome.labelledAsCorrect).toEqual(true);
    expect(defaultOutcome.feedback.getHtml()).toEqual('Correct Answer');
  });
});
