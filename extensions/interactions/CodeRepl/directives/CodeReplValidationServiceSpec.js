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

describe('CodeReplValidationService', function() {
  var WARNING_TYPES, validatorService;
  var currentState, customizationArguments;
  var goodAnswerGroups, goodDefaultOutcome;
  var oof, agof;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    validatorService = $injector.get('CodeReplValidationService');
    WARNING_TYPES = $injector.get('WARNING_TYPES');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');

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
      language: {
        value: ''
      },
      placeholder: {
        value: ''
      },
      preCode: {
        value: ''
      },
      postCode: {
        value: ''
      }
    };

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, false, null)];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for programming language', function() {
    customizationArguments.language.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Programming language name must be a string.'
    }]);
  });

  it('should catch non-string value for placeholder text', function() {
    customizationArguments.placeholder.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Placeholder text must be a string.'
    }]);
  });

  it('should catch non-string value for preCode text', function() {
    customizationArguments.preCode.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'The pre-code text must be a string.'
    }]);
  });

  it('should catch non-string value for postCode text', function() {
    customizationArguments.postCode.value = 1;
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, [], null);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'The post-code text must be a string.'
    }]);
  });
});
