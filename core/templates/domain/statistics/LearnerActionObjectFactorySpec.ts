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
 * @fileoverview Unit tests for the LearnerActionObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';

describe('Learner Action Object Factory', () => {
  // TODO(#9311): Assign to "this" once we can use TestBed.inject to keep type
  // information.
  let learnerActionObjectFactory: LearnerActionObjectFactory;

  beforeEach(() => {
    learnerActionObjectFactory = TestBed.get(LearnerActionObjectFactory);
  });

  it('should create a new exploration start action', () => {
    const learnerAction = (
      learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: 'Hola'},
      }));

    expect(learnerAction.action_type).toEqual('ExplorationStart');
    expect(learnerAction.action_customization_args).toEqual({
      state_name: {value: 'Hola'},
    });
    expect(learnerAction.schema_version).toEqual(1);
  });

  it('should create a new answer submit action', () => {
    const learnerAction = (
      learnerActionObjectFactory.createAnswerSubmitAction({
        state_name: {value: 'Hola'},
        dest_state_name: {value: 'Adios'},
        interaction_id: {value: 'TextInput'},
        submitted_answer: {value: 'Hi'},
        feedback: {value: 'Correct!'},
        time_spent_state_in_msecs: {value: 3.5},
      }));

    expect(learnerAction.action_type).toEqual('AnswerSubmit');
    expect(learnerAction.action_customization_args).toEqual({
      state_name: {value: 'Hola'},
      dest_state_name: {value: 'Adios'},
      interaction_id: {value: 'TextInput'},
      submitted_answer: {value: 'Hi'},
      feedback: {value: 'Correct!'},
      time_spent_state_in_msecs: {value: 3.5},
    });
    expect(learnerAction.schema_version).toEqual(1);
  });

  it('should create a new exploration quit action', () => {
    const learnerAction = (
      learnerActionObjectFactory.createExplorationQuitAction({
        state_name: {value: 'Adios'},
        time_spent_in_state_in_msecs: {value: 300},
      }));

    expect(learnerAction.action_type).toEqual('ExplorationQuit');
    expect(learnerAction.action_customization_args).toEqual({
      state_name: {value: 'Adios'},
      time_spent_in_state_in_msecs: {value: 300},
    });
    expect(learnerAction.schema_version).toEqual(1);
  });
});
