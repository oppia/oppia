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
 * @fileoverview Unit tests for number with units validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';
import { NumberWithUnitsValidationService } from 'interactions/NumberWithUnits/directives/number-with-units-validation.service';
import { Outcome, OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { Unit } from 'interactions/answer-defs';
import { Fraction, FractionDict } from 'domain/objects/fraction.model';
import { NumberWithUnits, NumberWithUnitsObjectFactory } from 'domain/objects/NumberWithUnitsObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';

describe('NumberWithUnitsValidationService', () => {
  let validatorService: NumberWithUnitsValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let currentState: string;
  let answerGroups: AnswerGroup[];
  let goodDefaultOutcome: Outcome;
  let equalsTwoRule: Rule;
  let equalsTwoByThreeRule: Rule;
  let equivalentToTwoThousandRule: Rule;
  let equivalentToTwoByThreeRule: Rule;
  let equivalentToTwoRule: Rule;
  let oof: OutcomeObjectFactory;
  let agof: AnswerGroupObjectFactory;
  let numberWithUnitsObjectFactory: NumberWithUnitsObjectFactory;

  beforeEach(() => {
    numberWithUnitsObjectFactory = TestBed.inject(NumberWithUnitsObjectFactory);
    validatorService = TestBed.inject(NumberWithUnitsValidationService);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    var createFractionDict = (
        isNegative: boolean, wholeNumber: number, numerator: number,
        denominator: number) => {
      return {
        isNegative: isNegative,
        wholeNumber: wholeNumber,
        numerator: numerator,
        denominator: denominator
      };
    };

    var createNumberWithUnitsDict = (
        type: string, real: number, fractionDict: FractionDict,
        unitList: Unit[]) => {
      return {
        type: type,
        real: real,
        fraction: fractionDict,
        units: unitList
      };
    };

    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        content_id: null,
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    equalsTwoRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2, createFractionDict(false, 0, 0, 1),
          [{unit: 'kg', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoThousandRule = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2000, createFractionDict(false, 0, 0, 1),
          [{unit: 'g', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoRule = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2, createFractionDict(false, 0, 0, 1),
          [{unit: 'kg', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equalsTwoByThreeRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
          false, 0, 2, 3), [{unit: 'kg', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoByThreeRule = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
          false, 0, 2000, 3), [{unit: 'g', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    answerGroups = [agof.createNew(
      [equalsTwoRule, equalsTwoByThreeRule],
      goodDefaultOutcome,
      [],
      null
    )];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch equals followed by equals same value', () => {
    answerGroups[0].rules = [equalsTwoRule, equalsTwoRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be matched' +
        ' because it is made redundant by answer 1 from response 1.'
    }]);
  });

  it('should not catch equals followed by equals with unequal values',
    () => {
      answerGroups[0].rules = [equalsTwoRule, equalsTwoByThreeRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);
    });

  it('should not catch equals followed by equivalent as redundant',
    () => {
      answerGroups[0].rules = [equalsTwoRule, equivalentToTwoThousandRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);

      answerGroups[0].rules = [equalsTwoRule, equivalentToTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);
    });

  it('should catch equivalent followed by equals with equivalent values',
    () => {
      answerGroups[0].rules = [equivalentToTwoThousandRule, equalsTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Learner answer 2 from Oppia response 1 will never be ' +
        'matched because it is made redundant by answer 1 from response 1.'
      }]);
    });

  it('should not catch equivalent followed by equals with non-equivalent' +
    ' values', () => {
    answerGroups[0].rules = [equivalentToTwoThousandRule, equalsTwoByThreeRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch equivalent followed by equivalent with equivalent values',
    () => {
      answerGroups[0].rules = [equivalentToTwoThousandRule,
        equivalentToTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Learner answer 2 from Oppia response 1 will never be ' +
        'matched because it is made redundant by answer 1 from response 1.'
      }]);
    });

  it('should not catch equivalent followed by equivalent with non-equivalent' +
    ' values', () => {
    answerGroups[0].rules = [equivalentToTwoByThreeRule,
      equivalentToTwoThousandRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should throw error when rule equivalency check fails', () => {
    spyOn(numberWithUnitsObjectFactory, 'fromDict').and.returnValue({
      type: 'real',
      real: 0.0,
      // This throws "Type '{ toFloat: () => number; }' is missing the
      // following properties from type 'Fraction': isNegative, wholeNumber,
      // numerator, denominator, and 6 more." We need to suppress this error
      // because we only need to mock the toFloat function for testing.
      // @ts-expect-error
      fraction: {
        toFloat: () => {
          return 0.0;
        }
      },
      // This throws "Type null is not assignable to type
      // 'string'." We need to suppress this error
      // because of the need to test validations. This
      // function is not used in the validations.
      // @ts-ignore
      toMathjsCompatibleString: () => {
        return null;
      },
      toDict: () => {
        let uof = new UnitsObjectFactory();
        let tmp = new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), uof.fromRawInputString(
          'm / s^2'));

        return tmp.toDict();
      }
    });
    answerGroups[0].rules = [equivalentToTwoByThreeRule,
      equivalentToTwoThousandRule];
    expect(() => {
      validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
    }).toThrowError(
      'Unexpected type of argument in function unit ' +
      '(expected: number or Complex or BigNumber or Fraction or Unit or ' +
      'string or Array or Matrix or boolean, actual: null, index: 0)\n' +
      'laterInput: {"type":"real","real":2.02,"fraction":{"isNegative":false,' +
      '"wholeNumber":0,"numerator":0,"denominator":1},"units":[{"unit":"m",' +
      '"exponent":1},{"unit":"s","exponent":-2}]}\n' +
      'earlierInput: {"type":"real","real":2.02,"fraction":{"isNegative":' +
      'false,"wholeNumber":0,"numerator":0,"denominator":1},"units":[{"unit":' +
      '"m","exponent":1},{"unit":"s","exponent":-2}]}');
  });
});
