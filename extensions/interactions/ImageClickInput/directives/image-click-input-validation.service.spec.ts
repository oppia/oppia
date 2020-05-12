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
 * @fileoverview Unit tests for image click input validation service.
 */

import { TestBed } from '@angular/core/testing';
/* eslint-disable max-len*/
import { ImageClickInputValidationService } from
  'interactions/ImageClickInput/directives/image-click-input-validation.service';
/* eslint-enable max-len*/
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

describe('ImageClickInputValidationService', () => {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'WARNING_TYPES' is a constant and its type needs to be
  // preferably in the constants file itself.
  let WARNING_TYPES: any, validatorService: ImageClickInputValidationService;

  let currentState: string;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'goodAnswerGroups' is a array with elements whose type needs
  // to be researched thoroughly.
  let badOutcome: Outcome, goodAnswerGroups: any;
  let goodDefaultOutcome: Outcome;
  var customizationArguments: any;
  let oof: OutcomeObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageClickInputValidationService]
    });

    validatorService = TestBed.get(ImageClickInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

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

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      imageAndRegions: {
        value: {
          imagePath: '/path/to/image',
          labeledRegions: [{
            label: 'FirstLabel'
          }, {
            label: 'SecondLabel'
          }]
        }
      }
    };
    goodAnswerGroups = [{
      rules: [{
        type: 'IsInRegion',
        inputs: {
          x: 'SecondLabel'
        }
      }],
      outcome: goodDefaultOutcome
    }];
  });

  it('should expect a customization argument for image and regions',
    () => {
      goodAnswerGroups[0].rules = [];
      expect(() => {
        validatorService.getAllWarnings(
          currentState, {}, goodAnswerGroups, goodDefaultOutcome);
      }).toThrowError(
        'Expected customization arguments to have property: imageAndRegions');
    });

  it('should expect an image path customization argument', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);

    customizationArguments.imageAndRegions.value.imagePath = '';
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please add an image for the learner to click on.'
    }]);
  });

  it('should expect labeled regions with non-empty, unique, and ' +
    'alphanumeric labels',
  () => {
    var regions = customizationArguments.imageAndRegions.value.labeledRegions;
    regions[0].label = '';
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the region labels are nonempty.'
    }]);

    regions[0].label = 'SecondLabel';
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the region labels are unique.'
    }]);

    regions[0].label = '@';
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The region labels should consist of alphanumeric characters.'
    }]);

    customizationArguments.imageAndRegions.value.labeledRegions = [];
    goodAnswerGroups[0].rules = [];
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please specify at least one region in the image.'
    }]);
  });

  it('should expect rule types to reference valid region labels', () => {
    goodAnswerGroups[0].rules[0].inputs.x = 'FakeLabel';
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The region label \'FakeLabel\' in rule 1 in group 1 is ' +
        'invalid.'
    }]);
  });

  it('should expect a non-confusing and non-null default outcome',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a rule to cover what should happen if none of ' +
          'the given regions are clicked.'
      }]);
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a rule to cover what should happen if none of ' +
          'the given regions are clicked.'
      }]);
    });
});
