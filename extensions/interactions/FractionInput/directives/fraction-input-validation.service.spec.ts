// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for fraction input validation service.
 */
import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { FractionInputValidationService } from
  'interactions/FractionInput/directives/fraction-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { TestBed } from '@angular/core/testing';
import { FractionInputCustomizationArgs } from 'interactions/customization-args-defs';
import { FractionDict } from 'domain/objects/fraction.model';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';

describe('FractionInputValidationService', () => {
  let validatorService: FractionInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let currentState: string;
  let answerGroups: AnswerGroup[];
  let goodDefaultOutcome: Outcome;
  let customizationArgs: FractionInputCustomizationArgs;
  let denominatorEqualsFiveRule: Rule, equalsOneAndHalfRule: Rule,
    equalsOneRule: Rule, equalsThreeByTwoRule: Rule,
    equivalentToOneAndSimplestFormRule: Rule, equivalentToOneRule: Rule,
    exactlyEqualToOneAndNotInSimplestFormRule: Rule,
    HasFractionalPartExactlyEqualToOneAndHalfRule: Rule,
    HasFractionalPartExactlyEqualToNegativeValue: Rule,
    HasFractionalPartExactlyEqualToThreeHalfs: Rule,
    HasFractionalPartExactlyEqualToTwoFifthsRule: Rule,
    HasNoFractionalPart: Rule, greaterThanMinusOneRule: Rule,
    integerPartEqualsOne: Rule, integerPartEqualsZero: Rule,
    lessThanTwoRule: Rule, nonIntegerRule: Rule, numeratorEqualsFiveRule: Rule,
    zeroDenominatorRule: Rule;
  let createFractionDict: (
    isNegative: boolean, wholeNumber: number,
        numerator: number, denominator: number) => FractionDict;
  let oof: OutcomeObjectFactory;
  let agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    validatorService = TestBed.inject(FractionInputValidationService);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    createFractionDict = (
        isNegative: boolean, wholeNumber: number, numerator: number,
        denominator: number): FractionDict => {
      return {
        isNegative: isNegative,
        wholeNumber: wholeNumber,
        numerator: numerator,
        denominator: denominator
      };
    };

    customizationArgs = {
      requireSimplestForm: {
        value: true
      },
      allowImproperFraction: {
        value: true
      },
      allowNonzeroIntegerPart: {
        value: true
      },
      customPlaceholder: {
        value: new SubtitledUnicode('', '')
      }
    };

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

    equalsOneRule = Rule.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 1, 1)
      }
    }, 'FractionInput');

    equalsThreeByTwoRule = Rule.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 3, 2)
      }
    }, 'FractionInput');

    equalsOneAndHalfRule = Rule.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 1, 1, 2)
      }
    }, 'FractionInput');

    greaterThanMinusOneRule = Rule.createFromBackendDict({
      rule_type: 'IsGreaterThan',
      inputs: {
        f: createFractionDict(true, 0, 1, 1)
      }
    }, 'FractionInput');

    integerPartEqualsOne = Rule.createFromBackendDict({
      rule_type: 'HasIntegerPartEqualTo',
      inputs: {
        x: 1
      }
    }, 'FractionInput');

    integerPartEqualsZero = Rule.createFromBackendDict({
      rule_type: 'HasIntegerPartEqualTo',
      inputs: {
        x: 0
      }
    }, 'FractionInput');

    lessThanTwoRule = Rule.createFromBackendDict({
      rule_type: 'IsLessThan',
      inputs: {
        f: createFractionDict(false, 0, 2, 1)
      }
    }, 'FractionInput');

    equivalentToOneRule = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    }, 'FractionInput');

    equivalentToOneAndSimplestFormRule = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentToAndInSimplestForm',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    }, 'FractionInput');

    exactlyEqualToOneAndNotInSimplestFormRule = Rule.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    }, 'FractionInput');

    nonIntegerRule = Rule.createFromBackendDict({
      rule_type: 'HasNumeratorEqualTo',
      inputs: {
        x: 0.5
      }
    }, 'FractionInput');

    zeroDenominatorRule = Rule.createFromBackendDict({
      rule_type: 'HasDenominatorEqualTo',
      inputs: {
        x: 0
      }
    }, 'FractionInput');

    numeratorEqualsFiveRule = Rule.createFromBackendDict({
      rule_type: 'HasNumeratorEqualTo',
      inputs: {
        x: 5
      }
    }, 'FractionInput');

    denominatorEqualsFiveRule = Rule.createFromBackendDict({
      rule_type: 'HasDenominatorEqualTo',
      inputs: {
        x: 5
      }
    }, 'FractionInput');

    HasFractionalPartExactlyEqualToTwoFifthsRule = Rule.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 2, 5)
      }
    }, 'FractionInput');

    HasFractionalPartExactlyEqualToOneAndHalfRule = Rule.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 1, 1, 2)
      }
    }, 'FractionInput');

    HasFractionalPartExactlyEqualToNegativeValue = Rule.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(true, 0, 1, 2)
      }
    }, 'FractionInput');

    HasFractionalPartExactlyEqualToThreeHalfs = Rule.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 3, 2)
      }
    }, 'FractionInput');

    HasNoFractionalPart = Rule.createFromBackendDict({
      rule_type: 'HasNoFractionalPart',
      inputs: {
        f: createFractionDict(false, 2, 0, 1)
      }
    }, 'FractionInput');

    answerGroups = [agof.createNew(
      [equalsOneRule, lessThanTwoRule],
      goodDefaultOutcome,
      [],
      null
    )];
  });

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch redundant rules', function() {
    answerGroups[0].rules = [lessThanTwoRule, equalsOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be matched' +
        ' because it is made redundant by answer 1 from Oppia response 1.'
    }]);
  });

  it('should not catch equals followed by equivalent as redundant', function() {
    answerGroups[0].rules = [equalsOneRule, equivalentToOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);

    answerGroups[0].rules = [equalsOneRule, equivalentToOneAndSimplestFormRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch equivalent followed by equals same value' +
    'as redundant', function() {
    answerGroups[0].rules = [equivalentToOneRule, equalsOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
        'matched because it is made redundant by answer 1 from ' +
        'Oppia response 1.'
    }]);

    answerGroups[0].rules = [equivalentToOneAndSimplestFormRule, equalsOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
        'matched because it is made redundant by answer 1 from ' +
        'Oppia response 1.'
    }]);
  });

  it('should catch redundant rules in separate answer groups', () => {
    answerGroups[1] = cloneDeep(answerGroups[0]);
    answerGroups[0].rules = [greaterThanMinusOneRule];
    answerGroups[1].rules = [equalsOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 1 from Oppia response 2 will never be ' +
        'matched because it is made redundant by answer 1 from ' +
        'Oppia response 1.'
    }]);
  });

  it('should catch redundant rules caused by greater/less than range',
    () => {
      answerGroups[0].rules = [greaterThanMinusOneRule, equalsOneRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Learner answer 2 from Oppia response 1 will never be ' +
        'matched because it is made redundant by answer 1 from ' +
        'Oppia response 1.'
      }]);
    });

  it('should catch redundant rules caused by exactly equals', () => {
    answerGroups[0].rules = [exactlyEqualToOneAndNotInSimplestFormRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 1 from Oppia response 1 will never be matched ' +
        'because it is not in simplest form.'
    }]);
  });

  it('should catch non integer inputs in the numerator', () => {
    answerGroups[0].rules = [nonIntegerRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + 1 + ' from Oppia response ' +
        1 + ' is invalid: input should be an ' +
        'integer.')
    }]);
  });

  it('should catch non integer inputs in the whole number', () => {
    nonIntegerRule.type = 'HasIntegerPartEqualTo';
    answerGroups[0].rules = [nonIntegerRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + 1 + ' from Oppia response ' +
        1 + ' is invalid: input should be an ' +
        'integer.')
    }]);
  });

  it('should catch non integer inputs in the denominator', () => {
    nonIntegerRule.type = 'HasDenominatorEqualTo';
    answerGroups[0].rules = [nonIntegerRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + 1 + ' from Oppia response ' +
        1 + ' is invalid: input should be an ' +
        'integer.')
    }]);
  });

  it('should catch zero input in denominator', () => {
    answerGroups[0].rules = [zeroDenominatorRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + 1 + ' from Oppia response ' +
        1 + ' is invalid: denominator should be ' +
        'greater than zero.')
    }]);
  });

  it('should catch not allowImproperFraction and rule has improper fraction',
    () => {
      customizationArgs.allowImproperFraction.value = false;
      answerGroups[0].rules = [equalsThreeByTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer ' + 1 + ' from Oppia response ' +
          1 + ' will never be matched because it is an ' +
          'improper fraction')
      }]);
    });

  it('should catch not allowNonzeroIntegerPart and rule has integer part',
    () => {
      customizationArgs.allowNonzeroIntegerPart.value = false;
      answerGroups[0].rules = [equalsOneAndHalfRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer ' + 1 + ' from Oppia response ' +
          1 + ' will never be matched because it has a ' +
          'non zero integer part')
      }]);
    });

  it('should not catch anything when there is no fractional part',
    () => {
      customizationArgs.allowNonzeroIntegerPart.value = false;
      answerGroups[0].rules = [HasNoFractionalPart];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([]);
    });

  it('should catch if not allowNonzeroIntegerPart and ' +
    'rule is HasIntegerPartEqualTo a non zero value', () => {
    customizationArgs.allowNonzeroIntegerPart.value = false;
    answerGroups[0].rules = [integerPartEqualsOne];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Learner answer ' + 1 + ' from Oppia response ' +
        1 + ' will never be matched because integer part ' +
        'has to be zero')
    }]);
  });

  it('should allow if not allowNonzeroIntegerPart and ' +
    'rule is HasIntegerPartEqualTo a zero value', () => {
    customizationArgs.allowNonzeroIntegerPart.value = false;
    answerGroups[0].rules = [integerPartEqualsZero];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should allow equivalent fractions with if not requireSimplestForm ' +
    'and rules are IsExactlyEqualTo', () => {
    customizationArgs.requireSimplestForm.value = false;
    answerGroups[1] = cloneDeep(answerGroups[0]);
    answerGroups[0].rules = [equalsOneRule];
    answerGroups[1].rules = [exactlyEqualToOneAndNotInSimplestFormRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should allow if numerator and denominator should equal the same value ' +
    'and are set in different rules', () => {
    customizationArgs.requireSimplestForm.value = false;
    answerGroups[1] = cloneDeep(answerGroups[0]);
    answerGroups[0].rules = [numeratorEqualsFiveRule];
    answerGroups[1].rules = [denominatorEqualsFiveRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should correctly check validity of HasFractionalPartExactlyEqualTo rule',
    () => {
      customizationArgs.requireSimplestForm.value = false;
      answerGroups[0].rules = [HasFractionalPartExactlyEqualToOneAndHalfRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer 1 from Oppia response 1 is invalid as ' +
          'integer part should be zero')
      }]);

      customizationArgs.allowImproperFraction.value = false;
      answerGroups[0].rules = [HasFractionalPartExactlyEqualToThreeHalfs];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer 1 from Oppia response 1 is invalid as ' +
          'improper fractions are not allowed')
      }]);

      answerGroups[0].rules = [HasFractionalPartExactlyEqualToNegativeValue];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer 1 from Oppia response 1 is invalid as ' +
          'sign should be positive')
      }]);

      customizationArgs.allowImproperFraction.value = true;
      answerGroups[0].rules = [HasFractionalPartExactlyEqualToTwoFifthsRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([]);

      answerGroups[1] = cloneDeep(answerGroups[0]);
      answerGroups[0].rules = [denominatorEqualsFiveRule];
      answerGroups[1].rules = [HasFractionalPartExactlyEqualToTwoFifthsRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Learner answer 1 from Oppia response 2 will never be ' +
          'matched because it is made redundant by ' +
          'answer 1 from Oppia response 1.')
      }]);
    });
});
