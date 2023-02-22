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
import { Rule } from
  'domain/exploration/rule.model';
import { NumericExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

import { AppConstants } from 'app.constants';

describe('NumericExpressionInputValidationService', () => {
  let validatorService: NumericExpressionInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let matchesExactlyWith: Rule, isEquivalentTo: Rule;
  let customizationArgs: NumericExpressionInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;
  let warnings;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NumericExpressionInputValidationService]
    });

    validatorService = TestBed.inject(NumericExpressionInputValidationService);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
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
      placeholder: {
        value: new SubtitledUnicode(
          'Type an expression here, using only numbers.', 'ca_placeholder_0')
      }
    };

    isEquivalentTo = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '3^2'
      }
    }, 'NumericExpressionInput');

    matchesExactlyWith = Rule.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '3 * 3'
      }
    }, 'NumericExpressionInput');

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
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
      'matched because it is preceded by an \'IsEquivalentTo\' answer ' +
      'with a matching input.'
    }]);


    let isEquivalentTo1 = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '(4+5)^2'
      }
    }, 'NumericExpressionInput');
    let isEquivalentTo2 = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '81'
      }
    }, 'NumericExpressionInput');

    // The second rule will never get matched.
    answerGroups[0].rules = [isEquivalentTo1, isEquivalentTo2];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
      'matched because it is preceded by an \'IsEquivalentTo\' answer ' +
      'with a matching input.'
    }]);


    let matchesExactlyWith1 = Rule.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '3^2 - 1'
      }
    }, 'NumericExpressionInput');
    let matchesExactlyWith2 = Rule.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '3^2 - 1'
      }
    }, 'NumericExpressionInput');

    // The second rule will never get matched.
    answerGroups[0].rules = [matchesExactlyWith1, matchesExactlyWith2];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
      'matched because it is preceded by a \'MatchesExactlyWith\' answer ' +
      'with a matching input.'
    }]);
  });

  it('should not catch redundancy of rules with non-matching inputs', () => {
    answerGroups[0].rules = [matchesExactlyWith, isEquivalentTo];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);

    matchesExactlyWith = Rule.createFromBackendDict({
      rule_type: 'MatchesExactlyWith',
      inputs: {
        x: '2 * 3'
      }
    }, 'NumericExpressionInput');
    isEquivalentTo = Rule.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        x: '2 + 3'
      }
    }, 'NumericExpressionInput');

    answerGroups[0].rules = [isEquivalentTo, matchesExactlyWith];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should warn if there are inputs with unsupported functions', function() {
    answerGroups[0].rules = [
      Rule.createFromBackendDict({
        rule_type: 'IsEquivalentTo',
        inputs: {
          x: '2+log(3)'
        }
      }, 'NumericExpressionInput')
    ];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);

    expect(warnings).toEqual([{
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'Input for learner answer 1 from Oppia response 1 uses these ' +
        'function(s) that aren\'t supported: [log] ' +
        'The supported functions are: [sqrt,abs]')
    }]);
  });
});
