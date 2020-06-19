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
 * @fileoverview Unit tests for interactive map validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { InteractiveMapValidationService } from
  'interactions/InteractiveMap/directives/interactive-map-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { AppConstants } from 'app.constants';
import { WARNING_TYPES_CONSTANT } from 'app-type.constants';

describe('InteractiveMapValidationService', () => {
  let validatorService: InteractiveMapValidationService;
  let WARNING_TYPES: WARNING_TYPES_CONSTANT;

  let currentState: string;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let customizationArguments: any;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractiveMapValidationService]
    });

    validatorService = TestBed.get(InteractiveMapValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
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

    customizationArguments = {
      latitude: {
        value: 0
      },
      longitude: {
        value: 0
      }
    };
    goodAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'Within',
        inputs: {
          d: 100
        }
      }), rof.createFromBackendDict({
        rule_type: 'NotWithin',
        inputs: {
          d: 50
        }
      })],
      goodDefaultOutcome,
      null,
      null
    )];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect latitude and longitude customization arguments',
    () => {
      expect(() => {
        validatorService.getAllWarnings(
          currentState, {}, goodAnswerGroups, goodDefaultOutcome);
      }).toThrowError(
        'Expected customization arguments to have properties: ' +
        'latitude, longitude');
    }
  );

  it('should expect latitudes and longitudes within [-90, 90] and ' +
    '[-180, 180], respectively',
  () => {
    customizationArguments.latitude.value = -120;
    customizationArguments.longitude.value = 200;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please pick a starting latitude between -90 and 90.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'Please pick a starting longitude between -180 and 180.'
    }]);

    customizationArguments.latitude.value = 120;
    customizationArguments.longitude.value = -200;
    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please pick a starting latitude between -90 and 90.'
    }, {
      type: WARNING_TYPES.CRITICAL,
      message: 'Please pick a starting longitude between -180 and 180.'
    }]);
  });

  it('should expect all rule types to refer to positive distances',
    () => {
      goodAnswerGroups[0].rules[0].inputs.d = -90;
      goodAnswerGroups[0].rules[1].inputs.d = -180;
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that rule 1 in group 1 refers to a valid distance.')
      }, {
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that rule 2 in group 1 refers to a valid distance.')
      }]);
    }
  );
});
