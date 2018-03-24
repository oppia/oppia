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

describe('ItemSelectionInputValidationService', function() {
  var WARNING_TYPES, validatorService;

  var currentState;
  var goodAnswerGroups, goodDefaultOutcome;
  var customizationArguments;
  var oof, agof, rof;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    validatorService = $injector.get('ItemSelectionInputValidationService');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    rof = $injector.get('RuleObjectFactory');

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: 'Feedback',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });

    customizationArguments = {
      choices: {
        value: ['Selection 1', 'Selection 2', 'Selection 3']
      },
      maxAllowableSelectionCount: {
        value: 2
      },
      minAllowableSelectionCount: {
        value: 1
      }
    };
    goodAnswerGroups = [agof.createNew(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: ['Selection 1', 'Selection 2']
        }
      })],
      goodDefaultOutcome,
      false)
    ];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect a choices customization argument', function() {
    expect(function() {
      validatorService.getAllWarnings(
        currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    }).toThrow('Expected customization arguments to have property: choices');
  });

  it(
    'should expect the minAllowableSelectionCount to be less than or ' +
    'equal to maxAllowableSelectionCount',
    function() {
      customizationArguments.minAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that the max allowed count is not less than the ' +
          'min count.')
      }]);
    });

  it(
    'should expect maxAllowableSelectionCount to be less than the total ' +
    'number of selections',
    function() {
      customizationArguments.maxAllowableSelectionCount.value = 3;

      // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that you have enough choices to reach the max count.')
      }]);
    });

  it(
    'should expect minAllowableSelectionCount to be less than the total ' +
    'number of selections',
    function() {
    // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      customizationArguments.minAllowableSelectionCount.value = 3;
      customizationArguments.maxAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure that you have enough choices to reach the min count.')
      }]);
    });

  it('should expect all choices to be nonempty', function() {
    // Set the first choice to empty.
    customizationArguments.choices.value[0] = '';

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);
  });

  it('should expect all choices to be unique', function() {
    // Repeat the last choice.
    customizationArguments.choices.value.push('Selection 3');

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are unique.'
    }]);
  });
});
