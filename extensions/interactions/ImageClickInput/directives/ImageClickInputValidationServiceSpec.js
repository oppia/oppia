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

describe('ImageClickInputValidationService', function() {
  var WARNING_TYPES, validatorService;

  var currentState;
  var badOutcome, goodAnswerGroups, goodDefaultOutcome;
  var customizationArguments;
  var oof;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    var filter = $injector.get('$filter');
    validatorService = $injector.get('ImageClickInputValidationService');
    oof = $injector.get('OutcomeObjectFactory');
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

    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });

    customizationArguments = {
      imageAndRegions: {
        value: {
          imagePath: '/path/to/image',
          labeledRegions: [{
            label: 'FirstLabel'
          }, {
            label: 'SecondLabel'
          }]
        }
      }
    };
    goodAnswerGroups = [{
      rules: [{
        type: 'IsInRegion',
        inputs: {
          x: 'SecondLabel'
        }
      }],
      outcome: goodDefaultOutcome
    }];
  }));

  it('should expect a customization argument for image and regions',
    function() {
      goodAnswerGroups[0].rules = [];
      expect(function() {
        validatorService.getAllWarnings(
          currentState, {}, goodAnswerGroups, goodDefaultOutcome);
      }).toThrow(
        'Expected customization arguments to have property: imageAndRegions');
    });

  it('should expect an image path customization argument', function() {
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
    function() {
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

  it('should expect rule types to reference valid region labels', function() {
    goodAnswerGroups[0].rules[0].inputs.x = 'FakeLabel';
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'The region label \'FakeLabel\' in rule 1 in group 1 is ' +
        'invalid.'
    }]);
  });

  it('should expect a non-confusing and non-null default outcome',
    function() {
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, null);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a rule to cover what should happen if none of ' +
          'the given regions are clicked.'
      }]);
      warnings = validatorService.getAllWarnings(
        currentState, customizationArguments, goodAnswerGroups, badOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add a rule to cover what should happen if none of ' +
          'the given regions are clicked.'
      }]);
    });
});
