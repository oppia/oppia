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

describe('oppiaInteractiveInteractiveMapValidator', function() {
  var validator, WARNING_TYPES;

  var currentState;
  var goodAnswerGroups, goodDefaultOutcome;
  var customizationArguments;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    var filter = $injector.get('$filter');
    validator = filter('oppiaInteractiveInteractiveMapValidator');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    currentState = 'First State';
    goodDefaultOutcome = {
      dest: 'Second State',
      feedback: []
    };

    customizationArguments = {
      latitude: {
        value: 0
      },
      longitude: {
        value: 0
      }
    };
    goodAnswerGroups = [{
      rule_specs: [{
        rule_type: 'Within',
        inputs: {
          d: 100
        }
      }, {
        rule_type: 'NotWithin',
        inputs: {
          d: 50
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

  it('should expect latitude and longitude customization arguments',
    function() {
      expect(function() {
        validator(currentState, {}, goodAnswerGroups, goodDefaultOutcome);
      }).toThrow('Expected customization arguments to have properties: ' +
        'latitude, longitude');
    }
  );

  it('should expect latitudes and longitudes within [-90, 90] and ' +
    '[-180, 180], respectively',
    function() {
      customizationArguments.latitude.value = -120;
      customizationArguments.longitude.value = 200;
      var warnings = validator(
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
      warnings = validator(
        currentState, customizationArguments, goodAnswerGroups,
        goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.CRITICAL,
        message: 'Please pick a starting latitude between -90 and 90.'
      }, {
        type: WARNING_TYPES.CRITICAL,
        message: 'Please pick a starting longitude between -180 and 180.'
      }]);
    }
  );

  it('should expect all rule types to refer to positive distances',
    function() {
      goodAnswerGroups[0].rule_specs[0].inputs.d = -90;
      goodAnswerGroups[0].rule_specs[1].inputs.d = -180;
      var warnings = validator(
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
