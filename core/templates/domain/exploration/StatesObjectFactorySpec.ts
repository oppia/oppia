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
 * @fileoverview Unit tests for the States object factory.
 */

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { Voiceover } from './voiceover.model';

describe('States Object Factory', () => {
  let sof: StateObjectFactory = null;
  let ssof = null;
  let statesDict = null;
  let newState = null;
  let newState2 = null;
  let secondState = null;
  let statesWithCyclicOutcomeDict = null;
  let statesWithVoiceoverDict = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    ssof = TestBed.get(StatesObjectFactory);
    sof = TestBed.get(StateObjectFactory);
    spyOnProperty(sof, 'NEW_STATE_TEMPLATE', 'get').and.returnValue({
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: new SubtitledUnicode('Type your answer here.', '')
          },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        solution: null,
        id: 'TextInput'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false
    });

    newState = {
      classifier_model_id: null,
      content: {
        content_id: 'content_7',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content_7: {},
          default_outcome_8: {}
        }
      },
      interaction: {
        id: 'EndExploration',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          recommendedExplorationIds: { value: [] }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_8',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false
    };

    newState2 = {
      classifier_model_id: null,
      content: {
        content_id: 'content_5',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content_5: {},
          default_outcome_6: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: new SubtitledUnicode('Type your answer here.', '')
          },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_6',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        id: 'TextInput'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
    };

    secondState = {
      content: {
        content_id: 'content',
        html: 'more content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            'hi-en': {
              filename: 'myfile2.mp3',
              file_size_bytes: 0.8,
              needs_update: false,
              duration_secs: 0.8
            }
          },
          default_outcome: {},
          solution: {
            de: {
              filename: 'myfile9.mp3',
              file_size_bytes: 0.5,
              needs_update: false,
              duration_secs: 0.5
            }
          }
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: []
        },
        hints: [],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'answer',
          explanation: {
            content_id: 'solution',
            html: '<p>This is an explanation.</p>'
          }
        },
        id: 'TextInput'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false
    };

    statesDict = {
      'first state': newState2
    };

    statesWithCyclicOutcomeDict = {
      'first state': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {value: []},
            showChoicesInShuffledOrder: {value: false}
          },
          answer_groups: [{
            outcome: {
              dest: 'second state',
              dest_if_really_stuck: 'second state',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 10}
            }],
          }],
          default_outcome: {
            dest: 'second state',
            dest_if_really_stuck: 'second state',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: []
          },
          hints: [],
          solution: null
        },
        param_changes: [],
        solicit_answer_details: false
      },
      'second state': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {value: []},
            showChoicesInShuffledOrder: {value: false}
          },
          answer_groups: [{
            outcome: {
              dest: 'first state',
              dest_if_really_stuck: 'first state',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 10}
            }],
          }],
          default_outcome: {
            dest: 'first state',
            dest_if_really_stuck: 'first state',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: []
          },
          hints: [],
          solution: null
        },
        param_changes: [],
        solicit_answer_details: false
      },
    };

    statesWithVoiceoverDict = {
      'first state': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'myfile1.mp3',
                file_size_bytes: 0.5,
                needs_update: false,
                duration_secs: 0.5
              },
              'hi-en': {
                filename: 'myfile3.mp3',
                file_size_bytes: 0.8,
                needs_update: false,
                duration_secs: 0.8
              }
            },
            default_outcome: {
              he: {
                filename: 'myfile10.mp3',
                file_size_bytes: 0.5,
                needs_update: false,
                duration_secs: 0.5
              }
            },
            feedback_1: {
              zh: {
                filename: 'myfile4.mp3',
                file_size_bytes: 1.1,
                needs_update: false,
                duration_secs: 1.1
              }
            },
            hint_1: {
              es: {
                filename: 'myfile5.mp3',
                file_size_bytes: 0.7,
                needs_update: false,
                duration_secs: 0.7
              },
              zh: {
                filename: 'myfile6.mp3',
                file_size_bytes: 0.9,
                needs_update: false,
                duration_secs: 0.9
              },
              'hi-en': {
                filename: 'myfile8.mp3',
                file_size_bytes: 1.2,
                needs_update: false,
                duration_secs: 1.2
              }
            },
            hint_2: {
              cs: {
                filename: 'myfile7.mp3',
                file_size_bytes: 0.2,
                needs_update: false,
                duration_secs: 0.2
              }
            }
          }
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'second state',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '<p>Good.</p>'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 20}
            }],
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_3',
                unicode_str: ''
              }
            },
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          default_outcome: {
            dest: 'new state',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Feedback</p>'
            },
            labelled_as_correct: false,
            param_changes: []
          },
          hints: [{
            hint_content: {
              content_id: 'hint_1',
              html: '<p>Here is a hint.</p>'
            }
          }, {
            hint_content: {
              content_id: 'hint_2',
              html: '<p>Here is another hint.</p>'
            }
          }],
          id: 'TextInput'
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false
      },
      'second state': secondState
    };
  });


  it('should create a new state given a state name and set ' +
    'that state to a terminal state', () => {
    let newStates = ssof.createFromBackendDict(statesDict);
    newStates.addState('new state', 'content_5', 'default_outcome_6');
    expect(newStates.hasState('new state')).toBe(true);
    expect(newStates.getStateNames()).toEqual(['first state', 'new state']);
    expect((Object.keys(newStates.getStateObjects())).length).toBe(2);

    newStates.setState(
      'new state', sof.createFromBackendDict('new state', newState));
    expect(newStates.getState('new state')).toEqual(
      sof.createFromBackendDict('new state', newState));
  });

  it('should correctly retrieve the terminal states', () => {
    let newStates = ssof.createFromBackendDict(statesDict);

    newStates.setState(
      'first state', sof.createFromBackendDict('first state', newState));
    expect(newStates.getFinalStateNames()).toEqual['new state'];
  });

  it('should correctly delete a state', () => {
    let states = ssof.createFromBackendDict(statesWithVoiceoverDict);
    states.deleteState('first state');
    expect(states).toEqual(
      ssof.createFromBackendDict({
        'second state': secondState
      }));
  });

  it('should correctly set any states\' interaction.defaultOutcomes that ' +
     'point to a deleted or renamed state name', () => {
    let states = ssof.createFromBackendDict(statesWithCyclicOutcomeDict);
    states.renameState('first state', 'third state');
    states.deleteState('second state');
    expect(states).toEqual(ssof.createFromBackendDict({
      'third state': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {value: []},
            showChoicesInShuffledOrder: {value: false}
          },
          answer_groups: [{
            outcome: {
              dest: 'third state',
              dest_if_really_stuck: 'third state',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 10}
            }],
          }],
          default_outcome: {
            dest: 'third state',
            dest_if_really_stuck: 'third state',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: []
          },
          hints: [],
          solution: null
        },
        param_changes: [],
        solicit_answer_details: false
      },
    }));
  });

  it('should correctly get all audio language codes in states', () => {
    const states = ssof.createFromBackendDict(statesWithVoiceoverDict);
    expect(states.getAllVoiceoverLanguageCodes())
      .toEqual(['en', 'hi-en', 'he', 'zh', 'es', 'cs', 'de']);
  });

  it('should correctly get all audio translations in states', () => {
    const states = ssof.createFromBackendDict(statesWithVoiceoverDict);
    expect(states.getAllVoiceovers('hi-en'))
      .toEqual({
        'first state': [Voiceover.createFromBackendDict({
          filename: 'myfile3.mp3',
          file_size_bytes: 0.8,
          needs_update: false,
          duration_secs: 0.8
        }), Voiceover.createFromBackendDict({
          filename: 'myfile8.mp3',
          file_size_bytes: 1.2,
          needs_update: false,
          duration_secs: 1.2
        })],
        'second state': [Voiceover.createFromBackendDict({
          filename: 'myfile2.mp3',
          file_size_bytes: 0.8,
          needs_update: false,
          duration_secs: 0.8
        })]
      });
  });
});
