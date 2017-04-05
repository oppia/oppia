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

describe('oppiaInteractiveLogicProofValidator', function() {
  var validator, WARNING_TYPES;

  var currentState;
  var badOutcome, goodAnswerGroups, goodDefaultOutcome;

  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($rootScope, $controller, $injector) {
    var filter = $injector.get('$filter');
    validator = filter('oppiaInteractiveLogicProofValidator');
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

    goodAnswerGroups = [{
      rules: [],
      outcome: goodDefaultOutcome,
      correct: false
    }];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validator(
      currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should not have warnings for a confusing default outcome', function() {
    var warnings = validator(currentState, {}, [], badOutcome);
    expect(warnings).toEqual([]);
  });
});
