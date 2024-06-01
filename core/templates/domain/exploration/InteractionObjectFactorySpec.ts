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

import {TestBed} from '@angular/core/testing';

import {
  AnswerGroupObjectFactory,
  AnswerGroupBackendDict,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {Hint, HintBackendDict} from 'domain/exploration/hint-object.model';
import {
  InteractionObjectFactory,
  Interaction,
  InteractionBackendDict,
} from 'domain/exploration/InteractionObjectFactory';
import {
  OutcomeBackendDict,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {
  SolutionBackendDict,
  SolutionObjectFactory,
} from 'domain/exploration/SolutionObjectFactory';
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {MultipleChoiceInputCustomizationArgs} from 'interactions/customization-args-defs';
import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';

describe('Interaction object factory', () => {
  let iof: InteractionObjectFactory;
  let oof: OutcomeObjectFactory;
  let agof: AnswerGroupObjectFactory;
  let sof: SolutionObjectFactory;
  let answerGroupsDict: AnswerGroupBackendDict[];
  let defaultOutcomeDict: OutcomeBackendDict;
  let solutionDict: SolutionBackendDict;
  let hintsDict: HintBackendDict[];
  let interactionDict: InteractionBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });
    iof = TestBed.inject(InteractionObjectFactory);
    oof = TestBed.inject(OutcomeObjectFactory);
    agof = TestBed.inject(AnswerGroupObjectFactory);
    sof = TestBed.inject(SolutionObjectFactory);
    defaultOutcomeDict = {
      dest: 'dest_default',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome',
        html: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    };
    answerGroupsDict = [
      {
        rule_specs: [],
        outcome: {
          dest: 'dest_1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'outcome_1',
            html: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: ['training_data'],
        tagged_skill_misconception_id: 'skill_id-1',
      },
    ];
    hintsDict = [
      {
        hint_content: {
          html: '<p>First Hint</p>',
          content_id: 'content_id1',
        },
      },
      {
        hint_content: {
          html: '<p>Second Hint</p>',
          content_id: 'content_id2',
        },
      },
    ];

    solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer',
      },
    };

    interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'Enter text',
          },
        },
        rows: {value: 1},
        catchMisspellings: {
          value: false,
        },
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict,
    };
  });

  it('should correctly set customization arguments for TextInput', () => {
    const copyInteractionDict = {...interactionDict};
    const testInteraction = iof.createFromBackendDict(copyInteractionDict);

    expect(testInteraction.customizationArgs).toEqual({
      placeholder: {
        value: new SubtitledUnicode('Enter text', 'ca_placeholder_0'),
      },
      rows: {
        value: 1,
      },
      catchMisspellings: {
        value: false,
      },
    });
  });

  it('should be able to get contentId to html of an interaction', () => {
    defaultOutcomeDict = {
      dest: 'dest_default',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome',
        html: 'Wrong answer',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    };
    answerGroupsDict = [
      {
        rule_specs: [],
        outcome: {
          dest: 'dest_1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'outcome_1',
            html: 'Good answer',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: ['training_data'],
        tagged_skill_misconception_id: 'skill_id-1',
      },
    ];
    hintsDict = [
      {
        hint_content: {
          html: '<p>First Hint</p>',
          content_id: 'content_id1',
        },
      },
      {
        hint_content: {
          html: '<p>Second Hint</p>',
          content_id: 'content_id2',
        },
      },
    ];

    solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer',
      },
    };

    interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'Enter text',
          },
        },
        rows: {value: 1},
        catchMisspellings: {
          value: false,
        },
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict,
    };
    const testInteraction = iof.createFromBackendDict(interactionDict);

    let contentIdToHtml = testInteraction.getContentIdToHtml();
    expect(contentIdToHtml).toEqual({
      outcome_1: 'Good answer',
      default_outcome: 'Wrong answer',
    });

    let contentId = testInteraction.getContentIdForMatchingHtml('Good answer');
    expect(contentId).toEqual('outcome_1');
  });

  it(
    'should correctly set customization arguments for ' +
      'AlgebraicExpressionInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'AlgebraicExpressionInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({});
    }
  );

  it('should correctly set customization arguments for ' + 'CodeRepl', () => {
    const testInteraction = iof.createFromBackendDict({
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        language: {value: ''},
        placeholder: {value: ''},
        preCode: {value: ''},
        postCode: {value: ''},
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'CodeRepl',
      solution: solutionDict,
    });

    expect(testInteraction.customizationArgs).toEqual({
      language: {value: ''},
      placeholder: {value: ''},
      preCode: {value: ''},
      postCode: {value: ''},
    });
  });

  it('should correctly set customization arguments for ' + 'CodeRepl', () => {
    const testInteraction = iof.createFromBackendDict({
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        language: {value: ''},
        placeholder: {value: ''},
        preCode: {value: ''},
        postCode: {value: ''},
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'CodeRepl',
      solution: solutionDict,
    });

    expect(testInteraction.customizationArgs).toEqual({
      language: {value: ''},
      placeholder: {value: ''},
      preCode: {value: ''},
      postCode: {value: ''},
    });
  });

  it(
    'should correctly set customization arguments for ' +
      'DragAndDropSortInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          choices: {
            value: [
              {
                content_id: 'ca_choices',
                html: '<p>first</p>',
              },
            ],
          },
          allowMultipleItemsInSamePosition: {value: true},
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'DragAndDropSortInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        choices: {value: [new SubtitledHtml('<p>first</p>', 'ca_choices')]},
        allowMultipleItemsInSamePosition: {value: true},
      });
    }
  );

  it('should correctly set customization arguments for ' + 'GraphInput', () => {
    const testInteraction = iof.createFromBackendDict({
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        graph: {value: {}},
        canAddVertex: {value: true},
        canDeleteVertex: {value: true},
        canMoveVertex: {value: true},
        canEditVertexLabel: {value: true},
        canAddEdge: {value: true},
        canDeleteEdge: {value: true},
        canEditEdgeWeight: {value: true},
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'GraphInput',
      solution: solutionDict,
    });

    expect(testInteraction.customizationArgs).toEqual({
      graph: {value: {}},
      canAddVertex: {value: true},
      canDeleteVertex: {value: true},
      canMoveVertex: {value: true},
      canEditVertexLabel: {value: true},
      canAddEdge: {value: true},
      canDeleteEdge: {value: true},
      canEditEdgeWeight: {value: true},
    });
  });

  it(
    'should correctly set customization arguments for ' + 'InteractiveMap',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          latitude: {value: 0.0},
          longitude: {value: 0.0},
          zoom: {value: 0.0},
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'InteractiveMap',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        latitude: {value: 0.0},
        longitude: {value: 0.0},
        zoom: {value: 0.0},
      });
    }
  );

  it(
    'should correctly set customization arguments for ' + 'MathEquationInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'MathEquationInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({});
    }
  );

  it(
    'should correctly set customization arguments for ' + 'MusicNotesInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          sequenceToGuess: {value: []},
          initialSequence: {value: []},
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'MusicNotesInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        sequenceToGuess: {value: []},
        initialSequence: {value: []},
      });
    }
  );

  it(
    'should correctly set customization arguments for ' +
      'NumericExpressionInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          useFractionForDivision: false,
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: 'Type an expression here, using only numbers.',
            },
          },
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'NumericExpressionInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        useFractionForDivision: false,
        placeholder: {
          value: new SubtitledUnicode(
            'Type an expression here, using only numbers.',
            'ca_placeholder_0'
          ),
        },
      });
    }
  );

  it(
    'should correctly set customization arguments for ' + 'NumericInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          requireNonnegativeInput: {
            value: true,
          },
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'NumericInput',
        solution: solutionDict,
      });
      expect(testInteraction.customizationArgs).toEqual({
        requireNonnegativeInput: {
          value: true,
        },
      });
    }
  );

  it(
    'should correctly set customization arguments for ' + 'NumericInput',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          requireNonnegativeInput: {
            value: false,
          },
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'NumericInput',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        requireNonnegativeInput: {
          value: false,
        },
      });
    }
  );

  it(
    'should correctly set customization arguments for ' + 'PencilCodeEditor',
    () => {
      const testInteraction = iof.createFromBackendDict({
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          initialCode: {value: ''},
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'PencilCodeEditor',
        solution: solutionDict,
      });

      expect(testInteraction.customizationArgs).toEqual({
        initialCode: {value: ''},
      });
    }
  );

  it('should correctly set customization arguments for ' + 'SetInput', () => {
    const testInteraction = iof.createFromBackendDict({
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        buttonText: {
          value: {
            content_id: 'ca_buttonText',
            unicode_str: '',
          },
        },
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'SetInput',
      solution: solutionDict,
    });

    expect(testInteraction.customizationArgs).toEqual({
      buttonText: {value: new SubtitledUnicode('', 'ca_buttonText')},
    });
  });

  it(
    'should throw error when trying to set customization arguments for ' +
      'interaction id that does not exist',
    () => {
      expect(() => {
        iof.createFromBackendDict({
          answer_groups: answerGroupsDict,
          confirmed_unclassified_answers: [],
          customization_args: {},
          default_outcome: defaultOutcomeDict,
          hints: hintsDict,
          id: 'InteractionIDThatDNE',
          solution: solutionDict,
        });
      }).toThrowError('Unrecognized interaction id InteractionIDThatDNE');
    }
  );

  it('should create an object when default outcome is null', () => {
    const copyInteractionDict = {...interactionDict};
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

    const newAnswerGroupBackendDict: AnswerGroupBackendDict = {
      rule_specs: [],
      outcome: {
        dest: 'dest_3',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'outcome_3',
          html: '',
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1',
    };
    expect(testInteraction.answerGroups).toEqual([
      agof.createFromBackendDict(
        {
          rule_specs: [],
          outcome: {
            dest: 'dest_1',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'outcome_1',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          training_data: ['training_data'],
          tagged_skill_misconception_id: 'skill_id-1',
        },
        'TextInput'
      ),
    ]);
    const newAnswerGroup = agof.createFromBackendDict(
      newAnswerGroupBackendDict,
      'TextInput'
    );
    testInteraction.setAnswerGroups([newAnswerGroup]);
    expect(testInteraction.answerGroups).toEqual([newAnswerGroup]);
  });

  it('should correctly set the new default outcome', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newDefaultOutcomeDict = {
      dest: 'dest_default_new',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome_new',
        html: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    };
    const newDefaultOutcome = oof.createFromBackendDict(newDefaultOutcomeDict);
    expect(testInteraction.defaultOutcome).toEqual(
      oof.createFromBackendDict({
        dest: 'dest_default',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: '',
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      })
    );
    testInteraction.setDefaultOutcome(newDefaultOutcome);
    expect(testInteraction.defaultOutcome).toEqual(newDefaultOutcome);
  });

  it('should correctly set the new customization args', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newCustomizationArgs = {
      placeholder: {
        value: new SubtitledUnicode('New', 'ca_placeholder_1'),
      },
      rows: {value: 2},
    };
    expect(testInteraction.customizationArgs).toEqual({
      placeholder: {
        value: new SubtitledUnicode('Enter text', 'ca_placeholder_0'),
      },
      rows: {value: 1},
      catchMisspellings: {
        value: false,
      },
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
        html: 'This is the new explanation to the answer',
      },
    };
    const newSolution = sof.createFromBackendDict(newSolutionDict);
    expect(testInteraction.solution).toEqual(
      sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer',
        },
      })
    );
    testInteraction.setSolution(newSolution);
    expect(testInteraction.solution).toEqual(newSolution);
  });

  it('should correctly set the new hint', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newHintDict = {
      hint_content: {
        html: '<p>New Hint</p>',
        content_id: 'content_id_new',
      },
    };
    const newHint = Hint.createFromBackendDict(newHintDict);
    expect(testInteraction.hints).toEqual(
      hintsDict.map((hintDict: HintBackendDict) => {
        return Hint.createFromBackendDict(hintDict);
      })
    );
    testInteraction.setHints([newHint]);
    expect(testInteraction.hints).toEqual([newHint]);
  });

  it('should correctly copy from other interaction', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    const newAnswerGroups = [
      {
        rule_specs: [],
        outcome: {
          dest: 'dest_1_new',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'outcome_1_new',
            html: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: ['training_data_new'],
        tagged_skill_misconception_id: 'skill_id-2',
      },
    ];
    const newDefaultOutcome = {
      dest: 'dest_default_new',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome_new',
        html: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    };
    const newHintDict = [
      {
        hint_content: {
          html: '<p>New Hint</p>',
          content_id: 'content_id1_new',
        },
      },
    ];
    const newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer',
      },
    };
    const otherInteractionDict = {
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        showChoicesInShuffledOrder: {
          value: true,
        },
        choices: {
          value: [
            {
              html: '<p>Choice 1</p>',
              content_id: 'ca_choices_0',
            },
            {
              html: '<p>Choice 2</p>',
              content_id: 'ca_choices_1',
            },
          ],
        },
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'MultipleChoiceInput',
      solution: newSolutionDict,
    };
    const otherInteraction = iof.createFromBackendDict(otherInteractionDict);
    testInteraction.copy(otherInteraction);
    expect(testInteraction).toEqual(otherInteraction);
    const args =
      otherInteraction.customizationArgs as MultipleChoiceInputCustomizationArgs;
    args.showChoicesInShuffledOrder.value = false;
    expect(testInteraction).toEqual(
      iof.createFromBackendDict({
        answer_groups: newAnswerGroups,
        confirmed_unclassified_answers: [],
        customization_args: {
          showChoicesInShuffledOrder: {
            value: true,
          },
          choices: {
            value: [
              {
                html: '<p>Choice 1</p>',
                content_id: 'ca_choices_0',
              },
              {
                html: '<p>Choice 2</p>',
                content_id: 'ca_choices_1',
              },
            ],
          },
        },
        default_outcome: newDefaultOutcome,
        hints: newHintDict,
        id: 'MultipleChoiceInput',
        solution: newSolutionDict,
      })
    );
  });

  it('should correctly convert an Interaction to backend dict', () => {
    const testInteraction = iof.createFromBackendDict(interactionDict);

    expect(testInteraction.toBackendDict()).toEqual(interactionDict);
  });

  it(
    'should correctly convert an Interaction with MultipleChoice to a ' +
      'backend dict',
    () => {
      const mcInteractionDict = {
        answer_groups: answerGroupsDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          showChoicesInShuffledOrder: {
            value: true,
          },
          choices: {
            value: [
              {
                html: '<p>Choice 1</p>',
                content_id: 'ca_choices_0',
              },
              {
                html: '<p>Choice 2</p>',
                content_id: 'ca_choices_1',
              },
            ],
          },
        },
        default_outcome: defaultOutcomeDict,
        hints: hintsDict,
        id: 'MultipleChoiceInput',
        solution: solutionDict,
      };
      const testInteraction = iof.createFromBackendDict(mcInteractionDict);

      expect(testInteraction.toBackendDict()).toEqual(mcInteractionDict);
    }
  );

  it(
    'should create customization arguments from backend dict and convert ' +
      'to backend dict for complex nested customization arguments',
    () => {
      const ca = {
        testCA: {
          value: [
            {
              content: new SubtitledUnicode(
                'first',
                'ca_dummyCustArg_content_0'
              ),
              show: true,
            },
            {
              content: new SubtitledUnicode(
                'second',
                'ca_dummyCustArg_content_1'
              ),
              show: true,
            },
          ],
        },
      };

      const expectedCaBackendDict = {
        testCA: {
          value: [
            {
              content: {
                unicode_str: 'first',
                content_id: 'ca_dummyCustArg_content_0',
              },
              show: true,
            },
            {
              content: {
                unicode_str: 'second',
                content_id: 'ca_dummyCustArg_content_1',
              },
              show: true,
            },
          ],
        },
      };

      const caBackendDict =
        Interaction.convertCustomizationArgsToBackendDict(ca);
      expect(caBackendDict).toEqual(expectedCaBackendDict);
    }
  );

  it(
    'should get all content ids for complex nested customization ' +
      'arguments',
    () => {
      const ca = {
        testCA: {
          value: [
            {
              content: new SubtitledUnicode(
                'first',
                'ca_dummyCustArg_content_0'
              ),
              show: true,
            },
            {
              content: new SubtitledUnicode(
                'second',
                'ca_dummyCustArg_content_1'
              ),
              show: true,
            },
          ],
        },
      };
      let contentIds = Interaction.getCustomizationArgContents(ca).map(
        content => {
          return content.contentId;
        }
      );
      expect(contentIds).toEqual([
        'ca_dummyCustArg_content_0',
        'ca_dummyCustArg_content_1',
      ]);
    }
  );

  it(
    'should fully cover constructing customization arguments for all ' +
      'interactions',
    () => {
      const keys = Object.keys(
        InteractionSpecsConstants.INTERACTION_SPECS
      ) as InteractionSpecsKey[];
      keys.forEach(interactionId => {
        expect(() => {
          const defaultCa: Record<string, Object> = {};
          const caSpecs =
            InteractionSpecsConstants.INTERACTION_SPECS[interactionId]
              .customization_arg_specs;
          caSpecs.forEach((caSpec: {name: string; default_value: Object}) => {
            defaultCa[caSpec.name] = {value: caSpec.default_value};
          });

          iof.createFromBackendDict({
            answer_groups: answerGroupsDict,
            confirmed_unclassified_answers: [],
            customization_args: defaultCa,
            default_outcome: defaultOutcomeDict,
            hints: hintsDict,
            id: interactionId,
            solution: solutionDict,
          });
        }).not.toThrowError();
      });
    }
  );
});
