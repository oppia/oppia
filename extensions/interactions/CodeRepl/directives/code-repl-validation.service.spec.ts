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
 * @fileoverview Unit tests for code repl input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { CodeReplValidationService } from
  'interactions/CodeRepl/directives/code-repl-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';
import { CodeReplCustomizationArgs } from
  'interactions/customization-args-defs';

describe('CodeReplValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let validatorService: CodeReplValidationService;
  let currentState: string, customizationArguments: CodeReplCustomizationArgs;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CodeReplValidationService]
    });

    validatorService = TestBed.get(CodeReplValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);

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

    customizationArguments = {
      language: {
        value: ''
      },
      placeholder: {
        value: ''
      },
      preCode: {
        value: ''
      },
      postCode: {
        value: ''
      }
    };

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, [], null)];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for programming language', () => {
    // This throws "Type '1'. We need to suppress this error because is not
    // assignable to type 'string'." Here we are assigning the wrong type
    // of value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.language.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Programming language name must be a string.'
    }]);
  });

  it('should catch non-string value for placeholder text', () => {
    // This throws "Type '1'. We need to suppress this error because is not
    // assignable to type 'string'." Here we are assigning the wrong type of
    // value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.placeholder.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Placeholder text must be a string.'
    }]);
  });

  it('should catch non-string value for preCode text', () => {
    // This throws "Type '1'. We need to suppress this error because is not
    // assignable to type 'string'." Here we are assigning the wrong type of
    // value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.preCode.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'The pre-code text must be a string.'
    }]);
  });

  it('should catch non-string value for postCode text', () => {
    // This throws "Type '1'. We need to suppress this error because is not
    // assignable to type 'string'." Here we are assigning the wrong type of
    // value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.postCode.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'The post-code text must be a string.'
    }]);
  });
});
