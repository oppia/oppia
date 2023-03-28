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

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ImageClickInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { ImageClickInputValidationService } from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';

import { AppConstants } from 'app.constants';

describe('ImageClickInputValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let validatorService: ImageClickInputValidationService;

  let currentState: string;
  let badOutcome: Outcome, goodAnswerGroups: AnswerGroup[];
  let goodDefaultOutcome: Outcome;
  var customizationArguments: ImageClickInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageClickInputValidationService]
    });

    validatorService = TestBed.inject(ImageClickInputValidationService);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
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

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
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
      imageAndRegions: {
        value: {
          imagePath: '/path/to/image',
          labeledRegions: [{
            label: 'FirstLabel',
            region: {
              area: [[0]]
            }
          }, {
            label: 'SecondLabel',
            region: {
              area: [[0]]
            }
          }]
        }
      },
      highlightRegionsOnHover: {
        value: true
      }
    };

    goodAnswerGroups = [agof.createNew(
      [Rule.createFromBackendDict({
        rule_type: 'IsInRegion',
        inputs: {
          x: 'SecondLabel'
        }
      }, 'ImageClickInput')],
      goodDefaultOutcome,
      [],
      null)];
  });

  it('should expect a customization argument for image and regions',
    () => {
      goodAnswerGroups[0].rules = [];
      expect(() => {
        validatorService.getAllWarnings(
          // This throws "Argument of type '{}'. We need to suppress this error
          // because ..  oppia/comment-style is not assignable to parameter of
          // type 'ImageClickInputCustomizationArgs'." We are purposely
          // assigning the wrong type of customization args in order to test
          // validations.
          // @ts-expect-error
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
      message: 'The region label \'FakeLabel\' in learner answer 1 in ' +
        'Oppia response 1 is invalid.'
    }]);
  });

  it('should expect a non-confusing and non-null default outcome',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a learner answer to cover what should happen ' +
          'if none of the given regions are clicked.'
      }]);
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a learner answer to cover what should happen ' +
        'if none of the given regions are clicked.'
      }]);
    });
});
