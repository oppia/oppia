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
 * @fileoverview Unit tests for all interaction validators.
 *
 * NOTE TO DEVELOPERS: Many of the exploration validators simply defer their
 * validation to the baseValidator. As a result, they require no additional
 * testing. You will see some test suites in this file which simply have a
 * single test for the validator along the lines of "it should be able to
 * perform basic validation." These simple tests are to ensure the policy of the
 * validator is to defer validation to the baseValidator, since it has its own
 * tests to ensure it is working properly.
 */

import {TestBed} from '@angular/core/testing';
import {
  BaseInteractionValidationService,
  Warning,
} from './base-interaction-validation.service';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {Outcome} from 'domain/exploration/outcome.model';

describe('BaseInteractionValidationService', () => {
  let bivs: BaseInteractionValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    bivs = TestBed.inject(BaseInteractionValidationService);
  });

  describe('requireCustomizationArguments', () => {
    it('should throw an error if one required argument is missing', () => {
      const customizationArguments = {};
      const argNames = ['arg1'];

      expect(() =>
        bivs.requireCustomizationArguments(customizationArguments, argNames)
      ).toThrowError('Expected customization arguments to have property: arg1');
    });

    it('should throw an error if multiple required arguments are missing', () => {
      const customizationArguments = {};
      const argNames = ['arg1', 'arg2'];

      expect(() =>
        bivs.requireCustomizationArguments(customizationArguments, argNames)
      ).toThrowError(
        'Expected customization arguments to have properties: arg1, arg2'
      );
    });

    it('should not throw an error if all required arguments are present', () => {
      const customizationArguments = {arg1: 'value1', arg2: 'value2'};
      const argNames = ['arg1', 'arg2'];

      expect(() =>
        bivs.requireCustomizationArguments(customizationArguments, argNames)
      ).not.toThrowError();
    });
  });

  describe('getAnswerGroupWarnings', () => {
    it('should return warnings for confusing outcomes', () => {
      const answerGroups: AnswerGroup[] = [
        {
          outcome: {
            isConfusing: (stateName: string) => true,
            dest: 'someState',
            labelledAsCorrect: false,
            destIfReallyStuck: null,
          },
        },
      ] as unknown as AnswerGroup[];

      const warnings: Warning[] = bivs.getAnswerGroupWarnings(
        answerGroups,
        'someState'
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        'Please specify what Oppia should do in Oppia response 1.'
      );
    });

    it('should return warnings for self-loops labelled as correct', () => {
      const answerGroups: AnswerGroup[] = [
        {
          outcome: {
            isConfusing: (stateName: string) => false,
            dest: 'someState',
            labelledAsCorrect: true,
            destIfReallyStuck: null,
          },
        },
      ] as unknown as AnswerGroup[];

      const warnings: Warning[] = bivs.getAnswerGroupWarnings(
        answerGroups,
        'someState'
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        'In answer group 1, self-loops should not be labelled as correct.'
      );
    });

    it('should return warnings for answer groups with a destination for really stuck learners', () => {
      const answerGroups: AnswerGroup[] = [
        {
          outcome: {
            isConfusing: (stateName: string) => false,
            dest: 'anotherState',
            labelledAsCorrect: true,
            destIfReallyStuck: 'someState',
          },
        },
      ] as unknown as AnswerGroup[];

      const warnings: Warning[] = bivs.getAnswerGroupWarnings(
        answerGroups,
        'someState'
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        "The answer group 1 is labelled as 'correct', but includes a 'destination for really stuck learners'. The latter is unnecessary and should be removed."
      );
    });
  });

  describe('getDefaultOutcomeWarnings', () => {
    it('should return a warning if the default outcome is confusing', () => {
      const defaultOutcome: Outcome = {
        isConfusing: (stateName: string) => true,
        dest: 'someState',
        labelledAsCorrect: false,
      } as unknown as Outcome;

      const warnings: Warning[] = bivs.getDefaultOutcomeWarnings(
        defaultOutcome,
        'someState'
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        'Please add feedback for the user in the [All other answers] rule.'
      );
    });

    it('should return a warning for self-loops labelled as correct in default outcome', () => {
      const defaultOutcome: Outcome = {
        isConfusing: (stateName: string) => false,
        dest: 'someState',
        labelledAsCorrect: true,
      } as unknown as Outcome;

      const warnings: Warning[] = bivs.getDefaultOutcomeWarnings(
        defaultOutcome,
        'someState'
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        'In the [All other answers] group, self-loops should not be labelled as correct.'
      );
    });
  });

  describe('getAllOutcomeWarnings', () => {
    it('should combine warnings from answer groups and default outcome', () => {
      const answerGroups: AnswerGroup[] = [
        {
          outcome: {
            isConfusing: (stateName: string) => false,
            dest: 'someState',
            labelledAsCorrect: false,
            destIfReallyStuck: null,
          },
        },
      ] as unknown as AnswerGroup[];

      const defaultOutcome: Outcome = {
        isConfusing: (stateName: string) => true,
        dest: 'someState',
        labelledAsCorrect: false,
      } as unknown as Outcome;

      const warnings: Warning[] = bivs.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        'someState'
      );
      expect(warnings.length).toBe(1);
    });
  });

  describe('isHTMLEmpty', () => {
    it('should return true for empty HTML', () => {
      expect(bivs.isHTMLEmpty('')).toBe(true);
      expect(bivs.isHTMLEmpty('   ')).toBe(true);
      expect(bivs.isHTMLEmpty('&nbsp;')).toBe(true);
    });

    it('should return false for non-empty HTML', () => {
      expect(bivs.isHTMLEmpty('<p>Content</p>')).toBe(false);
      expect(bivs.isHTMLEmpty('<strong>Text</strong>')).toBe(false);
    });

    it('should return false for HTML with mismatched tags', () => {
      expect(bivs.isHTMLEmpty('<p><strong>Text</p>')).toBe(false);
      expect(bivs.isHTMLEmpty('<div><span></div>')).toBe(false);
    });

    it('should return true for HTML with matching tags but empty content', () => {
      expect(bivs.isHTMLEmpty('<p></p>')).toBe(true);
      expect(bivs.isHTMLEmpty('<strong></strong>')).toBe(true);
    });
  });
});
