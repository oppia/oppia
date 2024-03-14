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
 * @fileoverview Unit tests for item selection input validation service.
 */

import {TestBed} from '@angular/core/testing';

import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {ItemSelectionInputValidationService} from 'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {Rule} from 'domain/exploration/rule.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

import {AppConstants} from 'app.constants';
import {ItemSelectionInputCustomizationArgs} from 'interactions/customization-args-defs';

describe('ItemSelectionInputValidationService', () => {
  let WARNING_TYPES: typeof AppConstants.WARNING_TYPES;
  let validatorService: ItemSelectionInputValidationService;

  let currentState: string;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let customizationArguments: ItemSelectionInputCustomizationArgs,
    badCustomizationArguments: ItemSelectionInputCustomizationArgs;
  let IsProperSubsetValidOption: AnswerGroup[];
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;
  let ThreeInputsAnswerGroups: AnswerGroup[],
    OneInputAnswerGroups: AnswerGroup[],
    NoInputAnswerGroups: AnswerGroup[],
    NoInputAnswerGroupsWithEqualsRule: AnswerGroup[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemSelectionInputValidationService],
    });

    validatorService = TestBed.inject(ItemSelectionInputValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;

    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);

    currentState = 'First State';

    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        html: 'Feedback',
        content_id: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });

    customizationArguments = {
      choices: {
        value: [
          new SubtitledHtml('Selection 1', 'ca_0'),
          new SubtitledHtml('Selection 2', 'ca_1'),
          new SubtitledHtml('Selection 3', 'ca_2'),
        ],
      },
      maxAllowableSelectionCount: {
        value: 2,
      },
      minAllowableSelectionCount: {
        value: 1,
      },
    };
    badCustomizationArguments = {
      choices: {
        value: [
          new SubtitledHtml('Selection 1', 'ca_0'),
          new SubtitledHtml('Selection 2', null),
        ],
      },
      maxAllowableSelectionCount: {
        value: 1,
      },
      minAllowableSelectionCount: {
        value: 1,
      },
    };
    goodAnswerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0', 'ca_1'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    ThreeInputsAnswerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0', 'ca_1', 'ca_2'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    OneInputAnswerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    NoInputAnswerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'ContainsAtLeastOneOf',
              inputs: {
                x: [],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    NoInputAnswerGroupsWithEqualsRule = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: [],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    IsProperSubsetValidOption = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'IsProperSubsetOf',
              inputs: {
                x: ['ca_0'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([]);
  });

  it(
    'should throw error if contentId of choice in customizationArguments' +
      ' does not exist',
    () => {
      expect(() => {
        validatorService.getAllWarnings(
          currentState,
          badCustomizationArguments,
          goodAnswerGroups,
          goodDefaultOutcome
        );
      }).toThrowError('ContentId of choice does not exist');
    }
  );

  it('should expect a choices customization argument', () => {
    expect(() => {
      validatorService.getAllWarnings(
        currentState,
        // This throws "Argument of type '{}'. We need to suppress this error
        // because is not assignable to parameter of type
        // 'ItemSelectionInputCustomizationArgs'." We are purposely assigning
        // the wrong type of customization args in order to test validations.
        // @ts-expect-error
        {},
        goodAnswerGroups,
        goodDefaultOutcome
      );
    }).toThrowError(
      'Expected customization arguments to have property: choices'
    );
  });

  it(
    'should expect the minAllowableSelectionCount to be less than or ' +
      'equal to maxAllowableSelectionCount',
    () => {
      customizationArguments.minAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        ThreeInputsAnswerGroups,
        goodDefaultOutcome
      );
      expect(warnings).toContain({
        type: WARNING_TYPES.CRITICAL,
        message:
          'Please ensure that the max allowed count is not less than the ' +
          'min count.',
      });
    }
  );

  it(
    'should expect maxAllowableSelectionCount to be less than the total ' +
      'number of selections',
    () => {
      customizationArguments.maxAllowableSelectionCount.value = 3;

      // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        goodAnswerGroups,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.CRITICAL,
          message:
            'Please ensure that you have enough choices to reach the max count.',
        },
      ]);
    }
  );

  it(
    'should expect minAllowableSelectionCount to be less than the total ' +
      'number of selections',
    () => {
      // Remove the last choice.
      customizationArguments.choices.value.splice(2, 1);

      customizationArguments.minAllowableSelectionCount.value = 3;
      customizationArguments.maxAllowableSelectionCount.value = 3;

      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        ThreeInputsAnswerGroups,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.CRITICAL,
          message:
            'Please ensure that you have enough choices to reach the min count.',
        },
        {
          type: WARNING_TYPES.ERROR,
          message:
            'Learner answer 1 from Oppia response 1 options do not match ' +
            'customization argument choices.',
        },
      ]);
    }
  );

  it('should expect all choices to be nonempty', () => {
    // Set the first choice to empty.
    customizationArguments.choices.value[0] = new SubtitledHtml('', '');

    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are nonempty.',
      },
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 from Oppia response 1 options do not match ' +
          'customization argument choices.',
      },
    ]);
  });

  it('should expect all choices to be unique', () => {
    // Repeat the last choice.
    customizationArguments.choices.value.push(
      new SubtitledHtml('Selection 3', 'ca_4')
    );

    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are unique.',
      },
    ]);
  });

  it(
    'should expect more that 1 element to be in the rule input, if the ' +
      '"proper subset" rule is used.',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        IsProperSubsetValidOption,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In Oppia response 1, learner answer 1, ' +
            'the "proper subset" learner answer must include at least 2 options.',
        },
      ]);
    }
  );

  it(
    'should expect number of correct options to be in between the maximum ' +
      'and minimum allowed selections when the "Equals" rule is used.',
    () => {
      // Make min allowed selections greater than correct answers.
      customizationArguments.minAllowableSelectionCount.value = 2;

      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        OneInputAnswerGroups,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In Oppia response 1, Learner answer 1, the number of correct ' +
            'options in the "Equals" learner answer should be between 2 and 2 ' +
            '(the minimum and maximum allowed selection counts).',
        },
      ]);
    }
  );

  it(
    'should expect number of correct options to be in between the maximum ' +
      'and minimum allowed selections when the "Equals" rule is used and ' +
      'there is no selected answer in the rule.',
    () => {
      const warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        NoInputAnswerGroupsWithEqualsRule,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In Oppia response 1, Learner answer 1, the number of correct ' +
            'options in the "Equals" learner answer should be between 1 and 2 ' +
            '(the minimum and maximum allowed selection counts).',
        },
      ]);
    }
  );

  it(
    'should expect at least one option when ' +
      '"ContainsAtLeastOneOf" rule is used.',
    () => {
      var warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        NoInputAnswerGroups,
        goodDefaultOutcome
      );
      expect(warnings).toEqual([
        {
          type: WARNING_TYPES.ERROR,
          message:
            'In Oppia response 1, learner answer 1, the "ContainsAtLeastOneOf"' +
            ' learner answer should have at least one option.',
        },
      ]);
    }
  );

  it('should expect all rule inputs to match choices', () => {
    const ruleInput = goodAnswerGroups[0].rules[0].inputs.x as string[];
    ruleInput[0] = 'invalid_content_id';
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'Learner answer 1 from Oppia response 1 options do not match ' +
          'customization argument choices.',
      },
    ]);
  });

  it('should warn user when user selects more than one answer choice', () => {
    customizationArguments.choices.value = [
      new SubtitledHtml('Selection 1', 'ca_0'),
      new SubtitledHtml('Selection 2', 'ca_1'),
    ];
    customizationArguments.maxAllowableSelectionCount.value = 1;
    customizationArguments.minAllowableSelectionCount.value = 0;
    let answerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0', 'ca_1'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];

    let warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      answerGroups,
      goodDefaultOutcome
    );

    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'In Oppia Response 1, Learner answer 1, ' +
          'please select only one answer choice.',
      },
      {
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'In Oppia response 1, ' +
          'Learner answer 1, the number of correct ' +
          'options in the "Equals" learner answer should be between ' +
          '0 and 1' +
          ' (the minimum and maximum allowed selection counts).',
      },
    ]);
  });

  it('should not warn user when user selects only one answer choice', () => {
    customizationArguments.maxAllowableSelectionCount.value = 1;
    customizationArguments.minAllowableSelectionCount.value = 0;
    let answerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];

    let warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      answerGroups,
      goodDefaultOutcome
    );

    expect(warnings).toEqual([]);
  });

  it(
    'should warn user to add a message for Oppia for all other answers' +
      " when user has not covered all responses for 'IsProperSubsetOf' " +
      'rule',
    () => {
      customizationArguments.maxAllowableSelectionCount.value = 1;
      goodDefaultOutcome.feedback.html = '';
      let answerGroups = [
        agof.createNew(
          [
            Rule.createFromBackendDict(
              {
                rule_type: 'IsProperSubsetOf',
                inputs: {
                  x: ['ca_0', 'ca_1'],
                },
              },
              'ItemSelectionInput'
            ),
          ],
          goodDefaultOutcome,
          [],
          null
        ),
      ];

      let warnings = validatorService.getAllWarnings(
        'Second State',
        customizationArguments,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Please specify what Oppia should do in Oppia response 1.',
        },
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Please add something for Oppia to say in the ' +
            '"All other answers" response.',
        },
      ]);
    }
  );

  it(
    'should not warn user to add a message for Oppia for all other answers' +
      " when user has covered all responses for 'IsProperSubsetOf' " +
      'rule',
    () => {
      customizationArguments.maxAllowableSelectionCount.value = 1;
      let answerGroups = [
        agof.createNew(
          [
            Rule.createFromBackendDict(
              {
                rule_type: 'IsProperSubsetOf',
                inputs: {
                  x: ['ca_0', 'ca_1', 'ca_2'],
                },
              },
              'ItemSelectionInput'
            ),
          ],
          goodDefaultOutcome,
          [],
          null
        ),
      ];

      let warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([]);
    }
  );

  it(
    'should warn user to add a message for Oppia for all other answers' +
      " when user has not covered all responses for 'ContainsAtLeastOneOf' " +
      'rule',
    () => {
      goodDefaultOutcome.feedback.html = '';
      customizationArguments.maxAllowableSelectionCount.value = 1;
      customizationArguments.choices.value = [
        new SubtitledHtml('Selection 3', 'ca_2'),
      ];
      let answerGroups = [
        agof.createNew(
          [
            Rule.createFromBackendDict(
              {
                rule_type: 'ContainsAtLeastOneOf',
                inputs: {
                  x: ['ca_0', 'ca_1'],
                },
              },
              'ItemSelectionInput'
            ),
          ],
          goodDefaultOutcome,
          [],
          null
        ),
      ];

      let warnings = validatorService.getAllWarnings(
        'Second State',
        customizationArguments,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Please specify what Oppia should do in Oppia response 1.',
        },
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Please add something for Oppia to say in the ' +
            '"All other answers" response.',
        },
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Learner answer 1 from Oppia response 1 options do not' +
            ' match customization argument choices.',
        },
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Learner answer 1 from Oppia response 1 options do not' +
            ' match customization argument choices.',
        },
      ]);
    }
  );

  it(
    'should not warn user to add a message for Oppia for all other answers ' +
      "when user has covered all responses for 'DoesNotContainAtLeastOneOf'" +
      ' rule',
    () => {
      customizationArguments.maxAllowableSelectionCount.value = 1;
      let answerGroups = [
        agof.createNew(
          [
            Rule.createFromBackendDict(
              {
                rule_type: 'DoesNotContainAtLeastOneOf',
                inputs: {
                  x: ['ca_0', 'ca_1', 'ca_2'],
                },
              },
              'ItemSelectionInput'
            ),
          ],
          goodDefaultOutcome,
          [],
          null
        ),
      ];

      let warnings = validatorService.getAllWarnings(
        currentState,
        customizationArguments,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([]);
    }
  );

  it(
    'should warn user to add a message for Oppia for all other answers ' +
      "when user has not covered all responses for 'DoesNotContainAtLeastOneOf'" +
      ' rule',
    () => {
      goodDefaultOutcome.feedback.html = '';
      customizationArguments.maxAllowableSelectionCount.value = 1;
      let answerGroups = [
        agof.createNew(
          [
            Rule.createFromBackendDict(
              {
                rule_type: 'DoesNotContainAtLeastOneOf',
                inputs: {
                  x: ['ca_0'],
                },
              },
              'ItemSelectionInput'
            ),
          ],
          goodDefaultOutcome,
          [],
          null
        ),
      ];

      let warnings = validatorService.getAllWarnings(
        'Second State',
        customizationArguments,
        answerGroups,
        goodDefaultOutcome
      );

      expect(warnings).toEqual([
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Please specify what Oppia should do in Oppia response 1.',
        },
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Please add something for Oppia to say in the ' +
            '"All other answers" response.',
        },
      ]);
    }
  );

  it('should warn about duplicated rules', () => {
    const answerGroups = [
      agof.createNew(
        [
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0'],
              },
            },
            'ItemSelectionInput'
          ),
          Rule.createFromBackendDict(
            {
              rule_type: 'Equals',
              inputs: {
                x: ['ca_0'],
              },
            },
            'ItemSelectionInput'
          ),
        ],
        goodDefaultOutcome,
        [],
        null
      ),
    ];
    const warnings = validatorService.getAllWarnings(
      currentState,
      customizationArguments,
      answerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([
      {
        type: WARNING_TYPES.ERROR,
        message:
          'The rule 1 of answer group 0 of ItemSelectionInput interaction ' +
          'is a duplicate.',
      },
    ]);
  });
});
