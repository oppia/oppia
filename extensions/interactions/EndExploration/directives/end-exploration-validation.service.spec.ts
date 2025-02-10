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
 * @fileoverview Unit tests for end exploration validation service.
 */

import {TestBed} from '@angular/core/testing';

import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {EndExplorationCustomizationArgs} from 'interactions/customization-args-defs';
import {EndExplorationValidationService} from 'interactions/EndExploration/directives/end-exploration-validation.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';

import {AppConstants} from 'app.constants';

describe('EndExplorationValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let validatorService: EndExplorationValidationService;

  let currentState: string;
  let badOutcome: Outcome;
  let goodAnswerGroups: AnswerGroup[];
  let customizationArguments: EndExplorationCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndExplorationValidationService],
    });

    validatorService = TestBed.inject(EndExplorationValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);

    currentState = 'First State';

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        content_id: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });

    customizationArguments = {
      recommendedExplorationIds: {
        value: ['ExpID0', 'ExpID1', 'ExpID2'],
      },
    };

    goodAnswerGroups = [
      agof.createNew(
        [],
        oof.createFromBackendDict({
          dest: 'Second State',
          dest_if_really_stuck: null,
          feedback: {
            html: '',
            content_id: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        }),
        [],
        null
      ),
    ];
  });

  it(
    'should not have warnings when the EndExploration object does not have ' +
      'answer groups or a default outcome or empty recommended exp IDs',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        [],
        null
      );
      expect(warnings).toEqual([]);
    }
  );

  it('should have warnings for any answer groups or default outcome', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      goodAnswerGroups,
      badOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Please make sure end exploration interactions do not ' +
          'have any Oppia responses.',
      },
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Please make sure end exploration interactions do not ' +
          'have a default outcome.',
      },
    ]);
  });

  it('should have warnings if a recommended exploration id is empty', () => {
    let badCustomizationArguments = {
      recommendedExplorationIds: {
        value: ['ExpID0', ''],
      },
    };
    let invalidExplorationIdsWarning = {
      type: WARNING_TYPES.ERROR,
      message: 'Recommended exploration ID must be non-empty.',
    };

    var warnings = validatorService.getAllWarnings(
      currentState,
      badCustomizationArguments,
      [],
      null
    );

    expect(warnings).toEqual([invalidExplorationIdsWarning]);
  });

  it('should throw for missing recommendations argument', () => {
    expect(() => {
      // This throws "Argument of type '{}'. We need to suppress this error
      // because is not assignable to parameter of type
      // 'EndExplorationCustomizationArgs'." We are purposely assigning the
      // wrong type of customization args in order to test validations.
      // @ts-expect-error
      validatorService.getAllWarnings(currentState, {}, [], null);
    }).toThrowError(
      'Expected customization arguments to have property: ' +
        'recommendedExplorationIds'
    );
  });

  it('should not have warnings for 0 or 8 recommendations', () => {
    customizationArguments.recommendedExplorationIds.value = [];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      [],
      null
    );
    expect(warnings).toEqual([]);

    customizationArguments.recommendedExplorationIds.value = [
      'ExpID0',
      'ExpID1',
      'ExpID2',
      'ExpID3',
      'ExpID4',
      'ExpID5',
      'ExpID6',
      'ExpID7',
    ];
    warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      [],
      null
    );
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for recommended exploration ID', () => {
    // This throws "Type 'number'. We need to suppress this error because is
    // not assignable to type 'string'." Here we are assigning the wrong type
    // of value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.recommendedExplorationIds.value = [1];
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      [],
      null
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message: 'Recommended exploration ID must be a string.',
      },
    ]);
  });

  it('should have warnings for non-list format of recommended exploration IDs', () => {
    // This throws "Type '"ExpID0"'. We need to suppress this error because is
    // not assignable to type 'string[]'." Here we are assigning the wrong
    // type of value to "customizationArguments" in order to test validations.
    // @ts-expect-error
    customizationArguments.recommendedExplorationIds.value = 'ExpID0';
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      [],
      null
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message: 'Set of recommended exploration IDs must be list.',
      },
    ]);
  });
});
