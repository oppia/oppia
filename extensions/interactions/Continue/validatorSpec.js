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

describe('oppiaInteractiveContinueValidator', function() {
  var validator, WARNING_TYPES;

  var currentState;
  var goodAnswerGroups, goodDefaultOutcome;
  var customizationArguments;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    validator = $injector.get('$filter')('oppiaInteractiveContinueValidator');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    currentState = 'First State';
    goodDefaultOutcome = {
      dest: 'Second State',
      feedback: []
    };

    goodAnswerGroups = [{
      rule_specs: [],
      outcome: goodDefaultOutcome
    }];
    customizationArguments = {
      buttonText: {
        value: 'Some Button Text'
      }
    };
  }));

  it('should expect a non-empty button text customization argument',
    function() {
      var warnings = validator(
        currentState, customizationArguments, [], goodDefaultOutcome);
      expect(warnings).toEqual([]);

      customizationArguments.buttonText.value = '';
      warnings = validator(
        currentState, customizationArguments, [], goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'The button text should not be empty.'
      }]);

      expect(function() {
        validator(currentState, {}, [], goodDefaultOutcome);
      }).toThrow(
        'Expected customization arguments to have property: buttonText');
    });

  it('should expect no answer groups', function() {
    var warnings = validator(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: (
        'Only the default outcome is necessary for a continue interaction.')
    }]);
  });

  it('should expect a non-confusing and non-null default outcome',
    function() {
      var warnings = validator(currentState, customizationArguments, [], null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please specify what Oppia should do after the button is clicked.')
      }]);
    });
});
