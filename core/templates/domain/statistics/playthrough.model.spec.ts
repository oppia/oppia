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
 * @fileoverview Unit tests for the Playthrough model.
 */

import {
  LearnerAction,
  LearnerActionType,
} from 'domain/statistics/learner-action.model';
import {Playthrough} from 'domain/statistics/playthrough.model';
import {PlaythroughIssueType} from 'domain/statistics/playthrough-issue.model';

describe('Playthrough Model Class', () => {
  it('should create a new playthrough', () => {
    let actions = [
      LearnerAction.createNewExplorationStartAction({
        state_name: {
          value: 'state',
        },
      }),
    ];
    let playthroughObject = Playthrough.createNewEarlyQuitPlaythrough(
      'expId1',
      1,
      {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000},
      },
      actions
    );

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual(PlaythroughIssueType.EarlyQuit);
    expect(playthroughObject.issueCustomizationArgs).toEqual({
      state_name: {value: 'state'},
      time_spent_in_exp_in_msecs: {value: 30000},
    });
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create same objects from backend dict and direct values.', () => {
    var playthroughDictObject = Playthrough.createFromBackendDict({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: PlaythroughIssueType.CyclicStateTransitions,
      issue_customization_args: {
        state_names: {
          value: ['state1', 'state2'],
        },
      },
      actions: [],
    });

    var playthroughObject =
      Playthrough.createNewCyclicStateTransitionsPlaythrough(
        'expId1',
        1,
        {
          state_names: {
            value: ['state1', 'state2'],
          },
        },
        []
      );

    expect(playthroughDictObject).toEqual(playthroughObject);
  });

  it('should create a new playthrough from a backend dict', () => {
    let playthroughObject = Playthrough.createFromBackendDict({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: PlaythroughIssueType.EarlyQuit,
      issue_customization_args: {
        state_name: {
          value: 'state',
        },
        time_spent_in_exp_in_msecs: {
          value: 1.2,
        },
      },
      actions: [
        {
          action_type: LearnerActionType.AnswerSubmit,
          action_customization_args: {
            state_name: {
              value: 'state',
            },
            dest_state_name: {
              value: 'dest_state',
            },
            interaction_id: {
              value: 'interaction_id',
            },
            submitted_answer: {
              value: 'answer',
            },
            feedback: {
              value: 'feedback',
            },
            time_spent_state_in_msecs: {
              value: 2,
            },
          },
          schema_version: 1,
        },
      ],
    });

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual(PlaythroughIssueType.EarlyQuit);
    expect(playthroughObject.issueCustomizationArgs).toEqual({
      state_name: {
        value: 'state',
      },
      time_spent_in_exp_in_msecs: {
        value: 1.2,
      },
    });
    expect(playthroughObject.actions).toEqual([
      LearnerAction.createNewAnswerSubmitAction({
        state_name: {
          value: 'state',
        },
        dest_state_name: {
          value: 'dest_state',
        },
        interaction_id: {
          value: 'interaction_id',
        },
        submitted_answer: {
          value: 'answer',
        },
        feedback: {
          value: 'feedback',
        },
        time_spent_state_in_msecs: {
          value: 2,
        },
      }),
    ]);
  });

  it('should convert a playthrough to a backend dict', () => {
    let actions = [
      LearnerAction.createNewAnswerSubmitAction({
        state_name: {
          value: 'state',
        },
        dest_state_name: {
          value: 'dest_state',
        },
        interaction_id: {
          value: 'interaction_id',
        },
        submitted_answer: {
          value: 'answer',
        },
        feedback: {
          value: 'feedback',
        },
        time_spent_state_in_msecs: {
          value: 2,
        },
      }),
    ];
    let playthroughObject = Playthrough.createNewEarlyQuitPlaythrough(
      'expId1',
      1,
      {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000},
      },
      actions
    );

    let playthroughDict = playthroughObject.toBackendDict();
    expect(playthroughDict).toEqual({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: PlaythroughIssueType.EarlyQuit,
      issue_customization_args: {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000},
      },
      actions: [
        {
          action_type: LearnerActionType.AnswerSubmit,
          action_customization_args: {
            state_name: {
              value: 'state',
            },
            dest_state_name: {
              value: 'dest_state',
            },
            interaction_id: {
              value: 'interaction_id',
            },
            submitted_answer: {
              value: 'answer',
            },
            feedback: {
              value: 'feedback',
            },
            time_spent_state_in_msecs: {
              value: 2,
            },
          },
          schema_version: 1,
        },
      ],
    });
  });

  it('should throw error on invalid backend dict', () => {
    const playthroughDict = {
      playthrough_id: 'playthroughId1',
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'InvalidType',
      issue_customization_args: {
        state_names: {
          value: ['state1', 'state2'],
        },
      },
      actions: [],
    };

    expect(() =>
      // This throws "Type 'string' is not assignable to type
      // '"CyclicStateTransitions"'.". We need to suppress this error because
      // 'playthroughDict' has an invalid value of 'issue_type' property. We need
      // to do that in order to test validations.
      // @ts-expect-error
      Playthrough.createFromBackendDict(playthroughDict)
    ).toThrowError(
      'Backend dict does not match any known issue type: ' +
        JSON.stringify(playthroughDict)
    );
  });

  it('should identify the problematic state', () => {
    let eqPlaythrough = Playthrough.createNewEarlyQuitPlaythrough(
      'expId1',
      1,
      {
        state_name: {value: 'state'},
        time_spent_in_exp_in_msecs: {value: 30000},
      },
      []
    );
    expect(eqPlaythrough.getStateNameWithIssue()).toEqual('state');

    var misPlaythrough =
      Playthrough.createNewMultipleIncorrectSubmissionsPlaythrough(
        'expId1',
        1,
        {
          state_name: {value: 'state'},
          num_times_answered_incorrectly: {value: 10},
        },
        []
      );
    expect(misPlaythrough.getStateNameWithIssue()).toEqual('state');

    var cstPlaythrough = Playthrough.createNewCyclicStateTransitionsPlaythrough(
      'expId1',
      1,
      {
        state_names: {
          value: ['state1', 'state2'],
        },
      },
      []
    );
    expect(cstPlaythrough.getStateNameWithIssue()).toEqual('state2');
  });
});
