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
 * @fileoverview Unit tests for ratio expression input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { RatioExpressionInputValidationService } from
// eslint-disable-next-line max-len
  'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { RatioExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';

import { AppConstants } from 'app.constants';

describe('RatioExpressionInputValidationService', () => {
  let validatorService: RatioExpressionInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let equals: Rule, isEquivalent: Rule;
  let hasNumberOfTermsEqualTo: Rule, hasSpecificTermEqualTo: Rule;
  let customizationArgs: RatioExpressionInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;
  let warnings;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RatioExpressionInputValidationService]
    });

    validatorService = TestBed.get(RatioExpressionInputValidationService);
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
      placeholder: {
        value: new SubtitledUnicode('', '')
      },
      numberOfTerms: {
        value: 3
      }
    };

    isEquivalent = rof.createFromBackendDict({
      rule_type: 'IsEquivalent',
      inputs: {
        x: [1, 2, 3]
      }
    }, 'RatioExpressionInput');

    equals = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: [1, 2, 3]
      }
    }, 'RatioExpressionInput');

    hasNumberOfTermsEqualTo = rof.createFromBackendDict({
      rule_type: 'HasNumberOfTermsEqualTo',
      inputs: {
        y: 3
      }
    }, 'RatioExpressionInput');

    hasSpecificTermEqualTo = rof.createFromBackendDict({
      rule_type: 'HasSpecificTermEqualTo',
      inputs: {
        x: 1, y: 1
      }
    }, 'RatioExpressionInput');

    answerGroups = [agof.createNew([], goodDefaultOutcome, [], null)];
  });

  it('should be able to perform basic validation', () => {
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should be able to perform basic valid', () => {
    // The second rule has a broader scope than first.
    answerGroups[0].rules = [equals, isEquivalent];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch redundancy of rules with matching inputs', () => {
    // The second rule will never get matched.
    answerGroups[0].rules = [equals, equals];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because' +
      ' it is preceded by a \'Equals\' rule with a matching' +
      ' input.'
    }]);

    let isEquivalentNonSimplified = rof.createFromBackendDict({
      rule_type: 'IsEquivalent',
      inputs: {
        x: [2, 4, 6]
      }
    }, 'RatioExpressionInput');

    // The second rule will never get matched.
    answerGroups[0].rules = [isEquivalent, isEquivalentNonSimplified];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because' +
      ' it is preceded by a \'IsEquivalent\' rule with a matching' +
      ' input.'
    }]);

    let equalFourTerms = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: [1, 2, 3, 4]
      }
    }, 'RatioExpressionInput');

    // The second rule will never get matched.
    answerGroups[0].rules = [hasNumberOfTermsEqualTo, equals, equalFourTerms];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because ' +
      'the \'HasNumberOfTermsEqualTo\' rule is preceded by a rule with a ' +
      'matching input.'
    }, {
      type: WARNING_TYPES.ERROR,
      message: 'Rule 3 from answer group 1 will never be matched because' +
      ' it has differing number of terms than required.'
    }]);

    // The second rule will never get matched.
    answerGroups[0].rules = [hasNumberOfTermsEqualTo, hasNumberOfTermsEqualTo];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because ' +
      'it is preceded by a \'HasNumberOfTermsEqualTo\' rule with a ' +
      'matching input.'
    }]);

    let equalsTwoTerms = rof.createFromBackendDict({
      rule_type: 'Equals',
      inputs: {
        x: [1, 2]
      }
    }, 'RatioExpressionInput');
    let hasNumberOfTermsEqualToLength2 = rof.createFromBackendDict({
      rule_type: 'HasNumberOfTermsEqualTo',
      inputs: {
        y: 2
      }
    }, 'RatioExpressionInput');

    // The second rule will never get matched.
    answerGroups[0].rules = [
      equalsTwoTerms, equals, hasNumberOfTermsEqualToLength2];
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 will never be matched because' +
      ' it has differing number of terms than required.'
    }, {
      type: WARNING_TYPES.ERROR,
      message: 'Rule 3 from answer group 1 will never be matched because' +
      ' it has differing number of terms than required.'
    }]);

    // The second rule will never get matched.
    answerGroups[0].rules = [hasSpecificTermEqualTo, equals];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because ' +
      'it is preceded by a \'HasSpecificTermEqualTo\' rule with a ' +
      'matching input.'
    }]);

    let invalidHasSpecificTermEqualTo = rof.createFromBackendDict({
      rule_type: 'HasSpecificTermEqualTo',
      inputs: {
        x: 4, y: 1
      }
    }, 'RatioExpressionInput');
    answerGroups[0].rules = [invalidHasSpecificTermEqualTo];
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 will never be matched because ' +
      'it expects more terms than the answer allows.'
    }]);
  });

  it('should catch non-integer value for # terms', () => {
    customizationArgs.numberOfTerms.value = 1.5;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'The number of terms should be a non-negative integer other than 1.')
    }]);
  });

  it('should catch negative value for # terms', () => {
    customizationArgs.numberOfTerms.value = -1;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'The number of terms should be a non-negative integer other than 1.')
    }]);
  });

  it('should catch integral value 1 for # terms', () => {
    customizationArgs.numberOfTerms.value = 1;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('The number of terms in a ratio should be greater than 1.')
    }]);
  });

  it('should catch integral value greater than 10 for # terms', () => {
    customizationArgs.numberOfTerms.value = 11;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'The number of terms in a ratio should not be greater than 10.'
    }]);
  });

  it('should not catch integral value 10 for # terms', () => {
    customizationArgs.numberOfTerms.value = 10;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should not throw warnings on HasSpecificTermEqualTo when term number ' +
      'equals the expected number of terms', () => {
    let validHasSpecificTermEqualTo = rof.createFromBackendDict({
      rule_type: 'HasSpecificTermEqualTo',
      inputs: {
        x: 3, y: 1
      }
    }, 'RatioExpressionInput');
    answerGroups[0].rules = [validHasSpecificTermEqualTo];
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should not throw warnings on HasSpecificTermEqualTo when expected ' +
      'number of terms is set to 0', () => {
    let validHasSpecificTermEqualTo = rof.createFromBackendDict({
      rule_type: 'HasSpecificTermEqualTo',
      inputs: {
        x: 3, y: 1
      }
    }, 'RatioExpressionInput');
    answerGroups[0].rules = [validHasSpecificTermEqualTo];
    customizationArgs = {
      placeholder: {
        value: new SubtitledUnicode('', '')
      },
      numberOfTerms: {
        value: 0
      }
    };
    warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
});
