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
import { Rule } from
  'domain/exploration/rule.model';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';

import { AppConstants } from 'app.constants';
import { DragAndDropSortInputCustomizationArgs } from
  'interactions/customization-args-defs';

describe('DragAndDropSortInputValidationService', () => {
  let validatorService: DragAndDropSortInputValidationService;
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;

  let currentState: string;
  let answerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let customOutcome: Outcome;
  let equalsListWithEmptyListRule: Rule, equalsListWithDuplicatesRule: Rule,
    equalsListWithAllowedValuesRule: Rule, equalsListWithValuesRule: Rule,
    goodRule1: Rule, goodRule2: Rule, hasXBeforeYRule: Rule,
    hasElementXAtPositionYRule: Rule;
  let customizationArgs: DragAndDropSortInputCustomizationArgs,
    badCustomizationArgs: DragAndDropSortInputCustomizationArgs;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DragAndDropSortInputValidationService]
    });

    validatorService = TestBed.get(DragAndDropSortInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
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
      dest_if_really_stuck: null,
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
          new SubtitledHtml('a', 'ca_0'),
          new SubtitledHtml('b', 'ca_1'),
          new SubtitledHtml('c', 'ca_2'),
          new SubtitledHtml('d', 'ca_3')
        ]
      },
      allowMultipleItemsInSamePosition: {
        value: true
      }
    };

    badCustomizationArgs = {
      choices: {
        value: [
          new SubtitledHtml('a', 'ca_0'),
          new SubtitledHtml('b', null),
          new SubtitledHtml('c', 'ca_2'),
        ]
      },
      allowMultipleItemsInSamePosition: {
        value: true
      }
    };

    goodRule1 = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [
          ['ca_0'], ['ca_1'], ['ca_2'], ['ca_3']
        ]
      }
    }, 'DragAndDropSortInput');

    goodRule2 = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [
          ['ca_3'], ['ca_2'], ['ca_1'], ['ca_0']
        ]
      }
    }, 'DragAndDropSortInput');

    equalsListWithAllowedValuesRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [
          ['ca_0', 'ca_1'], ['ca_3'], ['ca_2']
        ]
      }
    }, 'DragAndDropSortInput');

    equalsListWithValuesRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
      inputs: {
        x: [
          ['ca_0'], ['ca_3'], ['ca_2'], ['ca_1']
        ]
      }
    }, 'DragAndDropSortInput');

    equalsListWithEmptyListRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['ca_0'], [], ['ca_2', 'ca_1', 'ca_3']]
      }
    }, 'DragAndDropSortInput');

    equalsListWithDuplicatesRule = Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
      inputs: {
        x: [
          ['ca_0', 'ca_1'], ['ca_1'],
          ['ca_2', 'ca_0', 'ca_3']
        ]
      }
    }, 'DragAndDropSortInput');

    hasXBeforeYRule = Rule.createFromBackendDict({
      rule_type: 'HasElementXBeforeElementY',
      inputs: {
        x: 'ca_1',
        y: 'ca_1'
      }
    }, 'DragAndDropSortInput');

    hasElementXAtPositionYRule = Rule.createFromBackendDict({
      rule_type: 'HasElementXAtPositionY',
      inputs: {
        x: 'ca_5',
        y: '5'
      }
    }, 'DragAndDropSortInput');

    answerGroups = [
      agof.createNew(
        [equalsListWithAllowedValuesRule],
        goodDefaultOutcome,
        [],
        null
      ), agof.createNew(
        [goodRule1, goodRule2],
        customOutcome,
        [],
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
    var rules = [Rule.createFromBackendDict({
      rule_type: 'IsEqualToOrdering',
      inputs: {
        x: [['ca_0', 'ca_1'], ['ca_2', 'ca_3']]
      }
    }, 'DragAndDropSortInput')];
    answerGroups = [
      agof.createNew(rules, customOutcome, [], null),
      agof.createNew(rules, customOutcome, [], null)
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

  it('should expect all lists to be nonempty', () => {
    // Add rule containing empty items.
    answerGroups[0].rules = [equalsListWithEmptyListRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Please ensure the list is nonempty.'
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
      message: 'Learner answer 1 from Oppia response 1 options do not match ' +
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
    customizationArgs.choices.value[0].html = '';

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, [], goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.CRITICAL,
      message: 'Please ensure that the choices are nonempty.'
    }]);
  });

  it('should throw error if contentId of choice in customizationArguments' +
  ' does not exist', () => {
    expect(() => {
      validatorService.getAllWarnings(
        currentState, badCustomizationArgs, answerGroups, goodDefaultOutcome);
    }).toThrowError('ContentId of choice does not exist');
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
      message: 'Learner answer 2 from Oppia response 1 will never be ' +
          'matched because it is made redundant by answer 1 from response 1.'
    }]);
  });

  it('should catch non-distinct selected choices', () => {
    answerGroups[0].rules = [hasXBeforeYRule];

    var warnings = validatorService.getAllWarnings(
      currentState, customizationArgs, answerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Learner answer 1 from Oppia response 1 will never be ' +
          'matched because both the selected elements are same.'
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
        message: 'Learner answer 1 from Oppia response 1 contains choices ' +
          'that do not match any of the choices in the customization ' +
          'arguments.'
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
        message: 'Learner answer 1 from Oppia response 1 contains a choice ' +
          'that does not match any of the choices in the customization ' +
          'arguments.'
      }, {
        type: WARNING_TYPES.ERROR,
        message: 'Learner answer 1 from Oppia response 1 refers to an ' +
          'invalid choice position.'
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
        message: 'Learner answer 1 from Oppia response 1 will never be ' +
          'matched because there will be at least 2 elements at incorrect ' +
          'positions if multiple elements cannot occupy the same position.'
      }]);
      customizationArgs.allowMultipleItemsInSamePosition.value = true;
    });
});
