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
 * @fileoverview Unit tests for drag and drop sort input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { DragAndDropSortInputValidationService } from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';

import { AppConstants } from 'app.constants';
import { DragAndDropSortInputCustomizationArgs } from
  'interactions/customization-args-defs';

describe('DragAndDropSortInputValidationService', () => {
  let validatorService: DragAndDropSortInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let customOutcome: Outcome;
  let equalsListWithEmptyValuesRule: Rule, equalsListWithDuplicatesRule: Rule,
    equalsListWithAllowedValuesRule: Rule, equalsListWithValuesRule: Rule,
    goodRule1: Rule, goodRule2: Rule, hasXBeforeYRule: Rule,
    hasElementXAtPositionYRule: Rule;
  let customizationArgs: DragAndDropSortInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory,
    rof: RuleObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DragAndDropSortInputValidationService]
    });

    validatorService = TestBed.get(DragAndDropSortInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        content_id: ''
      },
      missing_prerequisite_skill_id: null,
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });

    customOutcome = oof.createFromBackendDict({
      dest: 'Third State',
      feedback: {
        html: '<p>great job!</p>',
        content_id: ''
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: ''
    });

    customizationArgs = {
      choices: {
        value: [
          new SubtitledHtml('a', ''),
          new SubtitledHtml('b', ''),
          new SubtitledHtml('c', ''),
          new SubtitledHtml('d', '')
        ]
      },
      allowMultipleItemsInSamePosition: {
        value: true
      }
    };

    goodRule1 = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a'], ['b'], ['c'], ['d']]
      }
    }, 'DragAndDropSortInput');

    goodRule2 = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['d'], ['c'], ['b'], ['a']]
      }
    }, 'DragAndDropSortInput');

    equalsListWithAllowedValuesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a', 'b'], ['d'], ['c']]
      }
    }, 'DragAndDropSortInput');

    equalsListWithValuesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
      inputs: {
        x: [['a'], ['d'], ['c'], ['b']]
      }
    }, 'DragAndDropSortInput');

    equalsListWithEmptyValuesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a', ''], [], ['c', 'b', 'd']]
      }
    }, 'DragAndDropSortInput');

    equalsListWithDuplicatesRule = rof.createFromBackendDict({
      rule_type: 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
      inputs: {
        x: [['a', 'b'], ['b'], ['c', 'a', 'd']]
      }
    }, 'DragAndDropSortInput');

    hasXBeforeYRule = rof.createFromBackendDict({
      rule_type: 'HasElementXBeforeElementY',
      inputs: {
        x: 'b',
        y: 'b'
      }
    }, 'DragAndDropSortInput');

    hasElementXAtPositionYRule = rof.createFromBackendDict({
      rule_type: 'HasElementXAtPositionY',
      inputs: {
        x: 'x',
        y: '5'
      }
    }, 'DragAndDropSortInput');

    answerGroups = [
      agof.createNew(
        [equalsListWithAllowedValuesRule],
        goodDefaultOutcome,
        null,
        null
      ), agof.createNew(
        [goodRule1, goodRule2],
        customOutcome,
        null,
        null
      )
    ];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should not allow multiple items in same position', () => {
    customizationArgs.allowMultipleItemsInSamePosition.value = false;
    var rules = [rof.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['a', 'b'], ['c', 'd']]
      }
    }, 'DragAndDropSortInput')];
    answerGroups = [
      agof.createNew(rules, customOutcome, null, null),
      agof.createNew(rules, customOutcome, null, null)
    ];
    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Multiple items in a single position are not allowed.'
    }, {
      type: WARNING_TYPES.ERROR,
      message: 'Multiple items in a single position are not allowed.'
    }]);
    customizationArgs.allowMultipleItemsInSamePosition.value = true;
  });

  it('should expect all items to be nonempty', () => {
    // Add rule containing empty items.
    answerGroups[0].rules = [equalsListWithEmptyValuesRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please ensure the items are nonempty.'
    }, {
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 options do not match ' +
        'customization argument choices.'
    }]);
  });

  it('should expect all items to be unique', () => {
    // Add rule containing duplicate items.
    answerGroups[0].rules = [equalsListWithDuplicatesRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please ensure the items are unique.'
    }, {
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 options do not match ' +
        'customization argument choices.'
    }]);
  });

  it('should expect at least two choices', () => {
    customizationArgs.choices.value = [
      new SubtitledHtml('1', '')
    ];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, [], goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please enter at least two choices.'
    }]);
  });

  it('should expect all choices to be nonempty', () => {
    // Set the first choice to empty.
    customizationArgs.choices.value[0].setHtml('');

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, [], goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure that the choices are nonempty.'
    }]);
  });

  it('should expect all choices to be unique', () => {
    // Repeat the last choice.
    customizationArgs.choices.value.push(new SubtitledHtml('d', ''));

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, [], goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure that the choices are unique.'
    }]);
  });

  it('should catch redundancy of rules', () => {
    answerGroups[0].rules = [equalsListWithValuesRule,
      equalsListWithAllowedValuesRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched ' +
          'because it is made redundant by rule 1 from answer group 1.'
    }]);
  });

  it('should catch non-distinct selected choices', () => {
    answerGroups[0].rules = [hasXBeforeYRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 1 will never be matched ' +
          'because both the selected elements are same.'
    }]);
  });

  it(
    'should catch selected choice not present in custom args for ' +
    'hasXBeforeY rule', () => {
      hasXBeforeYRule.inputs.x = 'x';
      answerGroups[0].rules = [hasXBeforeYRule];
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 1 from answer group 1 contains choices that do ' +
          'not match any of the choices in the customization arguments.'
      }]);
    });

  it(
    'should catch selected choices not present in custom args for ' +
    'hasElementXAtPositionY rule', () => {
      answerGroups[0].rules = [hasElementXAtPositionYRule];

      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 1 from answer group 1 contains a choice that does ' +
          'not match any of the choices in the customization arguments.'
      }, {
        type: WARNING_TYPES.ERROR,
        message: 'Rule 1 from answer group 1 refers to an invalid choice ' +
          'position.'
      }]);
    });

  it(
    'should throw an error if ' +
    'IsEqualToOrderingWithOneItemAtIncorrectPosition rule is used but ' +
    'multiple choices in the same position are note allowed',
    () => {
      answerGroups[0].rules = [equalsListWithValuesRule];
      customizationArgs.allowMultipleItemsInSamePosition.value = false;
      var warnings = validatorService.getAllWarnings(
        currentState, customizationArgs, answerGroups, goodDefaultOutcome);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Rule 1 from answer group 1 will never be matched because ' +
          'there will be at least 2 elements at incorrect positions if ' +
          'multiple elements cannot occupy the same position.'
      }]);
      customizationArgs.allowMultipleItemsInSamePosition.value = true;
    });
});
