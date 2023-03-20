// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for multiple choice input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { MultipleChoiceInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { MultipleChoiceInputValidationService } from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';

import { AppConstants } from 'app.constants';

describe('MultipleChoiceInputValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let badOutcome: Outcome, goodAnswerGroups: AnswerGroup[],
    goodDefaultOutcome: Outcome;
  let validatorService: MultipleChoiceInputValidationService,
    customizationArguments: MultipleChoiceInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultipleChoiceInputValidationService]
    });

    validatorService = TestBed.get(MultipleChoiceInputValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      choices: {
        value: [
          new SubtitledHtml('Option 1', ''),
          new SubtitledHtml('Option 2', ''),
          new SubtitledHtml('Option 3', ''),
          new SubtitledHtml('Option 4', '')
        ]
      },
      showChoicesInShuffledOrder: {
        value: true
      }
    };

    goodAnswerGroups = [agof.createNew(
      [{
        rule_type: 'Equals',
        inputs: {
          x: 0
        }
      }, {
        rule_type: 'Equals',
        inputs: {
          x: 1
        }
      }, {
        rule_type: 'Equals',
        inputs: {
          x: 2
        }
      }, {
        rule_type: 'Equals',
        inputs: {
          x: 3
        }
      }].map(
        ruleDict => Rule.createFromBackendDict(
          ruleDict, 'MultipleChoiceInput')),
      goodDefaultOutcome,
      [],
      null)];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect a choices customization argument', () => {
    expect(() => {
      validatorService.getAllWarnings(
      // This throws "Argument of type '{}'. We need to suppress this error
      // because is not assignable to parameter of type
      // 'MultipleChoiceInputCustomizationArgs'." We are purposely assigning
      // the wrong type of customization args in order to test validations.
      // @ts-expect-error
        currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    }).toThrowError(
      'Expected customization arguments to have property: choices');
  });

  it('should expect at least two choices', () => {
    customizationArguments.choices.value = [
      new SubtitledHtml('1', '')
    ];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please enter at least 2 choices.'
    }]);
  });

  it('should expect non-empty and unique choices', () => {
    customizationArguments.choices.value[3].html = '';
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);

    customizationArguments.choices.value[3].html = 'Option 2';
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are unique.'
    }]);
  });

  it('should validate answer group rules refer to valid choices only once',
    () => {
      goodAnswerGroups[0].rules[0].inputs.x = 4;
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure learner answer 1 in Oppia response 1 refers ' +
        'to a valid choice.'
      }]);

      goodAnswerGroups[0].rules[0].inputs.x = 1;
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      // Rule 2 will be caught when trying to verify whether any rules are
      // duplicated in their input choice.
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure learner answer 2 in Oppia response 1 is not ' +
          'equaling the same multiple choice option as another ' +
          'learner answer.')
      }]);
    });

  it(
    'should expect a non-confusing and non-null default outcome only when ' +
    'not all choices are covered by rules',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      // All of the multiple choice options are targeted by rules, therefore no
      // warning should be issued for a bad default outcome.
      expect(warnings).toEqual([]);

      // Taking away 1 rule reverts back to the expect validation behavior with
      // default outcome.
      goodAnswerGroups[0].rules.splice(1, 1);
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please add something for Oppia to say in the ' +
          '\"All other answers\" response.')
      }]);
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please add something for Oppia to say in the ' +
          '\"All other answers\" response.')
      }]);
    });
});
