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

import {
  ICyclicStateTransitionsCustomizationArgs,
  IEarlyQuitCustomizationArgs,
  IMultipleIncorrectSubmissionsCustomizationArgs,
  PlaythroughObjectFactory
} from 'domain/statistics/PlaythroughObjectFactory';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';

describe('Playthrough Object Factory', () => {
  let learnerActionObjectFactory: LearnerActionObjectFactory;
  let playthroughObjectFactory: PlaythroughObjectFactory;

  beforeEach(() => {
    learnerActionObjectFactory = TestBed.get(LearnerActionObjectFactory);
    playthroughObjectFactory = TestBed.get(PlaythroughObjectFactory);
  });

  it('should create a new early quit playthrough', () => {
    var actions = [
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'state name'},
      })
    ];
    var customizationArgs: IEarlyQuitCustomizationArgs = {
      state_name: {value: 'state name'},
      time_spent_in_exp_in_msecs: {value: 45000},
    };
    var playthroughObject = playthroughObjectFactory.createNew(
      'expId1', 1, 'EarlyQuit', customizationArgs, actions);

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual(customizationArgs);
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new cyclic state transitions playthrough', () => {
    var actions = [
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'state name'},
      })
    ];
    var customizationArgs: ICyclicStateTransitionsCustomizationArgs = {
      state_names: {value: ['state 1', 'state 2', 'state 3', 'state 1']},
    };
    var playthroughObject = playthroughObjectFactory.createNew(
      'expId1', 1, 'CyclicStateTransitions', customizationArgs, actions);

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('CyclicStateTransitions');
    expect(playthroughObject.issueCustomizationArgs).toEqual(customizationArgs);
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new multiple incorrect answers playthrough', () => {
    var actions = [
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'state name'},
      })
    ];
    var customizationArgs: IMultipleIncorrectSubmissionsCustomizationArgs = {
      state_name: {value: 'state name'},
      num_times_answered_incorrectly: {value: 5},
    };
    var playthroughObject = playthroughObjectFactory.createNew(
      'expId1', 1, 'MultipleIncorrectAnswers', customizationArgs, actions);

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('MultipleIncorrectAnswers');
    expect(playthroughObject.issueCustomizationArgs).toEqual(customizationArgs);
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new playthrough from a backend dict', () => {
    var playthroughObject = playthroughObjectFactory.createFromBackendDict({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: <IEarlyQuitCustomizationArgs>{
        state_name: {value: 'early quit'},
      },
      actions: [
        {
          action_type: 'ExplorationStart',
          action_customization_args: {
            state_name: {value: 'state name'},
          },
          schema_version: 1
        }
      ]
    });

    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({
      state_name: {value: 'early quit'},
    });
    expect(playthroughObject.actions).toEqual([
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'state name'},
      })
    ]);
  });

  it('should convert a playthrough to a backend dict', () => {
    var actions = [
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'state name'},
      })
    ];
    var customizationArgs: IEarlyQuitCustomizationArgs = {
      state_name: {value: 'early quit'},
      time_spent_in_exp_in_msecs: {value: 45000},
    };
    var playthroughObject = playthroughObjectFactory.createNew(
      'expId1', 1, 'EarlyQuit', customizationArgs, actions);

    expect(playthroughObject.toBackendDict()).toEqual({
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: {
        state_name: {value: 'early quit'},
        time_spent_in_exp_in_msecs: {value: 45000},
      },
      actions: [{
        action_type: 'ExplorationStart',
        action_customization_args: {
          state_name: {value: 'state name'},
        },
        schema_version: 1
      }]
    });
  });
});
