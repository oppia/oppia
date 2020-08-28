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

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { NumericInputValidationService } from
  'interactions/NumericInput/directives/numeric-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { AppConstants } from 'app.constants';
import { WARNING_TYPES_CONSTANT } from 'app-type.constants';

describe('NumericInputValidationService', () => {
  let validatorService: NumericInputValidationService;
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let betweenNegativeOneAndOneRule: Rule, equalsZeroRule: Rule,
    lessThanOneRule: Rule;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NumericInputValidationService]
    });

    validatorService = TestBed.get(NumericInputValidationService);

    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);

    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        content_id: '',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });
    equalsZeroRule = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: 0
      }
    });
    betweenNegativeOneAndOneRule = rof.createFromBackendDict({
      rule_type: 'IsInclusivelyBetween',
      inputs: {
        a: -1,
        b: 1
      }
    });
    lessThanOneRule = rof.createFromBackendDict({
      rule_type: 'IsLessThan',
      inputs: {
        x: 1
      }
    });
    const answerGroup = agof.createNew(goodDefaultOutcome, null, null);
    answerGroup.updateRuleTypesToInputs(
      [equalsZeroRule, betweenNegativeOneAndOneRule]);
    answerGroups = [answerGroup];
  });

  it('should be able to perform basic validation', () => {
    const answerGroup = agof.createNew(goodDefaultOutcome, null, null);
    var warnings = validatorService.getAllWarnings(
      currentState, {}, [answerGroup], goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch redundant rules', () => {
    answerGroups[0].updateRuleTypesToInputs(
      [betweenNegativeOneAndOneRule, equalsZeroRule]);
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should catch identical rules as redundant', () => {
    answerGroups[0].updateRuleTypesToInputs([equalsZeroRule, equalsZeroRule]);
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should catch redundant rules in separate answer groups', () => {
    answerGroups[1] = cloneDeep(answerGroups[0]);
    answerGroups[0].updateRuleTypesToInputs([betweenNegativeOneAndOneRule]);
    answerGroups[1].updateRuleTypesToInputs([equalsZeroRule]);
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 2 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should catch redundant rules caused by greater/less than range',
    () => {
      answerGroups[0].updateRuleTypesToInputs(
        [lessThanOneRule, equalsZeroRule]);
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
      }]);
    });

  it('should generate errors in the given input', () => {
    expect(validatorService.getErrorString(undefined)).toEqual(
      'Please enter a valid number.');
    expect(validatorService.getErrorString(null)).toEqual(
      'Please enter a valid number.');
    expect(validatorService.getErrorString(1200000000E+27)).toEqual(
      'The answer can contain at most 15 digits (0-9) or symbols (. or -).');
    expect(validatorService.getErrorString(1200000000E-27)).toEqual(
      'The answer can contain at most 15 digits (0-9) or symbols (. or -).');
    expect(validatorService.getErrorString(999999999999999)).toEqual(
      undefined);
    expect(validatorService.getErrorString(99.9999999999999)).toEqual(
      undefined);
    expect(validatorService.getErrorString(-9.9999999999999)).toEqual(
      undefined);
    expect(validatorService.getErrorString(2.2)).toEqual(undefined);
    expect(validatorService.getErrorString(-2.2)).toEqual(undefined);
    expect(validatorService.getErrorString(34.56)).toEqual(undefined);
  });
});
