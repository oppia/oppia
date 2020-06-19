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
 * @fileoverview Unit tests for continue validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ContinueValidationService } from
  'interactions/Continue/directives/continue-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';
import { WARNING_TYPES_CONSTANT } from 'app-type.constants';

describe('ContinueValidationService', () => {
  let validatorService: ContinueValidationService;
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;

  let currentState: string;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let customizationArguments: any;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContinueValidationService]
    });

    validatorService = TestBed.get(ContinueValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
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

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, null, null)];
    customizationArguments = {
      buttonText: {
        value: 'Some Button Text'
      }
    };
  });

  it('should expect a non-empty button text customization argument',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], goodDefaultOutcome);
      expect(warnings).toEqual([]);

      customizationArguments.buttonText.value = '';
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'The button text should not be empty.'
      }]);

      expect(() => {
        validatorService.getAllWarnings(
          currentState, {}, [], goodDefaultOutcome);
      }).toThrowError(
        'Expected customization arguments to have property: buttonText');
    });

  it('should expect no answer groups', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'Only the default outcome is necessary for a continue interaction.')
    }]);
  });

  it('should expect a non-confusing and non-null default outcome',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please specify what Oppia should do after the button is clicked.')
      }]);
    });
});
