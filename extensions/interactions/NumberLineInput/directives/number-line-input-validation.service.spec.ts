// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for number line input validation.service.spec.
 */

import {TestBed} from '@angular/core/testing';
import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {Outcome} from 'domain/exploration/outcome.model';
import {Rule} from 'domain/exploration/rule.model';
import {NumberLineInputCustomizationArgs} from 'interactions/customization-args-defs';
import {NumberLineInputValidationService} from './number-line-input-validation.service';

describe('NumberLineInputValidationService', () => {
  let service: NumberLineInputValidationService;
  let outcome: Outcome;
  let args: NumberLineInputCustomizationArgs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumberLineInputValidationService);
    outcome = Outcome.createFromBackendDict({
      dest: 'Next',
      dest_if_really_stuck: null,
      feedback: {content_id: '', html: ''},
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    args = {
      startValue: {value: -2},
      endValue: {value: 6},
      interval: {value: 2},
    };
  });

  const makeAnswerGroup = (value: number): AnswerGroup => {
    const rule = Rule.createFromBackendDict(
      {rule_type: 'Equals', inputs: {x: value}},
      'NumberLineInput'
    );
    return AnswerGroup.createNew([rule], outcome, [], null);
  };

  it('should accept a rule targeting an available point', () => {
    expect(
      service.getAllWarnings('First', args, [makeAnswerGroup(4)], outcome)
    ).toEqual([]);
  });

  it('should warn when changing the grid removes a rule point', () => {
    args = {
      startValue: {value: 1},
      endValue: {value: 7},
      interval: {value: 2},
    };
    const warnings = service.getAllWarnings(
      'First',
      args,
      [makeAnswerGroup(4)],
      outcome
    );
    expect(warnings.some(warning => warning.message.includes('outside'))).toBe(
      true
    );
  });

  it('should warn about grids with invalid spacing or point counts', () => {
    args.interval.value = 3;
    expect(service.getCustomizationArgsWarnings(args).length).toBe(1);
  });
});
