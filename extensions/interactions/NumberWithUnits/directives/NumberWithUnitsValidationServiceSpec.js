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

describe('NumberWithUnitsValidationService', function() {
  var validatorService, WARNING_TYPES;

  var currentState;
  var answerGroups, goodDefaultOutcome;
  var createFractionDict;
  var oof, agof, rof;
  beforeEach(function() {
    module('oppia');
  });

  beforeEach(inject(function($injector) {
    validatorService = $injector.get('NumberWithUnitsValidationService');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    rof = $injector.get('RuleObjectFactory');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    createNumberWithUnitsDict = function(
        type, real, fraction, units) {
      return {
        type: type,
        real: real,
        fraction: fraction,
        units: units
      };
    };

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

    equalsOneRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('real', 2, '', 'kg / m^2');
      }
    });

    equalsTwoByThreeRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, '2/3', 'kg / m^2');
      }
    });

    answerGroups = [agof.createNew(
      [equalsOneRule],
      goodDefaultOutcome,
      false
    )];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should not catch equals followed by equivalent as redundant', function() {
    answerGroups[0].rules = [equalsOneRule, equivalentToOneRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);

    answerGroups[0].rules = [equalsOneRule, equivalentToOneAndSimplestFormRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
