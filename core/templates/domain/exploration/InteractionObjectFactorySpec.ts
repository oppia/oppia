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

import { AnswerGroupObjectFactory, IAnswerGroupBackendDict } from
  'domain/exploration/AnswerGroupObjectFactory';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { HintObjectFactory, IHintBackendDict } from
  'domain/exploration/HintObjectFactory';
import { IInteractionBackendDict, InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { IOutcomeBackendDict, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ISolutionBackendDict, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';

describe('Interaction object factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe, ConvertToPlainTextPipe]
    });
    this.iof = TestBed.get(InteractionObjectFactory);
    this.oof = TestBed.get(OutcomeObjectFactory);
    this.agof = TestBed.get(AnswerGroupObjectFactory);
    this.hof = TestBed.get(HintObjectFactory);
    this.sof = TestBed.get(SolutionObjectFactory);

    this.defaultOutcomeDict = <IOutcomeBackendDict>{
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

    this.answerGroupsDict = [
      <IAnswerGroupBackendDict>{
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
      }
    ];

    this.hintsDict = <IHintBackendDict[]>[{
      hint_content: {
        html: '<p>First Hint</p>',
        content_id: 'content_id1'
      }
    }, {
      hint_content: {
        html: '<p>Second Hint</p>',
        content_id: 'content_id2'
      }
    }];

    this.solutionDict = <ISolutionBackendDict>{
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    };

    this.interactionDict = <IInteractionBackendDict>{
      answer_groups: this.answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_value'
        }
      },
      default_outcome: this.defaultOutcomeDict,
      hints: this.hintsDict,
      id: 'interaction_id',
      solution: this.solutionDict
    };
  });

  it('should create an object when default outcome is null', () => {
    const copyInteractionDict = { ...this.interactionDict };
    copyInteractionDict.default_outcome = null;

    const testInteraction = this.iof.createFromBackendDict(copyInteractionDict);

    expect(testInteraction.defaultOutcome).toBe(null);
  });

  it('should correctly set the new ID', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    expect(testInteraction.id).toEqual('interaction_id');
    testInteraction.setId('new_interaction_id');
    expect(testInteraction.id).toEqual('new_interaction_id');
  });

  it('should correctly set the new answer group', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

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

    expect(testInteraction.answerGroups).toEqual([
      this.agof.createFromBackendDict({
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
      })
    ]);
    newAnswerGroup = this.agof.createFromBackendDict(newAnswerGroup);
    testInteraction.setAnswerGroups([newAnswerGroup]);
    expect(testInteraction.answerGroups).toEqual([newAnswerGroup]);
  });

  it('should correctly set the new default outcome', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

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
    const newDefaultOutcome = (
      this.oof.createFromBackendDict(newDefaultOutcomeDict));
    expect(testInteraction.defaultOutcome).toEqual(
      this.oof.createFromBackendDict({
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
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    const newCustomizationArgs = {
      customArgNew: {
        value: 'custom_value_new'
      }
    };
    expect(testInteraction.customizationArgs).toEqual({
      customArg: {
        value: 'custom_value'
      }
    });
    testInteraction.setCustomizationArgs(newCustomizationArgs);
    expect(testInteraction.customizationArgs).toEqual(newCustomizationArgs);
  });

  it('should correctly set the new solution', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    const newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    const newSolution = this.sof.createFromBackendDict(newSolutionDict);
    expect(testInteraction.solution).toEqual(
      this.sof.createFromBackendDict({
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
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    const newHintDict: IHintBackendDict = {
      hint_content: {
        html: '<p>New Hint</p>',
        content_id: 'content_id_new'
      }
    };
    const newHint = this.hof.createFromBackendDict(newHintDict);
    expect(testInteraction.hints).toEqual(this.hintsDict.map(
      (h: IHintBackendDict) => this.hof.createFromBackendDict(h)));
    testInteraction.setHints([newHint]);
    expect(testInteraction.hints).toEqual([newHint]);
  });

  it('should correctly copy from other interaction', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    const newAnswerGroups: IAnswerGroupBackendDict[] = [{
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
    const newDefaultOutcome: IOutcomeBackendDict = {
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
    const newHintDict: IHintBackendDict[] = [
      {
        hint_content: {
          html: '<p>New Hint</p>',
          content_id: 'content_id1_new'
        }
      }
    ];
    const newSolutionDict: ISolutionBackendDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    const otherInteractionDict: IInteractionBackendDict = {
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    };
    const otherInteraction = (
      this.iof.createFromBackendDict(otherInteractionDict));
    testInteraction.copy(otherInteraction);
    expect(testInteraction).toEqual(otherInteraction);
    otherInteraction.customizationArgs.customArg.value = 'custom_arg_new';
    expect(testInteraction).toEqual(this.iof.createFromBackendDict({
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    }));
  });

  it('should correctly convert it to backend dict', () => {
    const testInteraction = (
      this.iof.createFromBackendDict(this.interactionDict));

    expect(testInteraction.toBackendDict()).toEqual(this.interactionDict);
  });
});
