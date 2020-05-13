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

import { TestBed } from '@angular/core/testing';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { EndExplorationValidationService } from
  'interactions/EndExploration/directives/end-exploration-validation.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

describe('EndExplorationValidationService', () => {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'WARNING_TYPES' is a constant and its type needs to be
  // preferably in the constants file itself.
  let WARNING_TYPES: any, validatorService: EndExplorationValidationService;

  let currentState: string;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'badOutcome' is a dict with underscore_cased keys which give
  // tslint errors against underscore_casing in favor of camelCasing.
  let badOutcome: any, goodAnswerGroups: any;
  let customizationArguments: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndExplorationValidationService]
    });

    validatorService = TestBed.get(EndExplorationValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    currentState = 'First State';

    badOutcome = {
      dest: currentState,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };

    customizationArguments = {
      recommendedExplorationIds: {
        value: ['ExpID0', 'ExpID1', 'ExpID2']
      }
    };

    goodAnswerGroups = [{
      rules: [],
      outcome: {
        dest: 'Second State',
        feedback: {
          html: '',
          audio_translations: {}
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }
    }];
  });

  it('should not have warnings for no answer groups or no default outcome',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], null);
      expect(warnings).toEqual([]);
    });

  it('should have warnings for any answer groups or default outcome',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please make sure end exploration interactions do not ' +
          'have any answer groups.')
      }, {
        type: WARNING_TYPES.ERROR,
        message: (
          'Please make sure end exploration interactions do not ' +
          'have a default outcome.')
      }]);
    });

  it('should throw for missing recommendations argument', () => {
    expect(() => {
      validatorService.getAllWarnings(currentState, {}, [], null);
    }).toThrowError(
      'Expected customization arguments to have property: ' +
      'recommendedExplorationIds');
  });

  it('should not have warnings for 0 or 8 recommendations', () => {
    customizationArguments.recommendedExplorationIds.value = [];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([]);

    customizationArguments.recommendedExplorationIds.value = [
      'ExpID0', 'ExpID1', 'ExpID2', 'ExpID3',
      'ExpID4', 'ExpID5', 'ExpID6', 'ExpID7'
    ];
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for recommended exploration ID',
    () => {
      customizationArguments.recommendedExplorationIds.value = [1];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Recommended exploration ID must be a string.'
      }]);
    });

  it('should have warnings for non-list format of recommended exploration IDs',
    () => {
      customizationArguments.recommendedExplorationIds.value = 'ExpID0';
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, [], null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Set of recommended exploration IDs must be list.'
      }]);
    });
});
