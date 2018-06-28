// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

describe('DragAndDropSortValidationService', function() {
  var validatorService, WARNING_TYPES;

  var currentState;
  var answerGroups, goodDefaultOutcome;
  var equalsListWithEmptyValuesRule, equalsListWithDuplicatesRule,
    equalsListWithAllowedValuesRule;
  var customizationArgs;
  var oof, agof, rof;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    validatorService = $injector.get('DragAndDropSortValidationService');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    rof = $injector.get('RuleObjectFactory');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });

    customizationArgs = {
      choices: {
        value: ['Item 1', 'Item 2', 'Item 3']
      }
    };

    equalsListWithAllowedValuesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a', 'b'], ['d'], ['c']]
      }
    });

    equalsListWithEmptyValuesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a', ''], [], ['c']]
      }
    });

    equalsListWithDuplicatesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
      inputs: {
        x: [['a', 'b'], ['b'], ['c', 'a']]
      }
    });

    answerGroups = [agof.createNew(
      [equalsListWithAllowedValuesRule],
      goodDefaultOutcome,
      false
    )];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect all items to be nonempty', function() {
    // Add rule containing empty items.
    answerGroups[0].rules = [equalsListWithEmptyValuesRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please ensure the items are nonempty.'
    }]);
  });

  it('should expect all items to be unique', function() {
    // Add rule containing duplicate items.
    answerGroups[0].rules = [equalsListWithDuplicatesRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please ensure the items are unique.'
    }]);
  });

  it('should expect all choices to be nonempty', function() {
    // Set the first choice to empty.
    customizationArgs.choices.value[0] = '';

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);
  });

  it('should expect all choices to be unique', function() {
    // Repeat the last choice.
    customizationArgs.choices.value.push('Item 3');

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are unique.'
    }]);
  });
});
