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

/**
 * @fileoverview Unit tests for number with units validation service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// number-with-units-validation.service.ts is upgraded to Angular 8.
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'interactions/NumberWithUnits/directives/' +
  'number-with-units-validation.service.ts');

describe('NumberWithUnitsValidationService', function() {
  var validatorService, WARNING_TYPES;

  var currentState;
  var answerGroups, goodDefaultOutcome;
  var equalsTwoRule, equalsTwoByThreeRule, equivalentToTwoThousandRule,
    equivalentToTwoByThreeRule, equivalentToTwoRule;
  var createNumberWithUnitsDict;
  var oof, agof, rof;
  beforeEach(function() {
    angular.mock.module('oppia');
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value(
      'baseInteractionValidationService',
      new baseInteractionValidationService());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    validatorService = $injector.get('NumberWithUnitsValidationService');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    rof = $injector.get('RuleObjectFactory');
    WARNING_TYPES = $injector.get('WARNING_TYPES');

    var createFractionDict = function(
        isNegative, wholeNumber, numerator, denominator) {
      return {
        isNegative: isNegative,
        wholeNumber: wholeNumber,
        numerator: numerator,
        denominator: denominator
      };
    };

    var createNumberWithUnitsDict = function(
        type, real, fractionDict, unitList) {
      return {
        type: type,
        real: real,
        fraction: fractionDict,
        units: unitList
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

    equalsTwoRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('real', 2, createFractionDict(
          false, 0, 0, 1), [{unit: 'kg', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    });

    equivalentToTwoThousandRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict('real', 2000, createFractionDict(
          false, 0, 0, 1), [{unit: 'g', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    });

    equivalentToTwoRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict('real', 2, createFractionDict(
          false, 0, 0, 1), [{unit: 'kg', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    });

    equalsTwoByThreeRule = rof.createFromBackendDict({
      rule_type: 'IsEqualTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
          false, 0, 2, 3), [{unit: 'kg', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    });

    equivalentToTwoByThreeRule = rof.createFromBackendDict({
      rule_type: 'IsEquivalentTo',
      inputs: {
        f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
          false, 0, 2000, 3), [{unit: 'g', exponent: 1},
          {unit: 'm', exponent: -2}])
      }
    });

    answerGroups = [agof.createNew(
      [equalsTwoRule, equalsTwoByThreeRule],
      goodDefaultOutcome,
      false
    )];
  }));

  it('should be able to perform basic validation', function() {
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch equals followed by equals same value', function() {
    answerGroups[0].rules = [equalsTwoRule, equalsTwoRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched ' +
        'because it is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should not catch equals followed by equals with unequal values',
    function() {
      answerGroups[0].rules = [equalsTwoRule, equalsTwoByThreeRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);
    });

  it('should not catch equals followed by equivalent as redundant',
    function() {
      answerGroups[0].rules = [equalsTwoRule, equivalentToTwoThousandRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);

      answerGroups[0].rules = [equalsTwoRule, equivalentToTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([]);
    });

  it('should catch equivalent followed by equals with equivalent values',
    function() {
      answerGroups[0].rules = [equivalentToTwoThousandRule, equalsTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
      }]);
    });

  it('should not catch equivalent followed by equals with non-equivalent' +
    ' values', function() {
    answerGroups[0].rules = [equivalentToTwoThousandRule, equalsTwoByThreeRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch equivalent followed by equivalent with equivalent values',
    function() {
      answerGroups[0].rules = [equivalentToTwoThousandRule,
        equivalentToTwoRule];
      var warnings = validatorService.getAllWarnings(
        currentState, {}, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
      }]);
    });

  it('should not catch equivalent followed by equivalent with non-equivalent' +
    ' values', function() {
    answerGroups[0].rules = [equivalentToTwoByThreeRule,
      equivalentToTwoThousandRule];
    var warnings = validatorService.getAllWarnings(
      currentState, {}, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
});
