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
 * @fileoverview Unit tests for item selection input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
/* eslint-disable max-len */
import { ItemSelectionInputValidationService } from
  'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
/* eslint-enable max-len */
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { AppConstants } from 'app.constants';
import { WARNING_TYPES_CONSTANT } from 'app-type.constants';
import { ItemSelectionInputCustomizationArgs } from
  'interactions/customization-args-defs';

describe('ItemSelectionInputValidationService', () => {
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;
  let validatorService: ItemSelectionInputValidationService;

  let currentState: string = null;
  let goodAnswerGroups: AnswerGroup[] = null,
    goodDefaultOutcome: Outcome = null;
  let customizationArguments: ItemSelectionInputCustomizationArgs = null;
  let IsProperSubsetValidOption: AnswerGroup[] = null;
  let oof: OutcomeObjectFactory = null,
    agof: AnswerGroupObjectFactory = null,
    rof: RuleObjectFactory = null;
  let ThreeInputsAnswerGroups: AnswerGroup[] = null,
    OneInputAnswerGroups: AnswerGroup[] = null,
    NoInputAnswerGroups: AnswerGroup[] = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemSelectionInputValidationService]
    });

    validatorService = TestBed.get(ItemSelectionInputValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: 'Feedback',
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      choices: {
        value: ['Selection 1', 'Selection 2', 'Selection 3']
      },
      maxAllowableSelectionCount: {
        value: 2
      },
      minAllowableSelectionCount: {
        value: 1
      }
    };
    goodAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: ['Selection 1', 'Selection 2']
        }
      })],
      goodDefaultOutcome,
      null,
      null)
    ];
    ThreeInputsAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: ['Selection 1', 'Selection 2', 'Selection 3']
        }
      })],
      goodDefaultOutcome,
      null,
      null)
    ];
    OneInputAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: ['Selection 1']
        }
      })],
      goodDefaultOutcome,
      null,
      null)
    ];
    NoInputAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'ContainsAtLeastOneOf',
        inputs: {
          x: []
        }
      })],
      goodDefaultOutcome,
      null,
      null)
    ];
    IsProperSubsetValidOption = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'IsProperSubsetOf',
        inputs: {
          x: ['Selection 1']
        }
      })],
      goodDefaultOutcome,
      null,
      null)
    ];
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

  it(
    'should expect the minAllowableSelectionCount to be less than or ' +
    'equal to maxAllowableSelectionCount',
    () => {
      customizationArguments.minAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, ThreeInputsAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toContain({
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that the max allowed count is not less than the ' +
          'min count.')
      });
    });

  it(
    'should expect maxAllowableSelectionCount to be less than the total ' +
    'number of selections',
    () => {
      customizationArguments.maxAllowableSelectionCount.value = 3;

      // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that you have enough choices to reach the max count.')
      }]);
    });

  it(
    'should expect minAllowableSelectionCount to be less than the total ' +
    'number of selections',
    () => {
    // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      customizationArguments.minAllowableSelectionCount.value = 3;
      customizationArguments.maxAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, ThreeInputsAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that you have enough choices to reach the min count.')
      }]);
    });

  it('should expect all choices to be nonempty', () => {
    // Set the first choice to empty.
    customizationArguments.choices.value[0] = '';

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);
  });

  it('should expect all choices to be unique', () => {
    // Repeat the last choice.
    customizationArguments.choices.value.push('Selection 3');

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are unique.'
    }]);
  });

  it(
    'should expect more that 1 element to be in the rule input, if the ' +
    '"proper subset" rule is used.',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, IsProperSubsetValidOption,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'In answer group 1, ' +
          'rule 1, the "proper subset" rule must include at least 2 options.')
      }]);
    });

  it(
    'should expect number of correct options to be in between the maximum ' +
    'and minimum allowed selections when the "Equals" rule is used.',
    () => {
      // Make min allowed selections greater than correct answers.
      customizationArguments.minAllowableSelectionCount.value = 2;

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, OneInputAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'In answer group 1, rule 1, the number of correct options in ' +
          'the "Equals" rule should be between 2 and 2 (the ' +
          'minimum and maximum allowed selection counts).')
      }]);
    });

  it(
    'should expect at least one option when ' +
    '"ContainsAtLeastOneOf" rule is used.',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, NoInputAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'In answer group 1, rule 1, the "ContainsAtLeastOneOf" rule ' +
          'should have at least one option.')
      }]);
    });
});
