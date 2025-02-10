// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {TestBed} from '@angular/core/testing';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {
  ExplorationDiffService,
  ExplorationGraphChangeList,
} from './exploration-diff.service';
import {ExplorationChange} from 'domain/exploration/exploration-draft.model';

/**
 * @fileoverview Unit tests for the Exploration Diff Service.
 */

describe('Exploration Diff Service', () => {
  let explorationDiffService: ExplorationDiffService;
  let stateObjectFactory: StateObjectFactory;
  let explorationGraphChangeList: ExplorationGraphChangeList[];

  beforeEach(() => {
    explorationDiffService = new ExplorationDiffService();
    stateObjectFactory = TestBed.inject(StateObjectFactory);
  });

  it(
    'should throw error if try to access graph ' +
      'diff data with invalid command',
    () => {
      let newState = stateObjectFactory.createDefaultState(
        'newState',
        'content_0',
        'default_outcome_1'
      );
      let oldState = stateObjectFactory.createDefaultState(
        'oldState',
        'content_0',
        'default_outcome_1'
      );
      explorationGraphChangeList = [
        {
          changeList: [
            {
              cmd: 'invalidCommand',
              state_name: 'newState',
            } as unknown as ExplorationChange,
          ],
          directionForwards: true,
        },
      ];

      expect(() => {
        explorationDiffService.getDiffGraphData(
          {newState: newState},
          {oldState: oldState},
          explorationGraphChangeList
        );
      }).toThrowError('Invalid change command: invalidCommand');
    }
  );
});
