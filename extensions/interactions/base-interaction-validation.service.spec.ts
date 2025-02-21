// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Test for base validation service for interactions.
 */

import {TestBed} from '@angular/core/testing';
import {
  baseInteractionValidationService,
  Warning,
} from './base-interaction-validation.service';
import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {Outcome} from 'domain/exploration/outcome.model';

describe('baseInteractionValidationService', () => {
  let service: baseInteractionValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(baseInteractionValidationService);
  });

  it('should throw an error if required customization arguments are missing', () => {
    const customizationArguments = {};
    const argNames = ['arg1', 'arg2'];

    expect(() =>
      service.requireCustomizationArguments(customizationArguments, argNames)
    ).toThrowError(
      'Expected customization arguments to have properties: arg1, arg2'
    );
  });

  it('should return warnings for answer groups', () => {
    const answerGroups: AnswerGroup[] = [
      {
        outcome: {
          isConfusing: (stateName: string) => true,
          dest: 'state1',
          labelledAsCorrect: false,
          destIfReallyStuck: null,
        },
      } as AnswerGroup,
      {
        outcome: {
          isConfusing: (stateName: string) => false,
          dest: 'state1',
          labelledAsCorrect: true,
          destIfReallyStuck: null,
        },
      } as AnswerGroup,
    ];

    const warnings: Warning[] = service.getAnswerGroupWarnings(
      answerGroups,
      'state1'
    );

    expect(warnings.length).toBe(2);
    expect(warnings[0].message).toContain(
      'Please specify what Oppia should do in Oppia response 1.'
    );
    expect(warnings[1].message).toContain(
      'In answer group 2, self-loops should not be labelled as correct.'
    );
  });

  it('should return warnings for default outcome', () => {
    const defaultOutcome: Outcome = {
      isConfusing: (stateName: string) => true,
      dest: 'state1',
      labelledAsCorrect: false,
    } as Outcome;

    const warnings: Warning[] = service.getDefaultOutcomeWarnings(
      defaultOutcome,
      'state1'
    );

    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain(
      'Please add feedback for the user in the [All other answers] rule.'
    );
  });

  it('should return false for HTML with mismatched tags', () => {
    const html = '<strong><br>Text</strong></em>';
    expect(service.isHTMLEmpty(html)).toBeFalse();
  });

  it('should return all outcome warnings', () => {
    const answerGroups: AnswerGroup[] = [
      {
        outcome: {
          isConfusing: (stateName: string) => true,
          dest: 'state1',
          labelledAsCorrect: false,
          destIfReallyStuck: null,
        },
      } as AnswerGroup,
    ];

    const defaultOutcome: Outcome = {
      isConfusing: (stateName: string) => false,
      dest: 'state1',
      labelledAsCorrect: true,
    } as Outcome;

    const warnings: Warning[] = service.getAllOutcomeWarnings(
      answerGroups,
      defaultOutcome,
      'state1'
    );

    expect(warnings.length).toBe(2);
  });

  it('should return a warning for default outcome self-loops', () => {
    const defaultOutcome: Outcome = {
      isConfusing: (stateName: string) => false,
      dest: 'state1',
      labelledAsCorrect: true,
    } as Outcome;

    const warnings: Warning[] = service.getDefaultOutcomeWarnings(
      defaultOutcome,
      'state1'
    );

    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain(
      'In the [All other answers] group, self-loops should not be labelled as correct.'
    );
  });

  it('should return a warning if an answer group is labelled as correct and has a destination for really stuck learners', () => {
    const answerGroups: AnswerGroup[] = [
      {
        outcome: {
          isConfusing: (stateName: string) => false,
          dest: 'some_other_state',
          labelledAsCorrect: true,
          destIfReallyStuck: 'state2',
        },
      } as AnswerGroup,
    ];

    const warnings: Warning[] = service.getAnswerGroupWarnings(
      answerGroups,
      'state1'
    );

    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain(
      "The answer group 1 is labelled as 'correct', but includes a 'destination for really stuck learners'. The latter is unnecessary and should be removed."
    );
  });

  it('should throw an error if a single required customization argument is missing', () => {
    const customizationArguments = {arg1: 'value1'};
    const argNames = ['arg1', 'arg2'];

    expect(() =>
      service.requireCustomizationArguments(customizationArguments, argNames)
    ).toThrowError('Expected customization arguments to have property: arg2');
  });

  it('should check if HTML is empty', () => {
    expect(service.isHTMLEmpty('')).toBeTrue();
    expect(service.isHTMLEmpty('<p></p>')).toBeTrue();
    expect(service.isHTMLEmpty('<p>Text</p>')).toBeFalse();
    expect(service.isHTMLEmpty('<strong></strong>')).toBeTrue();
    expect(service.isHTMLEmpty('<strong>Text</strong>')).toBeFalse();
  });
});
