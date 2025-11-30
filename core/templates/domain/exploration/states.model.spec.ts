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
import {States, StateObjectsBackendDict} from 'domain/exploration/states.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model.ts';

describe('States', () => {
  let statesDict: StateObjectsBackendDict;
  let newState: StateBackendDict;
  let newState2: StateBackendDict;
  let secondState: StateBackendDict;
  let statesWithCyclicOutcomeDict: StateObjectsBackendDict;
  let stateDictToDelete: StateObjectsBackendDict;

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
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: new SubtitledUnicode('Type your answer here.', ''),
          },
          catchMisspellings: {
            value: false,
          },
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
        id: 'TextInput',
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
      card_is_checkpoint: true,
      inapplicable_skill_misconception_ids: null,
    };

    newState2 = {
      classifier_model_id: null,
      content: {
        content_id: 'content_5',
        html: '',
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: new SubtitledUnicode('Type your answer here.', ''),
          },
          catchMisspellings: {
            value: false,
          },
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
        id: 'TextInput',
        solution: null,
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: true,
      inapplicable_skill_misconception_ids: null,
    };

    secondState = {
      content: {
        content_id: 'content',
        html: 'more content',
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: '',
            },
          },
          rows: {value: 1},
          catchMisspellings: {
            value: false,
          },
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
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: true,
      inapplicable_skill_misconception_ids: null,
      classifier_model_id: null,
    };

    statesDict = {
      'first state': newState2,
    };

    statesWithCyclicOutcomeDict = {
      'first state': {
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
          confirmed_unclassified_answers: [],
        },
        param_changes: [],
        solicit_answer_details: false,
        classifier_model_id: null,
        card_is_checkpoint: true,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: null,
      },
      'second state': {
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
                dest_if_really_stuck: 'first state',
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
          confirmed_unclassified_answers: [],
        },
        param_changes: [],
        solicit_answer_details: false,
        classifier_model_id: null,
        card_is_checkpoint: true,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: null,
      },
    };

    stateDictToDelete = {
      'first state': {
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
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
            catchMisspellings: {
              value: false,
            },
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
          id: 'TextInput',
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        classifier_model_id: null,
        card_is_checkpoint: true,
        inapplicable_skill_misconception_ids: null,
      },
      'second state': secondState,
    };
  });

  it(
    'should create a new state given a state name and set ' +
      'that state to a terminal state',
    () => {
      let newStates = States.createFromBackendDict(statesDict);
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
    let newStates = States.createFromBackendDict(statesDict);

    newStates.addState(
      'new state',
      'new state content',
      'new state default outcome'
    );
    
    newStates.setState(
      'new state',
      State.createFromBackendDict('new state', newState)
    );

    expect(newStates.getFinalStateNames()).toEqual('new state');
  });

  it('should correctly delete a state', () => {
    let states = States.createFromBackendDict(stateDictToDelete);
    states.deleteState('first state');
    expect(states).toEqual(
      States.createFromBackendDict({
        'second state': secondState,
      })
    );
  });

  it(
    "should correctly set any states' interaction.defaultOutcomes that " +
      'point to a deleted or renamed state name',
    () => {
      let states = States.createFromBackendDict(statesWithCyclicOutcomeDict);
      states.renameState('first state', 'third state');
      states.deleteState('second state');
      expect(states).toEqual(
        States.createFromBackendDict({
          'third state': {
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
              confirmed_unclassified_answers: [],
            },
            param_changes: [],
            solicit_answer_details: false,
            classifier_model_id: null,
            card_is_checkpoint: true,
            linked_skill_id: null,
            inapplicable_skill_misconception_ids: null,
          },
        })
      );
    }
  );
});
