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
 * @fileoverview Unit tests for set input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { SetInputValidationService } from
  'interactions/SetInput/directives/set-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { WARNING_TYPES_CONSTANT } from 'app-type.constants';
import { AppConstants } from 'app.constants';

describe('SetInputValidationService', () => {
  let validatorService: SetInputValidationService;
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;

  let currentState: string;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;

  let goodCustomizationArgs: object;

  let equalsRule1: Rule, equalsRule2: Rule;
  let subsetRuleSmall: Rule, subsetRuleLarge: Rule;
  let omitElementRuleSmall: Rule, omitElementRuleLarge: Rule;

  let createAnswerGroupByRules: (rules: Rule[]) => AnswerGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SetInputValidationService]
    });

    validatorService = TestBed.get(SetInputValidationService);

    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);

    goodCustomizationArgs = { buttonText: { value: 'Add Item'} };

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

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, false, null)];

    subsetRuleSmall = rof.createFromBackendDict({
      rule_type: 'IsSubsetOf',
      inputs: {
        x: ['1']
      }
    });
    subsetRuleLarge = rof.createFromBackendDict({
      rule_type: 'IsSubsetOf',
      inputs: {
        x: ['1', '2', '3']
      }
    });
    omitElementRuleSmall = rof.createFromBackendDict({
      rule_type: 'OmitsElementsIn',
      inputs: {
        x: ['1']
      }
    });
    omitElementRuleLarge = rof.createFromBackendDict({
      rule_type: 'OmitsElementsIn',
      inputs: {
        x: ['1', '2', '3']
      }
    });
    equalsRule1 = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: ['5', '6', '7']
      }
    });
    equalsRule2 = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: ['5', '6', '8']
      }
    });

    createAnswerGroupByRules = (rules) => agof.createNew(
      rules,
      goodDefaultOutcome,
      false,
      null
    );
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      goodCustomizationArgs,
      goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch errors in customizationArgs', () => {
    let badCustomizationArgs1 = {};
    let badCustomizationArgs2 = { buttonText: { value: 1 } };
    let badCustomizationArgs3 = { buttonText: { value: '' } };

    expect(validatorService.getAllWarnings(
      currentState, goodCustomizationArgs, goodAnswerGroups, goodDefaultOutcome
    )).toEqual([]);

    expect(validatorService.getAllWarnings(
      currentState, badCustomizationArgs1, goodAnswerGroups, goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Button text must be a string.'
    }]);

    expect(validatorService.getAllWarnings(
      currentState, badCustomizationArgs2, goodAnswerGroups, goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Button text must be a string.'
    }]);

    expect(validatorService.getAllWarnings(
      currentState, badCustomizationArgs3, goodAnswerGroups, goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Label for this button should not be empty.'
    }]);
  });

  it('should generate errors with identical rules', () => {
    let answerGroup = createAnswerGroupByRules(
      [subsetRuleSmall, subsetRuleSmall, subsetRuleLarge]
    );

    expect(validatorService.getAllWarnings(
      currentState, goodCustomizationArgs, [answerGroup], goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 is the same as rule 1 from answer' +
      ' group 1'
    }]);
  });

  it('should generate errors with redundant rules', () => {
    let answerGroup1 = createAnswerGroupByRules(
      [subsetRuleLarge, subsetRuleSmall]
    );

    let answerGroup2 = createAnswerGroupByRules(
      [omitElementRuleSmall, omitElementRuleLarge]
    );

    expect(validatorService.getAllWarnings(
      currentState, goodCustomizationArgs, [answerGroup1], goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it ' +
      'is made redundant by rule 1 from answer group 1.'
    }]);

    expect(validatorService.getAllWarnings(
      currentState, goodCustomizationArgs, [answerGroup2], goodDefaultOutcome
    )).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it ' +
      'is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should not generate errors with non-redundant rules', () => {
    let answerGroup = createAnswerGroupByRules([
      subsetRuleSmall,
      subsetRuleLarge,
      omitElementRuleLarge,
      omitElementRuleSmall,
      equalsRule1,
      equalsRule2
    ]);

    expect(validatorService.getAllWarnings(
      currentState, goodCustomizationArgs, [answerGroup], goodDefaultOutcome
    )).toEqual([]);
  });
});
