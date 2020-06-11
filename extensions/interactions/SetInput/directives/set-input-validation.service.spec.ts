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

    createAnswerGroupByRules = (rules) => agof.createNew(
      rules,
      goodDefaultOutcome,
      false,
      null
    );
  });

  // TODO: rename it
  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      goodCustomizationArgs,
      goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  describe('.getCustomizationArgsWarnings', () => {
    it('should not generate error with correct customizationArgs', () => {
      expect(validatorService.getAllWarnings(
        currentState,
        goodCustomizationArgs,
        goodAnswerGroups,
        goodDefaultOutcome
      )).toEqual([]);
    });

    it('should generate errors when buttonText is missing', () => {
      let badCustomizationArgs = {};

      expect(validatorService.getAllWarnings(
        currentState,
        badCustomizationArgs,
        goodAnswerGroups,
        goodDefaultOutcome
      )).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Button text must be a string.'
      }]);
    });

    it('should generate errors when buttonText is not string', () => {
      let badCustomizationArgs = { buttonText: { value: 1 } };

      expect(validatorService.getAllWarnings(
        currentState,
        badCustomizationArgs,
        goodAnswerGroups,
        goodDefaultOutcome
      )).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Button text must be a string.'
      }]);
    });

    it('should generate errors when buttonText is empty', () => {
      let badCustomizationArgs = { buttonText: { value: '' } };

      expect(validatorService.getAllWarnings(
        currentState,
        badCustomizationArgs,
        goodAnswerGroups,
        goodDefaultOutcome
      )).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Label for this button should not be empty.'
      }]);
    });
  });

  describe('.getRedundantRuleWarnings', () => {
    describe('check identical rules', () => {
      describe('Equals', () => {
        it('should generate errors with identical rules', () => {
          let equalsRule = rof.createFromBackendDict({
            rule_type: 'Equals',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [equalsRule, equalsRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let equalsRule1 = rof.createFromBackendDict({
            rule_type: 'Equals',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let equalsRule2 = rof.createFromBackendDict({
            rule_type: 'Equals',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [equalsRule1, equalsRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('IsSubsetOf', () => {
        it('should generate errors with identical rules', () => {
          let subsetRule = rof.createFromBackendDict({
            rule_type: 'IsSubsetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [subsetRule, subsetRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let subsetRule1 = rof.createFromBackendDict({
            rule_type: 'IsSubsetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let subsetRule2 = rof.createFromBackendDict({
            rule_type: 'IsSubsetOf',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [subsetRule1, subsetRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('HasElementsIn', () => {
        it('should generate errors with identical rules', () => {
          let hasElementsInRule = rof.createFromBackendDict({
            rule_type: 'HasElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [hasElementsInRule, hasElementsInRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let hasElementsInRule1 = rof.createFromBackendDict({
            rule_type: 'HasElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let hasElementsInRule2 = rof.createFromBackendDict({
            rule_type: 'HasElementsIn',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [hasElementsInRule1, hasElementsInRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('IsDisjointFrom', () => {
        it('should generate errors with identical rules', () => {
          let disjointRule = rof.createFromBackendDict({
            rule_type: 'IsDisjointFrom',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [disjointRule, disjointRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let disjointRule1 = rof.createFromBackendDict({
            rule_type: 'IsDisjointFrom',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let disjointRule2 = rof.createFromBackendDict({
            rule_type: 'IsDisjointFrom',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [disjointRule1, disjointRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('IsSupersetOf', () => {
        it('should generate errors with identical rules', () => {
          let supersetRule = rof.createFromBackendDict({
            rule_type: 'IsSupersetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [supersetRule, supersetRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let supersetRule1 = rof.createFromBackendDict({
            rule_type: 'IsSupersetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let supersetRule2 = rof.createFromBackendDict({
            rule_type: 'IsSupersetOf',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [supersetRule1, supersetRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('HasElementsNotIn', () => {
        it('should generate errors with identical rules', () => {
          let hasElementNotInRule = rof.createFromBackendDict({
            rule_type: 'HasElementsNotIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [hasElementNotInRule, hasElementNotInRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let hasElementNotInRule1 = rof.createFromBackendDict({
            rule_type: 'HasElementsNotIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let hasElementNotInRule2 = rof.createFromBackendDict({
            rule_type: 'HasElementsNotIn',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [hasElementNotInRule1, hasElementNotInRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('OmitsElementsIn', () => {
        it('should generate errors with identical rules', () => {
          let omitElementRule = rof.createFromBackendDict({
            rule_type: 'OmitsElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [omitElementRule, omitElementRule]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 is the same as rule 1 ' +
            'from answer group 1'
          }]);
        });

        it('should not generate errors with different rules', () => {
          let omitElementRule1 = rof.createFromBackendDict({
            rule_type: 'OmitsElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          let omitElementRule2 = rof.createFromBackendDict({
            rule_type: 'OmitsElementsIn',
            inputs: {
              x: ['3', '4', '5', '6']
            }
          });
          let answerGroup = createAnswerGroupByRules(
            [omitElementRule1, omitElementRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });
    });

    describe('check redundant rules', () => {
      describe('IsSubsetOf', () => {
        let subsetRule1: Rule, subsetRule2: Rule;

        beforeAll(() => {
          subsetRule1 = rof.createFromBackendDict({
            rule_type: 'IsSubsetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          subsetRule2 = rof.createFromBackendDict({
            rule_type: 'IsSubsetOf',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [subsetRule2, subsetRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [subsetRule1, subsetRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('HasElementsIn', () => {
        let hasElementsInRule1: Rule, hasElementsInRule2: Rule;

        beforeAll(() => {
          hasElementsInRule1 = rof.createFromBackendDict({
            rule_type: 'HasElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          hasElementsInRule2 = rof.createFromBackendDict({
            rule_type: 'HasElementsIn',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [hasElementsInRule2, hasElementsInRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [hasElementsInRule1, hasElementsInRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('IsDisjointFrom', () => {
        let disjointRule1: Rule, disjointRule2: Rule;

        beforeAll(() => {
          disjointRule1 = rof.createFromBackendDict({
            rule_type: 'IsDisjointFrom',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          disjointRule2 = rof.createFromBackendDict({
            rule_type: 'IsDisjointFrom',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [disjointRule2, disjointRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [disjointRule1, disjointRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('IsSupersetOf', () => {
        let supersetRule1: Rule, supersetRule2: Rule;

        beforeAll(() => {
          supersetRule1 = rof.createFromBackendDict({
            rule_type: 'IsSupersetOf',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          supersetRule2 = rof.createFromBackendDict({
            rule_type: 'IsSupersetOf',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [supersetRule1, supersetRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [supersetRule2, supersetRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('HasElementsNotIn', () => {
        let hasElementsNotInRule1: Rule, hasElementsNotInRule2: Rule;

        beforeAll(() => {
          hasElementsNotInRule1 = rof.createFromBackendDict({
            rule_type: 'HasElementsNotIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          hasElementsNotInRule2 = rof.createFromBackendDict({
            rule_type: 'HasElementsNotIn',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [hasElementsNotInRule1, hasElementsNotInRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [hasElementsNotInRule2, hasElementsNotInRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });

      describe('OmitsElementsIn', () => {
        let omitsElementsInRule1: Rule, omitsElementsInRule2: Rule;

        beforeAll(() => {
          omitsElementsInRule1 = rof.createFromBackendDict({
            rule_type: 'OmitsElementsIn',
            inputs: {
              x: ['1', '2', '3']
            }
          });
          omitsElementsInRule2 = rof.createFromBackendDict({
            rule_type: 'OmitsElementsIn',
            inputs: {
              x: ['1', '2', '3', '4']
            }
          });
        });

        it('should generate errors with redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [omitsElementsInRule1, omitsElementsInRule2]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([{
            type: WARNING_TYPES.ERROR,
            message: 'Rule 2 from answer group 1 will never be matched ' +
            'because it is made redundant by rule 1 from answer group 1.'
          }]);
        });

        it('should generate errors with non-redundant rules', () => {
          let answerGroup = createAnswerGroupByRules(
            [omitsElementsInRule2, omitsElementsInRule1]
          );

          expect(validatorService.getAllWarnings(
            currentState,
            goodCustomizationArgs,
            [answerGroup],
            goodDefaultOutcome
          )).toEqual([]);
        });
      });
    });
  });
});
