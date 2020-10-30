// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for numeric expression input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { NumericExpressionInputValidationService } from
// eslint-disable-next-line max-len
  'interactions/NumericExpressionInput/directives/numeric-expression-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { NumericExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory.ts';

import { AppConstants } from 'app.constants';

describe('NumericExpressionInputValidationService', () => {
  let validatorService: NumericExpressionInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let matchesExactlyWith: Rule, isEquivalentTo: Rule;
  let customizationArgs: NumericExpressionInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;
  let warnings;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NumericExpressionInputValidationService]
    });

    validatorService = TestBed.get(NumericExpressionInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArgs = {
      placeholder: {
        value: new SubtitledUnicode(
          'Type an expression here, using only numbers.', 'ca_placeholder_0')
      }
    };

    isEquivalentTo = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '3^2'
      }
    });

    matchesExactlyWith = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '3 * 3'
      }
    });

    answerGroups = [agof.createNew([], goodDefaultOutcome, null, null)];
  });

  it('should be able to perform basic validation', () => {
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch redundancy of rules with matching inputs', () => {
    // The second rule will never get matched.
    answerGroups[0].rules = [isEquivalentTo, matchesExactlyWith];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by an \'IsEquivalentTo\' rule with a matching input.'
    }]);


    let isEquivalentTo1 = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '(4+5)^2'
      }
    });
    let isEquivalentTo2 = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '81'
      }
    });

    // The second rule will never get matched.
    answerGroups[0].rules = [isEquivalentTo1, isEquivalentTo2];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by an \'IsEquivalentTo\' rule with a matching input.'
    }]);


    let matchesExactlyWith1 = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '3^2 - 1'
      }
    });
    let matchesExactlyWith2 = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '-1 + 3^2'
      }
    });

    // The second rule will never get matched.
    answerGroups[0].rules = [matchesExactlyWith1, matchesExactlyWith2];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'MatchesExactlyWith\' rule with a matching input.'
    }]);
  });

  it('should not catch redundancy of rules with non-matching inputs', () => {
    answerGroups[0].rules = [matchesExactlyWith, isEquivalentTo];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);

    matchesExactlyWith = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '2 * 3'
      }
    });
    isEquivalentTo = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '2 + 3'
      }
    });

    answerGroups[0].rules = [isEquivalentTo, matchesExactlyWith];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
});
