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

describe('InteractiveMapValidationService', function() {
  var validatorService, WARNING_TYPES;

  var currentState;
  var goodAnswerGroups, goodDefaultOutcome;
  var customizationArguments;
  var oof, agof, rof;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    validatorService = $injector.get('InteractiveMapValidationService');
    WARNING_TYPES = $injector.get('WARNING_TYPES');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    rof = $injector.get('RuleObjectFactory');
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
      false
    )];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should expect latitude and longitude customization arguments',
    function() {
      expect(function() {
        validatorService.getAllWarnings(
          currentState, {}, goodAnswerGroups, goodDefaultOutcome);
      }).toThrow('Expected customization arguments to have properties: ' +
        'latitude, longitude');
    }
  );

  it('should expect latitudes and longitudes within [-90, 90] and ' +
    '[-180, 180], respectively',
  function() {
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
    function() {
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
