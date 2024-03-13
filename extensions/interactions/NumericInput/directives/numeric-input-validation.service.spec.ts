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
 * @fileoverview Unit tests for numeric input validation service.
 */

import cloneDeep from 'lodash/cloneDeep';

import {TestBed} from '@angular/core/testing';

import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {NumericInputCustomizationArgs} from 'extensions/interactions/customization-args-defs';
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {Rule} from 'domain/exploration/rule.model';

import {AppConstants} from 'app.constants';
import {Warning} from 'interactions/base-interaction-validation.service';

describe('NumericInputValidationService', () => {
  let validatorService: NumericInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let currentState: string;
  let answerGroups: AnswerGroup[],
    goodDefaultOutcome: Outcome,
    customizationArgs: NumericInputCustomizationArgs;
  let equalsZeroRule: Rule,
    equalsZeroRuleLessThanZero: Rule,
    betweenNegativeOneAndOneRule: Rule,
    betweenOneAndOneRule: Rule,
    betweenFourAndTwoRule: Rule,
    lessThanOneRule: Rule,
    lessThanOneRuleLessThanZero: Rule,
    greaterThanNegativeOneRule: Rule,
    lessThanOrEqualToOneRule: Rule,
    lessThanOrEqualToOneRuleLessThanZero: Rule,
    greaterThanOrEqualToNegativeOneRule: Rule,
    zeroWithinToleranceOfOneRule: Rule,
    zeroWithinToleranceOfOneRuleLessThanZero: Rule,
    nonPositiveToleranceRule: Rule;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NumericInputValidationService],
    });

    validatorService = TestBed.inject(NumericInputValidationService);

    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);

    customizationArgs = {
      requireNonnegativeInput: {
        value: true,
      },
    };
    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        content_id: '',
        html: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    equalsZeroRule = Rule.createFromBackendDict(
      {
        rule_type: 'Equals',
        inputs: {
          x: 0,
        },
      },
      'NumericInput'
    );
    betweenNegativeOneAndOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsInclusivelyBetween',
        inputs: {
          a: -1,
          b: 1,
        },
      },
      'NumericInput'
    );
    betweenOneAndOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsInclusivelyBetween',
        inputs: {
          a: 1,
          b: 1,
        },
      },
      'NumericInput'
    );
    betweenFourAndTwoRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsInclusivelyBetween',
        inputs: {
          a: 4,
          b: 2,
        },
      },
      'NumericInput'
    );
    lessThanOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsLessThan',
        inputs: {
          x: 1,
        },
      },
      'NumericInput'
    );
    greaterThanNegativeOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsGreaterThan',
        inputs: {
          x: -1,
        },
      },
      'NumericInput'
    );
    lessThanOrEqualToOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsLessThanOrEqualTo',
        inputs: {
          x: 1,
        },
      },
      'NumericInput'
    );
    greaterThanOrEqualToNegativeOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsGreaterThanOrEqualTo',
        inputs: {
          x: -1,
        },
      },
      'NumericInput'
    );
    zeroWithinToleranceOfOneRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsWithinTolerance',
        inputs: {
          x: 0,
          tol: 1,
        },
      },
      'NumericInput'
    );
    zeroWithinToleranceOfOneRuleLessThanZero = Rule.createFromBackendDict(
      {
        rule_type: 'IsWithinTolerance',
        inputs: {
          x: -2,
          tol: 1,
        },
      },
      'NumericInput'
    );
    nonPositiveToleranceRule = Rule.createFromBackendDict(
      {
        rule_type: 'IsWithinTolerance',
        inputs: {
          x: 2,
          tol: -1,
        },
      },
      'NumericInput'
    );
    lessThanOneRuleLessThanZero = Rule.createFromBackendDict(
      {
        rule_type: 'IsLessThan',
        inputs: {
          x: -1,
        },
      },
      'NumericInput'
    );
    equalsZeroRuleLessThanZero = Rule.createFromBackendDict(
      {
        rule_type: 'Equals',
        inputs: {
          x: -1,
        },
      },
      'NumericInput'
    );
    lessThanOrEqualToOneRuleLessThanZero = Rule.createFromBackendDict(
      {
        rule_type: 'IsLessThanOrEqualTo',
        inputs: {
          x: -1,
        },
      },
      'NumericInput'
    );
    answerGroups = [
      agof.createNew(
        [equalsZeroRule, betweenNegativeOneAndOneRule],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 upper bound of the range should be ' +
          'greater than or equal to zero.',
      },
    ]);
  });

  it('should show warning if tolerance is not positive for IsWithinTolerance', () => {
    answerGroups[0].rules = [nonPositiveToleranceRule];

    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );

    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message: 'Learner answer 1 tolerance must be a positive value.',
      },
    ]);
  });

  it('should show warning if input less than zero for IsWithinTolerance', () => {
    answerGroups[0].rules = [zeroWithinToleranceOfOneRuleLessThanZero];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(customizationArgs.requireNonnegativeInput.value).toBe(true);
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 Upper bound of the tolerance ' +
          'range should be greater than or equal to zero.',
      },
    ]);
  });

  it('should show warning if input less than zero for IsLessThan', () => {
    answerGroups[0].rules = [lessThanOneRuleLessThanZero];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(customizationArgs.requireNonnegativeInput.value).toBe(true);
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 input should be greater than ' +
          'or equal to zero.',
      },
    ]);
  });

  it('should show warning if input less than zero for Equals', () => {
    answerGroups[0].rules = [equalsZeroRuleLessThanZero];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(customizationArgs.requireNonnegativeInput.value).toBe(true);
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 input should be greater than ' +
          'or equal to zero.',
      },
    ]);
  });

  it('should show warning if input less than zero for IsLessThanOrEqualTo', () => {
    answerGroups[0].rules = [lessThanOrEqualToOneRuleLessThanZero];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(customizationArgs.requireNonnegativeInput.value).toBe(true);
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 input should be greater than ' +
          'or equal to zero.',
      },
    ]);
  });

  it(
    'should raise warning for IsInclusivelyBetween rule ' +
      'caused by incorrect range',
    () => {
      answerGroups[0].rules = [betweenOneAndOneRule, betweenFourAndTwoRule];

      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArgs,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In learner answer 1 from Oppia response 1, Please ensure ' +
            'that the second number is greater than the first number.',
        },
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In learner answer 2 from Oppia response 1, Please ensure ' +
            'that the second number is greater than the first number.',
        },
      ]);
    }
  );

  it('should catch redundant rules', () => {
    answerGroups[0].rules = [betweenNegativeOneAndOneRule, equalsZeroRule];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 upper bound of the range should be ' +
          'greater than or equal to zero.',
      },
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be matched' +
          ' because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should catch identical rules as redundant', () => {
    answerGroups[0].rules = [equalsZeroRule, equalsZeroRule];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be matched' +
          ' because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should catch redundant rules in separate answer groups', () => {
    answerGroups[1] = cloneDeep(answerGroups[0]);
    answerGroups[0].rules = [betweenNegativeOneAndOneRule];
    answerGroups[1].rules = [equalsZeroRule];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 upper bound of the range should be ' +
          'greater than or equal to zero.',
      },
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 from Oppia response 2 will never be matched' +
          ' because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should catch redundant rules caused by greater/less than range', () => {
    var warnings: Warning[];
    answerGroups[0].rules = [lessThanOneRule, equalsZeroRule];
    warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.',
      },
    ]);
    answerGroups[0].rules = [greaterThanNegativeOneRule, equalsZeroRule];
    warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should catch redundant rules caused by greater/less than or equal range', () => {
    var warnings: Warning[];
    answerGroups[0].rules = [lessThanOrEqualToOneRule, equalsZeroRule];
    warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.',
      },
    ]);
    answerGroups[0].rules = [
      greaterThanOrEqualToNegativeOneRule,
      equalsZeroRule,
    ];
    warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should catch redundant rules caused by within tolerance range', () => {
    answerGroups[0].rules = [zeroWithinToleranceOfOneRule, equalsZeroRule];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.',
      },
    ]);
  });

  it('should generate errors for string representation of the input', () => {
    expect(validatorService.validateNumericString('12.f3', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_NO_INVALID_CHARS'
    );
    expect(validatorService.validateNumericString('12.', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_NO_TRAILING_DECIMAL'
    );
    expect(validatorService.validateNumericString('12.22.1', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_DECIMAL'
    );
    expect(validatorService.validateNumericString('12-', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_MINUS_AT_BEGINNING'
    );
    expect(validatorService.validateNumericString('--12', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_MINUS'
    );
    expect(validatorService.validateNumericString('12e12e', '.')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_ATMOST_1_EXPONENT'
    );
  });

  it('should generate errors in the given input', () => {
    expect(validatorService.validateNumber(-999999999, true)).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_LESS_THAN_ZERO'
    );
    expect(validatorService.validateNumber(1200000000e27, false)).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_GREATER_THAN_15_DIGITS_DOT'
    );
    expect(validatorService.validateNumber(1200000000e-27, false, ',')).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_GREATER_THAN_15_DIGITS_COMMA'
    );
    expect(validatorService.validateNumber(999999999999999, false)).toEqual(
      undefined
    );
    expect(validatorService.validateNumber(99.9999999999999, false)).toEqual(
      undefined
    );
    expect(validatorService.validateNumber(-9.9999999999999, false)).toEqual(
      undefined
    );
    expect(validatorService.validateNumber(2.2, false)).toEqual(undefined);
    expect(validatorService.validateNumber(-2.2, false)).toEqual(undefined);
    expect(validatorService.validateNumber(34.56, false)).toEqual(undefined);
    expect(validatorService.validateNumber(99999999999999, true)).toEqual(
      undefined
    );
    expect(validatorService.validateNumber(-99999999999999, true)).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_LESS_THAN_ZERO'
    );
    expect(validatorService.validateNumber(Number('wqw'), true)).toEqual(
      'I18N_INTERACTIONS_NUMERIC_INPUT_INVALID_NUMBER'
    );
  });
});
