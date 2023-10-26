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
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

require('domain/question/QuestionObjectFactory.ts');
require('domain/state/StateObjectFactory.ts');

describe('Question object factory', function() {
  var QuestionObjectFactory = null;
  var StateObjectFactory = null;
  var sampleQuestion = null;
  var sampleQuestionBackendDict = null;
  var misconceptionObjectFactory = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory()));
    $provide.value(
      'MisconceptionObjectFactory', new MisconceptionObjectFactory());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory());
    $provide.value('ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
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
    StateObjectFactory = $injector.get('StateObjectFactory');
    // The injector is required because this service is directly used in this
    // spec, therefore even though MisconceptionObjectFactory is upgraded to
    // Angular, it cannot be used just by instantiating it by its class but
    // instead needs to be injected. Note that 'misconceptionObjectFactory' is
    // the injected service instance whereas 'MisconceptionObjectFactory' is the
    // service class itself. Therefore, use the instance instead of the class in
    // the specs.
    misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

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
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
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
      inapplicable_skill_misconception_ids: ['a-1', 'b-2'],
      language_code: 'en',
      version: 1
    };
    sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      sampleQuestionBackendDict);
  }));

  it('should correctly get various fields of the question', function() {
    expect(sampleQuestion.getId()).toEqual('question_id');
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
    sampleQuestion.setLanguageCode('cn');
    expect(sampleQuestion.getLanguageCode()).toEqual('cn');
    expect(sampleQuestion.getVersion()).toEqual(1);
    sampleQuestion.setLinkedSkillIds(['skill_id1', 'skill_id2']);
    expect(sampleQuestion.getLinkedSkillIds()).toEqual(
      ['skill_id1', 'skill_id2']);
    expect(sampleQuestion.getInapplicableSkillMisconceptionIds()).toEqual(
      ['a-1', 'b-2']);
    sampleQuestion.setInapplicableSkillMisconceptionIds(['abc-123']);
    expect(sampleQuestion.getInapplicableSkillMisconceptionIds()).toEqual(
      ['abc-123']);
    var stateData = sampleQuestion.getStateData();
    expect(stateData.name).toEqual('question');
    expect(stateData.content.html).toEqual('Question 1');
    var interaction = stateData.interaction;
    expect(interaction.id).toEqual('TextInput');
    expect(interaction.hints[0].hintContent.html).toEqual('Hint 1');
    expect(interaction.solution.explanation.html).toEqual(
      'Solution explanation');
    expect(interaction.solution.correctAnswer).toEqual(
      'This is the correct answer');
    var defaultOutcome = interaction.defaultOutcome;
    expect(defaultOutcome.labelledAsCorrect).toEqual(false);
    expect(defaultOutcome.feedback.html).toEqual('Correct Answer');
  });

  it('should correctly get backend dict', function() {
    var newQuestionBackendDict = sampleQuestion.toBackendDict(true);
    expect(newQuestionBackendDict.id).toEqual(null);
    expect(newQuestionBackendDict.linked_skill_ids).not.toBeDefined();
    expect(newQuestionBackendDict.inapplicable_skill_misconception_ids).toEqual(
      ['a-1', 'b-2']);
    expect(newQuestionBackendDict.version).toEqual(0);
    expect(sampleQuestion.toBackendDict(false).id).toEqual('question_id');
  });

  it('should correctly report unaddressed misconceptions', function() {
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
    interaction.answerGroups[0].outcome.labelledAsCorrect = false;
    interaction.answerGroups[0].taggedSkillMisconceptionId = 'skillId1-id';
    expect(sampleQuestion.getUnaddressedMisconceptionNames(
      misconceptionsDict)).toEqual(['name_2', 'name_3']);
  });

  it('should correctly create a Default Question', function() {
    var sampleQuestion1 = QuestionObjectFactory.createDefaultQuestion(
      ['skill_id3', 'skill_id4']);
    var state = StateObjectFactory.createDefaultState(
      null, 'content_0', 'default_outcome_1');

    expect(sampleQuestion1.getId()).toEqual(null);
    expect(sampleQuestion1.getLanguageCode()).toEqual('en');
    expect(sampleQuestion1.getVersion()).toEqual(1);
    expect(sampleQuestion1.getStateData()).toEqual(state);
    expect(sampleQuestion1.getLinkedSkillIds()).toEqual(
      ['skill_id3', 'skill_id4']);
    expect(sampleQuestion.getInapplicableSkillMisconceptionIds()).toEqual(
      ['a-1', 'b-2']);
  });
});
