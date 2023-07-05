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

// TODO(#7222): Remove the following block of unnnecessary imports once
// question-update.service.ts is upgraded to Angular 8.
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
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
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

require('App.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/question/question-update.service.ts');
require('domain/state/StateObjectFactory.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.component.ts');

describe('Question update service', function() {
  var QuestionUpdateService = null;
  var QuestionObjectFactory = null;
  var QuestionUndoRedoService = null;
  var StateObjectFactory = null;
  var sampleQuestion = null;
  var sampleStateDict = null;
  var expectedOutputStateDict = null;
  var expectedOutputState = null;
  var sampleQuestionBackendObject = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory()));
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
  beforeEach(angular.mock.inject(function($injector) {
    QuestionUpdateService = $injector.get('QuestionUpdateService');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
    StateObjectFactory = $injector.get('StateObjectFactory');

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
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
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
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [],
        id: 'TextInput',
      },
      linked_skill_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      solicit_answer_details: false
    };

    expectedOutputStateDict = {
      name: 'question',
      classifier_model_id: 0,
      content: {
        html: 'test content',
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
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
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
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [],
        id: 'TextInput',
      },
      linked_skill_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      solicit_answer_details: false
    };

    expectedOutputState = StateObjectFactory.createFromBackendDict(
      'question', expectedOutputStateDict);

    sampleQuestionBackendObject = {
      id: '0',
      question_state_data: sampleStateDict,
      language_code: 'en',
      version: 1
    };
    sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      sampleQuestionBackendObject);
  }));

  it('should update the language code of the question', function() {
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
    QuestionUpdateService.setQuestionLanguageCode(sampleQuestion, 'zh');
    expect(sampleQuestion.getLanguageCode()).toEqual('zh');
    QuestionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
  });

  it('should update the state data of the question', function() {
    var oldStateData = angular.copy(sampleQuestion.getStateData());
    var updateFunction = function() {
      var stateData = sampleQuestion.getStateData();
      stateData.content = SubtitledHtml.createDefault(
        'test content', 'content');
    };
    QuestionUpdateService.setQuestionStateData(
      sampleQuestion, updateFunction);
    expect(sampleQuestion.getStateData()).toEqual(expectedOutputState);
    QuestionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getStateData()).toEqual(oldStateData);
  });

  it('should set question inapplicable skills misconception ids when ' +
    'calling \'setQuestionInapplicableSkillMisconceptionIds\'', function() {
    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toBe(undefined);

    QuestionUpdateService.setQuestionInapplicableSkillMisconceptionIds(
      sampleQuestion, ['id1']);

    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toEqual(['id1']);

    QuestionUndoRedoService.undoChange(sampleQuestion);

    expect(sampleQuestion.getInapplicableSkillMisconceptionIds())
      .toBe(undefined);
  });
});
