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
 * @fileoverview Unit tests for the PlaythroughObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';

describe('Playthrough Object Factory', () => {
  let laof: LearnerActionObjectFactory;
  let pof: PlaythroughObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlaythroughObjectFactory]
    });

    pof = TestBed.get(PlaythroughObjectFactory);
    laof = TestBed.get(LearnerActionObjectFactory);
  });

  it('should create a new playthrough', () => {
    let actions = [laof.createNewExplorationStartAction({
      state_name: {
        value: 'state'
      }
    })];
    let playthroughObject = pof.createNew(
      'expId1', 1, 'EarlyQuit', {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000},
      }, actions);

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({
      state_name: {value: 'state'},
      time_spent_in_exp_in_msecs: {value: 30000}
    });
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new playthrough from a backend dict', () => {
    let playthroughObject = pof.createFromBackendDict(
      {
        exp_id: 'expId1',
        exp_version: 1,
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {
            value: 'state'
          },
          time_spent_in_exp_in_msecs: {
            value: 1.2
          }
        },
        actions: [{
          action_type: 'AnswerSubmit',
          action_customization_args: {
            state_name: {
              value: 'state'
            },
            dest_state_name: {
              value: 'dest_state'
            },
            interaction_id: {
              value: 'interaction_id'
            },
            submitted_answer: {
              value: 'answer'
            },
            feedback: {
              value: 'feedback'
            },
            time_spent_state_in_msecs: {
              value: 2
            }
          },
          schema_version: 1
        }]
      }
    );

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({
      state_name: {
        value: 'state'
      },
      time_spent_in_exp_in_msecs: {
        value: 1.2
      }
    });
    expect(playthroughObject.actions).toEqual(
      [laof.createNewAnswerSubmitAction({
        state_name: {
          value: 'state'
        },
        dest_state_name: {
          value: 'dest_state'
        },
        interaction_id: {
          value: 'interaction_id'
        },
        submitted_answer: {
          value: 'answer'
        },
        feedback: {
          value: 'feedback'
        },
        time_spent_state_in_msecs: {
          value: 2
        }
      })]);
  });

  it('should convert a playthrough to a backend dict', () => {
    let actions = [laof.createNewAnswerSubmitAction({
      state_name: {
        value: 'state'
      },
      dest_state_name: {
        value: 'dest_state'
      },
      interaction_id: {
        value: 'interaction_id'
      },
      submitted_answer: {
        value: 'answer'
      },
      feedback: {
        value: 'feedback'
      },
      time_spent_state_in_msecs: {
        value: 2
      }
    })];
    let playthroughObject = pof.createNew(
      'expId1', 1, 'EarlyQuit', {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000}
      }, actions);

    let playthroughDict = playthroughObject.toBackendDict();
    expect(playthroughDict).toEqual({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000}
      },
      actions: [{
        action_type: 'AnswerSubmit',
        action_customization_args: {
          state_name: {
            value: 'state'
          },
          dest_state_name: {
            value: 'dest_state'
          },
          interaction_id: {
            value: 'interaction_id'
          },
          submitted_answer: {
            value: 'answer'
          },
          feedback: {
            value: 'feedback'
          },
          time_spent_state_in_msecs: {
            value: 2
          }
        },
        schema_version: 1
      }]
    });
  });
});
