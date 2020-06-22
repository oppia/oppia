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
 * @fileoverview Unit tests for text input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { TextInputValidationService } from
  'interactions/TextInput/directives/text-input-validation.service';

describe('TextInputValidationService', () => {
  var validatorService, WARNING_TYPES;
  var INTERACTION_SPECS, customizationArgSpecs, rowsSpecs, minRows, maxRows;

  var currentState, customizationArguments;
  var goodAnswerGroups, goodDefaultOutcome;
  var oof, agof;

  beforeEach(() => {
    validatorService = TestBed.get(TextInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    INTERACTION_SPECS = InteractionSpecsConstants.INTERACTION_SPECS;
    customizationArgSpecs = INTERACTION_SPECS.TextInput.customization_arg_specs;
    rowsSpecs = customizationArgSpecs[1];
    minRows = rowsSpecs.schema.validators[0].min_value;
    maxRows = rowsSpecs.schema.validators[1].max_value;

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

    customizationArguments = {
      placeholder: {
        value: ''
      },
      rows: {
        value: 1
      }
    };

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, null, null)];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for placeholder', () => {
    customizationArguments.placeholder.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('Placeholder text must be a string.')
    }]);
  });

  it('should catch non-integer value for # rows', () => {
    customizationArguments.rows.value = 1.5;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('Number of rows must be integral.')
    }]);
  });

  it('should catch an out of range value for # rows', () => {
    customizationArguments.rows.value = -1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Number of rows must be between ' + minRows + ' and ' +
        maxRows + '.')
    }]);
  });
});
