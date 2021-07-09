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
import { Rule, RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { Unit } from 'interactions/answer-defs';
import { FractionDict } from 'domain/objects/fraction.model';

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
  let rof: RuleObjectFactory;

  beforeEach(() => {
    validatorService = TestBed.inject(NumberWithUnitsValidationService);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
    rof = TestBed.inject(RuleObjectFactory);
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
      feedback: {
        content_id: null,
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    equalsTwoRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2, createFractionDict(false, 0, 0, 1),
          [{unit: 'kg', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoThousandRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2000, createFractionDict(false, 0, 0, 1),
          [{unit: 'g', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict(
          'real', 2, createFractionDict(false, 0, 0, 1),
          [{unit: 'kg', exponent: 1},
            {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equalsTwoByThreeRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
          false, 0, 2, 3), [{unit: 'kg', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    }, 'NumberWithUnits');

    equivalentToTwoByThreeRule = rof.createFromBackendDict({
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
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
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
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
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
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
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
});
