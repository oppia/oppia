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

describe('oppiaInteractiveMultipleChoiceInputValidator', function() {
  var WARNING_TYPES;

  var currentState, goodOutcomeDest;
  var badOutcome, goodAnswerGroups, goodDefaultOutcome;
  var validator, customizationArguments;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    var filter = $injector.get('$filter');
    validator = filter('oppiaInteractiveMultipleChoiceInputValidator');

    WARNING_TYPES = $injector.get('WARNING_TYPES');

    currentState = 'First State';

    goodDefaultOutcome = {
      dest: 'Second State',
      feedback: []
    };

    badOutcome = {
      dest: currentState,
      feedback: []
    };

    customizationArguments = {
      choices: {
        value: ['Option 1', 'Option 2']
      }
    };

    goodAnswerGroups = [{
      rule_specs: [{
        rule_type: 'Equals',
        inputs: {
          x: 0
        }
      }, {
        rule_type: 'Equals',
        inputs: {
          x: 1
        }
      }],
      outcome: goodDefaultOutcome
    }];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validator(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect a choices customization argument', function() {
    expect(function() {
      validator(currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    }).toThrow('Expected customization arguments to have property: choices');
  });

  it('should expect non-empty and unique choices', function() {
    customizationArguments.choices.value[0] = '';
    var warnings = validator(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are nonempty.'
    }]);

    customizationArguments.choices.value[0] = 'Option 2';
    warnings = validator(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure the choices are unique.'
    }]);
  });

  it('should validate answer group rules refer to valid choices only once',
    function() {
      goodAnswerGroups[0].rule_specs[0].inputs.x = 2;
      var warnings = validator(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure rule 1 in group 1 refers to a valid choice.'
      }]);

      goodAnswerGroups[0].rule_specs[0].inputs.x = 1;
      warnings = validator(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      // Rule 2 will be caught when trying to verify whether any rules are
      // duplicated in their input choice.
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please ensure rule 2 in group 1 is not equaling the same ' +
          'multiple choice option as another rule.')
      }]);
    });

  it('should expect a non-confusing and non-null default outcome only when ' +
    'not all choices are covered by rules',
    function() {
      var warnings = validator(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      // All of the multiple choice options are targeted by rules, therefore no
      // warning should be issued for a bad default outcome.
      expect(warnings).toEqual([]);

      // Taking away 1 rule reverts back to the expect validation behavior with
      // default outcome.
      goodAnswerGroups[0].rule_specs.splice(1, 1);
      warnings = validator(
        currentState, customizationArguments, goodAnswerGroups, null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please clarify the default outcome so it is less confusing to ' +
          'the user.')
      }]);
      warnings = validator(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please clarify the default outcome so it is less confusing to ' +
          'the user.')
      }]);
    });
});
