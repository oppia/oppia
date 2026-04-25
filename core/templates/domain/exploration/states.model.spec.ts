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
 * @fileoverview Unit tests for the States.
 */

import {TestBed} from '@angular/core/testing';

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {State, StateBackendDict} from 'domain/state/state.model';
import {States} from 'domain/exploration/states.model';

describe('States', () => {
  let statesDict: Record<string, StateBackendDict>;
  let newState: StateBackendDict;
  let newState2: StateBackendDict;
  let secondState: StateBackendDict;
  let statesWithCyclicOutcomeDict: Record<string, StateBackendDict>;
  let stateDictToDelete: Record<string, StateBackendDict>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });

    spyOnProperty(State, 'NEW_STATE_TEMPLATE', 'get').and.returnValue({
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      interaction: {
        id: 'TextInput',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {value: 1},
          placeholder: {
            value: {
              content_id: 'placeholder',
              unicode_str: 'Type your answer here.',
            },
          },
          catchMisspellings: {value: false},
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
    });

    newState = {
      classifier_model_id: null,
      content: {
        content_id: 'content_7',
        html: '',
      },
      interaction: {
        id: 'EndExploration',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          recommendedExplorationIds: {value: []},
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_8',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      inapplicable_skill_misconception_ids: null,
    };

    newState2 = {
      classifier_model_id: null,
      content: {
        content_id: 'content_5',
        html: '',
      },
      interaction: {
        id: 'TextInput',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {value: 1},
          placeholder: {
            value: {
              content_id: 'placeholder_2',
              unicode_str: 'Type your answer here.',
            },
          },
          catchMisspellings: {value: false},
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_6',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      inapplicable_skill_misconception_ids: null,
    };

    secondState = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: 'more content',
      },
      interaction: {
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'new state',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '<p>Good.</p>',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: 42},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: null,
          },
        ],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: '',
            },
          },
          rows: {value: 1},
          catchMisspellings: {value: false},
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'answer',
          explanation: {
            content_id: 'solution',
            html: '<p>This is an explanation.</p>',
          },
        },
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      inapplicable_skill_misconception_ids: null,
    };

    statesDict = {
      'first state': newState2,
    };

    statesWithCyclicOutcomeDict = {
      'first state': {
        classifier_model_id: null,
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {value: []},
            showChoicesInShuffledOrder: {value: false},
          },
          answer_groups: [
            {
              outcome: {
                dest: 'second state',
                dest_if_really_stuck: 'second state',
                feedback: {
                  content_id: 'feedback_1',
                  html: '',
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 10},
                },
              ],
              training_data: [],
              tagged_skill_misconception_id: null,
            },
          ],
          confirmed_unclassified_answers: [],
          default_outcome: {
            dest: 'second state',
            dest_if_really_stuck: 'second state',
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false,
        inapplicable_skill_misconception_ids: null,
      },

      'second state': {
        classifier_model_id: null,
        inapplicable_skill_misconception_ids: null,
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {value: []},
            showChoicesInShuffledOrder: {value: false},
          },
          answer_groups: [
            {
              outcome: {
                dest: 'first state',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: '',
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 10},
                },
              ],
              training_data: [],
              tagged_skill_misconception_id: null,
            },
          ],
          confirmed_unclassified_answers: [],
          default_outcome: {
            dest: 'first state',
            dest_if_really_stuck: 'first state',
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false,
      },
    };
    stateDictToDelete = {
      'first state': {
        classifier_model_id: null,
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [
            {
              outcome: {
                dest: 'second state',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: '<p>Good.</p>',
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 20},
                },
              ],
              training_data: [],
              tagged_skill_misconception_id: null,
            },
          ],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_3',
                unicode_str: '',
              },
            },
            rows: {value: 1},
            catchMisspellings: {value: false},
          },
          default_outcome: {
            dest: 'new state',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Feedback</p>',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>Here is a hint.</p>',
              },
            },
            {
              hint_content: {
                content_id: 'hint_2',
                html: '<p>Here is another hint.</p>',
              },
            },
          ],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false,
        inapplicable_skill_misconception_ids: null,
      },

      'second state': secondState,
    };
  });

  it(
    'should create a new state given a state name and set ' +
      'that state to a terminal state',
    () => {
      const newStates = States.createFromBackendDict(statesDict);

      newStates.addState('new state', 'content_5', 'default_outcome_6');

      expect(newStates.hasState('new state')).toBe(true);
      expect(newStates.getStateNames()).toEqual(['first state', 'new state']);
      expect(Object.keys(newStates.getStateObjects()).length).toBe(2);

      newStates.setState(
        'new state',
        State.createFromBackendDict('new state', newState)
      );

      expect(newStates.getState('new state')).toEqual(
        State.createFromBackendDict('new state', newState)
      );
    }
  );

  it('should correctly retrieve the terminal states', () => {
    const newStates = States.createFromBackendDict(statesDict);

    newStates.setState(
      'first state',
      State.createFromBackendDict('first state', newState)
    );

    expect(newStates.getFinalStateNames()).toEqual(['first state']);
  });

  it('should correctly delete a state', () => {
    const states = States.createFromBackendDict(stateDictToDelete);

    states.deleteState('first state');

    expect(states).toEqual(
      States.createFromBackendDict({
        'second state': secondState,
      })
    );
  });

  it('should return all State objects using getStates()', () => {
    const states = States.createFromBackendDict(statesDict);
    const stateObjects = states.getStates();

    expect(Array.isArray(stateObjects)).toBe(true);
    expect(stateObjects.length).toBe(Object.keys(statesDict).length);

    expect(stateObjects[0]).toEqual(
      State.createFromBackendDict('first state', {
        ...newState2,
        inapplicable_skill_misconception_ids: null,
      })
    );
  });

  it('should update destIfReallyStuck in answer groups when renaming a state', () => {
    const statesDictWithStuck = {
      'old state': {
        classifier_model_id: null,
        content: {content_id: 'content', html: ''},
        interaction: {
          id: 'TextInput',
          answer_groups: [
            {
              outcome: {
                dest: 'other state',
                dest_if_really_stuck: 'old state',
                feedback: {content_id: 'feedback_1', html: ''},
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [{rule_type: 'Equals', inputs: {x: 1}}],
              training_data: [],
              tagged_skill_misconception_id: null,
            },
          ],
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {value: 1},
            placeholder: {value: {content_id: 'placeholder', unicode_str: ''}},
            catchMisspellings: {value: false},
          },
          default_outcome: {
            dest: 'other state',
            dest_if_really_stuck: null,
            feedback: {content_id: 'default_outcome', html: ''},
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false,
        inapplicable_skill_misconception_ids: null,
      },
      'other state': {
        classifier_model_id: null,
        content: {content_id: 'content', html: ''},
        interaction: {
          id: 'TextInput',
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {value: 1},
            placeholder: {value: {content_id: 'placeholder', unicode_str: ''}},
            catchMisspellings: {value: false},
          },
          default_outcome: {
            dest: 'old state',
            dest_if_really_stuck: null,
            feedback: {content_id: 'default_outcome', html: ''},
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false,
        inapplicable_skill_misconception_ids: null,
      },
    };

    const states = States.createFromBackendDict(statesDictWithStuck);
    states.renameState('old state', 'new state');
    // The answer group outcome's destIfReallyStuck should now be 'new state'.
    expect(
      states.getState('new state').interaction.answerGroups[0].outcome
        .destIfReallyStuck
    ).toBe('new state');
  });

  it(
    "should correctly set any states' interaction.defaultOutcomes that " +
      'point to a deleted or renamed state name',
    () => {
      const states = States.createFromBackendDict(statesWithCyclicOutcomeDict);

      states.renameState('first state', 'third state');
      states.deleteState('second state');

      expect(states).toEqual(
        States.createFromBackendDict({
          'third state': {
            classifier_model_id: null,
            content: {
              content_id: 'content',
              html: 'content',
            },
            interaction: {
              id: 'MultipleChoiceInput',
              customization_args: {
                choices: {value: []},
                showChoicesInShuffledOrder: {value: false},
              },
              answer_groups: [
                {
                  outcome: {
                    dest: 'third state',
                    dest_if_really_stuck: 'third state',
                    feedback: {
                      content_id: 'feedback_1',
                      html: '',
                    },
                    labelled_as_correct: false,
                    param_changes: [],
                    refresher_exploration_id: null,
                    missing_prerequisite_skill_id: null,
                  },
                  rule_specs: [
                    {
                      rule_type: 'Equals',
                      inputs: {x: 10},
                    },
                  ],
                  training_data: [],
                  tagged_skill_misconception_id: null,
                },
              ],
              confirmed_unclassified_answers: [],
              default_outcome: {
                dest: 'third state',
                dest_if_really_stuck: 'third state',
                feedback: {
                  content_id: 'default_outcome',
                  html: '',
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              hints: [],
              solution: null,
            },
            linked_skill_id: null,
            param_changes: [],
            solicit_answer_details: false,
            card_is_checkpoint: false,
            inapplicable_skill_misconception_ids: null,
          },
        })
      );
    }
  );
});
