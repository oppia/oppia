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

// TODO(#7222): Remove the following block of unnnecessary imports once
// QuestionObjectFactory.ts is upgraded to Angular 8.
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
// ^^^ This block is to be removed.

require('domain/question/QuestionObjectFactory.ts');

describe('Question object factory', function() {
  var QuestionObjectFactory = null;
  var _sampleQuestion = null;
  var _sampleQuestionBackendDict = null;
  var misconceptionObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'MisconceptionObjectFactory', new MisconceptionObjectFactory());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
  }));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          can_have_solution: true
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    // The injector is required because this service is directly used in this
    // spec, therefore even though MisconceptionObjectFactory is upgraded to
    // Angular, it cannot be used just by instantiating it by its class but
    // instead needs to be injected. Note that 'misconceptionObjectFactory' is
    // the injected service instance whereas 'MisconceptionObjectFactory' is the
    // service class itself. Therefore, use the instance instead of the class in
    // the specs.
    misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

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
    var misconception1 = misconceptionObjectFactory.create(
      'id', 'name', 'notes', 'feedback');
    var misconception2 = misconceptionObjectFactory.create(
      'id_2', 'name_2', 'notes', 'feedback');
    var misconception3 = misconceptionObjectFactory.create(
      'id_3', 'name_3', 'notes', 'feedback');
    var misconceptionsDict = {
      skillId1: [misconception1],
      skillId2: [misconception2, misconception3]
    };
    expect(
      _sampleQuestion.validate(misconceptionsDict)).toEqual(
      'The following misconceptions should also be caught: name, name_2, ' +
      'name_3. Click on (or create) an answer that is neither marked correct ' +
      'nor is a default answer (marked above as [All other answers]) to tag ' +
      'a misconception to that answer group.');

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
