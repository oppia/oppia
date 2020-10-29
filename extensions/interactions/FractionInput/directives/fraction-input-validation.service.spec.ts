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
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { FractionInputValidationService } from
  'interactions/FractionInput/directives/fraction-input-validation.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { TestBed } from '@angular/core/testing';

describe('FractionInputValidationService', () => {
  var validatorService, WARNING_TYPES;

  var currentState;
  var answerGroups, goodDefaultOutcome, customizationArgs;
  var denominatorEqualsFiveRule, equalsOneAndHalfRule, equalsOneRule,
    equalsThreeByTwoRule, equivalentToOneAndSimplestFormRule,
    equivalentToOneRule, exactlyEqualToOneAndNotInSimplestFormRule,
    HasFractionalPartExactlyEqualToOneAndHalfRule,
    HasFractionalPartExactlyEqualToNegativeValue,
    HasFractionalPartExactlyEqualToThreeHalfs,
    HasFractionalPartExactlyEqualToTwoFifthsRule,
    greaterThanMinusOneRule, integerPartEqualsOne,
    integerPartEqualsZero, lessThanTwoRule, nonIntegerRule,
    numeratorEqualsFiveRule, zeroDenominatorRule;
  var createFractionDict;
  var oof, agof, rof;

  beforeEach(() => {
    validatorService = TestBed.get(FractionInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    createFractionDict = function(
        isNegative, wholeNumber, numerator, denominator) {
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
        value: ''
      }
    };

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

    equalsOneRule = rof.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 1, 1)
      }
    });

    equalsThreeByTwoRule = rof.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 3, 2)
      }
    });

    equalsOneAndHalfRule = rof.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 1, 1, 2)
      }
    });

    greaterThanMinusOneRule = rof.createFromBackendDict({
      rule_type: 'IsGreaterThan',
      inputs: {
        f: createFractionDict(true, 0, 1, 1)
      }
    });

    integerPartEqualsOne = rof.createFromBackendDict({
      rule_type: 'HasIntegerPartEqualTo',
      inputs: {
        x: 1
      }
    });

    integerPartEqualsZero = rof.createFromBackendDict({
      rule_type: 'HasIntegerPartEqualTo',
      inputs: {
        x: 0
      }
    });

    lessThanTwoRule = rof.createFromBackendDict({
      rule_type: 'IsLessThan',
      inputs: {
        f: createFractionDict(false, 0, 2, 1)
      }
    });

    equivalentToOneRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    });

    equivalentToOneAndSimplestFormRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentToAndInSimplestForm',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    });

    exactlyEqualToOneAndNotInSimplestFormRule = rof.createFromBackendDict({
      rule_type: 'IsExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 10, 10)
      }
    });

    nonIntegerRule = rof.createFromBackendDict({
      rule_type: 'HasNumeratorEqualTo',
      inputs: {
        x: 0.5
      }
    });

    zeroDenominatorRule = rof.createFromBackendDict({
      rule_type: 'HasDenominatorEqualTo',
      inputs: {
        x: 0
      }
    });

    numeratorEqualsFiveRule = rof.createFromBackendDict({
      rule_type: 'HasNumeratorEqualTo',
      inputs: {
        x: 5
      }
    });

    denominatorEqualsFiveRule = rof.createFromBackendDict({
      rule_type: 'HasDenominatorEqualTo',
      inputs: {
        x: 5
      }
    });

    HasFractionalPartExactlyEqualToTwoFifthsRule = rof.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 2, 5)
      }
    });

    HasFractionalPartExactlyEqualToOneAndHalfRule = rof.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 1, 1, 2)
      }
    });

    HasFractionalPartExactlyEqualToNegativeValue = rof.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(true, 0, 1, 2)
      }
    });

    HasFractionalPartExactlyEqualToThreeHalfs = rof.createFromBackendDict({
      rule_type: 'HasFractionalPartExactlyEqualTo',
      inputs: {
        f: createFractionDict(false, 0, 3, 2)
      }
    });

    answerGroups = [agof.createNew(
      [equalsOneRule, lessThanTwoRule],
      goodDefaultOutcome,
      false,
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
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
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
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
    }]);

    answerGroups[0].rules = [equivalentToOneAndSimplestFormRule, equalsOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
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
      message: 'Rule 1 from answer group 2 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
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
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
      }]);
    });

  it('should catch redundant rules caused by exactly equals', () => {
    answerGroups[0].rules = [exactlyEqualToOneAndNotInSimplestFormRule];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 will never be matched ' +
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
        'Rule ' + 1 + ' from answer group ' +
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
        'Rule ' + 1 + ' from answer group ' +
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
        'Rule ' + 1 + ' from answer group ' +
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
        'Rule ' + 1 + ' from answer group ' +
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
          'Rule ' + 1 + ' from answer group ' +
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
          'Rule ' + 1 + ' from answer group ' +
          1 + ' will never be matched because it has a ' +
          'non zero integer part')
      }]);
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
        'Rule ' + 1 + ' from answer group ' +
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
    customizationArgs.requireSimplestForm = false;
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
    customizationArgs.requireSimplestForm = false;
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
      customizationArgs.requireSimplestForm = false;
      answerGroups[0].rules = [HasFractionalPartExactlyEqualToOneAndHalfRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Rule 1 from answer group 1 is invalid as ' +
          'integer part should be zero')
      }]);

      customizationArgs.allowImproperFraction = false;
      answerGroups[0].rules = [HasFractionalPartExactlyEqualToThreeHalfs];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Rule 1 from answer group 1 is invalid as ' +
          'improper fractions are not allowed')
      }]);

      answerGroups[0].rules = [HasFractionalPartExactlyEqualToNegativeValue];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Rule 1 from answer group 1 is invalid as ' +
          'sign should be positive')
      }]);

      customizationArgs.allowImproperFraction = true;
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
          'Rule 1 from answer group 2 will never be matched because it ' +
          'is made redundant by rule 1 from answer group 1.')
      }]);
    });
});
