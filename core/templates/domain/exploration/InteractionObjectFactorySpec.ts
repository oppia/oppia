// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Interaction object factory.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import {
  InteractionObjectFactory, applyConversionFnOnInteractionCustArgsContent
} from 'domain/exploration/InteractionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory.ts';

describe('Interaction object factory', () => {
  let iof = null;
  let oof = null;
  let agof = null;
  let hof = null;
  let sof = null;
  let answerGroupsDict = null;
  let defaultOutcomeDict = null;
  let solutionDict = null;
  let hintsDict = null;
  let interactionDict = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    iof = TestBed.get(InteractionObjectFactory);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    hof = TestBed.get(HintObjectFactory);
    sof = TestBed.get(SolutionObjectFactory);
    defaultOutcomeDict = {
      dest: 'dest_default',
      feedback: {
        content_id: 'default_outcome',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    answerGroupsDict = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1'
    }];
    hintsDict = [
      {
        hint_content: {
          html: '<p>First Hint</p>',
          content_id: 'content_id1'
        }
      },
      {
        hint_content: {
          html: '<p>Second Hint</p>',
          content_id: 'content_id2'
        }
      }
    ];

    solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    };

    interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'custarg_placeholder_0',
            unicode_str: 'Enter text'
          }
        },
        rows: { value: 1 }
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict
    };
  });

  it('should correctly set customization arguments for TextInput', () => {
    const copyInteractionDict = { ...interactionDict };
    const testInteraction = iof.createFromBackendDict(copyInteractionDict);

    expect(testInteraction.customizationArgs).toEqual({
      placeholder: {
        value: new SubtitledUnicode('Enter text', 'custarg_placeholder_0')
      },
      rows: { value: 1 }
    });
  });

  it('should correctly set customization arguments for interactions ' +
     'containing dictionaries', () => {
    // No interactions currently have dictionaries in their customization
    // arguments, but we test here for coverage + future development.

    const conversionSpy = jasmine.createSpy();

    // The customization argument value is an array of dictionaries.
    const caSchema = {
      type: 'list',
      items: {
        type: 'dict',
        properties: [{
          name: 'content',
          schema: {
            type: 'custom',
            obj_type: 'SubtitledUnicode'
          }
        }, {
          name: 'show',
          schema: {
            type: 'boolean'
          }
        }]
      }
    };

    const caValue = [
      {
        content: { unicode_str: 'first', content_id: 'custarg_content_0' },
        show: true
      },
      {
        content: { unicode_str: 'second', content_id: 'custarg_content_1' },
        show: true
      }
    ];

    applyConversionFnOnInteractionCustArgsContent(
      caValue,
      caSchema,
      conversionSpy
    );

    expect(conversionSpy).toHaveBeenCalledTimes(2);
    expect(conversionSpy.calls.allArgs()).toEqual(
      [
        [
          { unicode_str: 'first', content_id: 'custarg_content_0' },
          'SubtitledUnicode'
        ], [
          { unicode_str: 'second', content_id: 'custarg_content_1' },
          'SubtitledUnicode'
        ]
      ]);
  });

  it('should create an object when default outcome is null', () => {
    const copyInteractionDict = { ...interactionDict };
    copyInteractionDict.default_outcome = null;

    const testInteraction = iof.createFromBackendDict(copyInteractionDict);

    expect(testInteraction.defaultOutcome).toBe(null);
  });

  it('should correctly set the new ID', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    expect(testInteraction.id).toEqual('TextInput');
    testInteraction.setId('new_interaction_id');
    expect(testInteraction.id).toEqual('new_interaction_id');
  });

  it('should correctly set the new answer group', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    let newAnswerGroup = {
      rule_specs: [],
      outcome: {
        dest: 'dest_3',
        feedback: {
          content_id: 'outcome_3',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1'
    };
    expect(testInteraction.answerGroups).toEqual([agof.createFromBackendDict({
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1'
    })]);
    newAnswerGroup = agof.createFromBackendDict(newAnswerGroup);
    testInteraction.setAnswerGroups([newAnswerGroup]);
    expect(testInteraction.answerGroups).toEqual([newAnswerGroup]);
  });

  it('should correctly set the new default outcome', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newDefaultOutcomeDict = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    const newDefaultOutcome = oof.createFromBackendDict(newDefaultOutcomeDict);
    expect(testInteraction.defaultOutcome).toEqual(
      oof.createFromBackendDict({
        dest: 'dest_default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }));
    testInteraction.setDefaultOutcome(newDefaultOutcome);
    expect(testInteraction.defaultOutcome).toEqual(newDefaultOutcome);
  });

  it('should correctly set the new customization args', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newCustomizationArgs = {
      placeholder: {
        value: new SubtitledUnicode('', '')
      },
      rows: { value: 1 }
    };
    expect(testInteraction.customizationArgs).toEqual({
      placeholder: {
        value: new SubtitledUnicode('Enter text', 'custarg_placeholder_0')
      },
      rows: { value: 1 }
    });
    testInteraction.setCustomizationArgs(newCustomizationArgs);
    expect(testInteraction.customizationArgs).toEqual(newCustomizationArgs);
  });

  it('should correctly set the new solution', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    const newSolution = sof.createFromBackendDict(newSolutionDict);
    expect(testInteraction.solution).toEqual(
      sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      }));
    testInteraction.setSolution(newSolution);
    expect(testInteraction.solution).toEqual(newSolution);
  });

  it('should correctly set the new hint', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newHintDict = {
      hint_content: {
        html: '<p>New Hint</p>',
        content_id: 'content_id_new'
      }
    };
    const newHint = hof.createFromBackendDict(newHintDict);
    expect(testInteraction.hints).toEqual(hintsDict.map(function(hintDict) {
      return hof.createFromBackendDict(hintDict);
    }));
    testInteraction.setHints([newHint]);
    expect(testInteraction.hints).toEqual([newHint]);
  });

  it('should correctly copy from other interaction', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newAnswerGroups = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1_new',
        feedback: {
          content_id: 'outcome_1_new',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data_new'],
      tagged_skill_misconception_id: 'skill_id-2'
    }];
    const newDefaultOutcome = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    const newHintDict = [
      {
        hint_content: {
          html: '<p>New Hint</p>',
          content_id: 'content_id1_new'
        }
      }
    ];
    const newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    const otherInteractionDict = {
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        showChoicesInShuffledOrder: {
          value: true
        },
        choices: {
          value: [{
            html: '<p>Choice 1</p>',
            content_id: 'custarg_choices_0'
          }, {
            html: '<p>Choice 2</p>',
            content_id: 'custarg_choices_1'
          }]
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'MultipleChoice',
      solution: newSolutionDict
    };
    const otherInteraction = iof.createFromBackendDict(otherInteractionDict);
    testInteraction.copy(otherInteraction);
    expect(testInteraction).toEqual(otherInteraction);
    otherInteraction.customizationArgs.showChoicesInShuffledOrder.value = false;
    expect(testInteraction).toEqual(iof.createFromBackendDict({
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        showChoicesInShuffledOrder: {
          value: true
        },
        choices: {
          value: [{
            html: '<p>Choice 1</p>',
            content_id: 'custarg_choices_0'
          }, {
            html: '<p>Choice 2</p>',
            content_id: 'custarg_choices_1'
          }]
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'MultipleChoice',
      solution: newSolutionDict
    }));
  });

  it('should correctly convert it to backend dict', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    expect(testInteraction.toBackendDict()).toEqual(interactionDict);
  });
});
