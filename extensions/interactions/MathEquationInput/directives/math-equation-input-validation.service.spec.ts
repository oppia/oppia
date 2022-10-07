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
 * @fileoverview Unit tests for math equation input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { MathEquationInputValidationService } from
// eslint-disable-next-line max-len
  'interactions/MathEquationInput/directives/math-equation-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { MathEquationInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';

import { AppConstants } from 'app.constants';

describe('MathEquationInputValidationService', () => {
  let validatorService: MathEquationInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let matchesExactlyWith: Rule, isEquivalentTo: Rule;
  let customizationArgs: MathEquationInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;
  let warnings;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MathEquationInputValidationService]
    });

    validatorService = TestBed.get(MathEquationInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

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

    customizationArgs = {
      useFractionForDivision: false,
      allowedVariables: {
        value: ['x', 'y', 'm', 'x', 'c', 'a', 'b']
      }
    };

    isEquivalentTo = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: 'y = c + m*x'
      }
    }, 'MathEquationInput');

    matchesExactlyWith = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: 'y = m*x + c',
        y: 'both'
      }
    }, 'MathEquationInput');

    answerGroups = [agof.createNew([], goodDefaultOutcome, [], null)];
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
        x: '(a+b)^2 = 0'
      }
    }, 'MathEquationInput');
    let isEquivalentTo2 = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: 'a^2 + 2*a*b + b^2 = 0'
      }
    }, 'MathEquationInput');

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
        x: 'x*x = 1',
        y: 'irrelevant'
      }
    }, 'MathEquationInput');
    let matchesExactlyWith2 = rof.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '-1 + x*x = 0',
        y: 'irrelevant'
      }
    }, 'MathEquationInput');

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
        x: 'x * y = 0',
        y: 'both'
      }
    }, 'MathEquationInput');
    isEquivalentTo = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: 'x + y = 0'
      }
    }, 'MathEquationInput');

    answerGroups[0].rules = [isEquivalentTo, matchesExactlyWith];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should warn if there are missing custom variables', function() {
    answerGroups[0].rules = [
      rof.createFromBackendDict({
        rule_type: 'IsEquivalentTo',
        inputs: {
          x: 'x^2 = alpha - y/b'
        }
      }, 'MathEquationInput')
    ];
    customizationArgs = {
      useFractionForDivision: false,
      allowedVariables: {
        value: ['y', 'a', 'b']
      }
    };

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'The following variables are present in some of the answer groups ' +
        'but are missing from the custom letters list: x,α')
    }]);
  });

  it('should warn if there are too many custom variables', function() {
    answerGroups[0].rules = [
      rof.createFromBackendDict({
        rule_type: 'IsEquivalentTo',
        inputs: {
          x: 'x=y'
        }
      }, 'MathEquationInput')
    ];
    customizationArgs = {
      useFractionForDivision: false,
      allowedVariables: {
        value: ['y', 'x', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
      }
    };

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.ERROR,
      message: 'The number of custom letters cannot be more than 10.'
    }]);
  });

  it('should warn if there are inputs with unsupported functions', function() {
    answerGroups[0].rules = [
      rof.createFromBackendDict({
        rule_type: 'IsEquivalentTo',
        inputs: {
          x: 'x+log(y)=tan(x) - sqrt(y)'
        }
      }, 'MathEquationInput')
    ];
    customizationArgs = {
      useFractionForDivision: false,
      allowedVariables: {
        value: ['x', 'y']
      }
    };

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);

    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'Input for rule 1 from answer group 1 uses these function(s) that ' +
        'aren\'t supported: [log,tan] The supported functions are: [sqrt,abs]')
    }]);
  });
});
