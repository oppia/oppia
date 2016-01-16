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

describe('oppiaInteractiveEndExplorationValidator', function() {
  var WARNING_TYPES;

  var currentState;
  var badOutcome, goodAnswerGroups;
  var validator, customizationArguments;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    var filter = $injector.get('$filter');
    validator = filter('oppiaInteractiveEndExplorationValidator');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    currentState = 'First State';

    badOutcome = {
      dest: currentState,
      feedback: []
    };

    customizationArguments = {
      recommendedExplorationIds: {
        value: ['ExpID0', 'ExpID1', 'ExpID2']
      }
    };

    goodAnswerGroups = [
      {
        rule_specs: [],
        outcome: {
          dest: 'Second State',
          feedback: []
        }
      }
    ];
  }));

  it('should not have warnings for no answer groups or no default outcome',
    function() {
      var warnings = validator(currentState, customizationArguments, [], null);
      expect(warnings).toEqual([]);
    });

  it('should have warnings for any answer groups or default outcome',
    function() {
      var warnings = validator(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'Please make sure end exploration interactions do not ' +
          'have any answer groups.')
      }, {
        type: WARNING_TYPES.ERROR,
        message: (
          'Please make sure end exploration interactions do not ' +
          'have a default outcome.')
      }]);
    });

  it('should throw for missing recommendations argument', function() {
    expect(function() {
      validator(currentState, {}, [], null);
    }).toThrow(
      'Expected customization arguments to have property: ' +
      'recommendedExplorationIds');
  });

  it('should not have warnings for 0 or 8 recommendations', function() {
    customizationArguments.recommendedExplorationIds.value = [];
    var warnings = validator(currentState, customizationArguments, [], null);
    expect(warnings).toEqual([]);

    customizationArguments.recommendedExplorationIds.value = [
      'ExpID0', 'ExpID1', 'ExpID2', 'ExpID3',
      'ExpID4', 'ExpID5', 'ExpID6', 'ExpID7'
    ];
    warnings = validator(currentState, customizationArguments, [], null);
    expect(warnings).toEqual([]);
  });
});
