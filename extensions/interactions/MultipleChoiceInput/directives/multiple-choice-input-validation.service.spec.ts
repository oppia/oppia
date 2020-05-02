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

/* eslint-disable max-len */
import { MultipleChoiceInputValidationService } from
  'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
/* eslint-enable max-len */
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

describe('MultipleChoiceInputValidationService', () => {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'WARNING_TYPES' is a constant and its type needs to be
  // preferably in the constants file itself.
  let WARNING_TYPES: any;

  let currentState: string;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'goodAnswerGroups' is a array with elements whose type needs
  // to be researched thoroughly.
  let badOutcome: Outcome, goodAnswerGroups: any,
    goodDefaultOutcome: Outcome;
  let validatorService: MultipleChoiceInputValidationService,
    customizationArguments: any;
  let oof: OutcomeObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultipleChoiceInputValidationService]
    });

    validatorService = TestBed.get(MultipleChoiceInputValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      choices: {
        value: ['Option 1', 'Option 2']
      }
    };

    goodAnswerGroups = [{
      rules: [{
        type: 'Equals',
        inputs: {
          x: 0
        }
      }, {
        type: 'Equals',
        inputs: {
          x: 1
        }
      }],
      outcome: goodDefaultOutcome
    }];
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
        currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    }).toThrowError(
      'Expected customization arguments to have property: choices');
  });

  it('should expect non-empty and unique choices', () => {
    customizationArguments.choices.value[0] = '';
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);

    customizationArguments.choices.value[0] = 'Option 2';
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
      goodAnswerGroups[0].rules[0].inputs.x = 2;
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure rule 1 in group 1 refers to a valid choice.'
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
          'Please ensure rule 2 in group 1 is not equaling the same ' +
          'multiple choice option as another rule.')
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
