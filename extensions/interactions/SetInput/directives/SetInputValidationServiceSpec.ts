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

/**
 * @fileoverview Unit tests for set input validation service.
 */

// TODO(YashJipkate): Remove the following block of unnnecessary imports once
// SetInputValidationService.ts is upgraded to Angular 8.
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
// ^^^ This block is to be removed.

require('interactions/SetInput/directives/SetInputValidationService.ts');

describe('SetInputValidationService', function() {
  var validatorService, WARNING_TYPES;

  var currentState;
  var goodAnswerGroups, goodDefaultOutcome;
  var oof, agof;

  beforeEach(function() {
    angular.mock.module('oppia');
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
  }));

  beforeEach(angular.mock.inject(function($injector) {
    validatorService = $injector.get('SetInputValidationService');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
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
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, false, null)];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, {}, goodAnswerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
});
