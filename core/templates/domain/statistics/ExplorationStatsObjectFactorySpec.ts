// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview TODO
 */

import { TestBed } from '@angular/core/testing';

import {
  ExplorationStats,
  ExplorationStatsObjectFactory,
  IExplorationStatsBackendDict
} from 'domain/statistics/ExplorationStatsObjectFactory';
import { StateStats } from 'domain/statistics/StateStatsObjectFactory';

describe('Exploration stats', function() {
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory = null;
  beforeEach(() => {
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
  });

  it('should derive values from the backend dict', () => {
    const explorationStatsBackendDict: IExplorationStatsBackendDict = {
      exp_id: 'eid',
      exp_version: 1,
      num_starts_v1: 1,
      num_starts_v2: 2,
      num_actual_starts_v1: 10,
      num_actual_starts_v2: 20,
      num_completions_v1: 100,
      num_completions_v2: 200,
      state_stats_mapping: {},
    };

    const explorationStats: ExplorationStats = (
      explorationStatsObjectFactory.createFromBackendDict(
        explorationStatsBackendDict));

    expect(explorationStats.expId).toEqual('eid');
    expect(explorationStats.expVersion).toEqual(1);
    expect(explorationStats.numStarts).toEqual(3);
    expect(explorationStats.numActualStarts).toEqual(30);
    expect(explorationStats.numCompletions).toEqual(300);
  });

  describe('Querying for state stats', () => {
    let explorationStats: ExplorationStats;
    beforeEach(() => {
      explorationStats = explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid',
        exp_version: 100,
        num_starts_v1: 100,
        num_starts_v2: 200,
        num_actual_starts_v1: 100,
        num_actual_starts_v2: 200,
        num_completions_v1: 100,
        num_completions_v2: 200,
        state_stats_mapping: {
          Introduction: {
            total_answers_count_v1: 1,
            total_answers_count_v2: 2,
            useful_feedback_count_v1: 1,
            useful_feedback_count_v2: 2,
            total_hit_count_v1: 10,
            total_hit_count_v2: 20,
            first_hit_count_v1: 10,
            first_hit_count_v2: 20,
            num_times_solution_viewed_v2: 2,
            num_completions_v1: 1,
            num_completions_v2: 2,
          },
        },
      });
    });

    it('should return corresponding state stats', () => {
      const introductionStats = explorationStats.getStateStats('Introduction');
      expect(introductionStats).toBeInstanceOf(StateStats);
    });

    it('should throw an error if state stats do not exist', () => {
      expect(() => explorationStats.getStateStats('End'))
        .toThrowError('no stats exist for state: End');
    });

    it('should calculate bounce rate of state compared to exploration', () => {
      const introductionStats = explorationStats.getStateStats('Introduction');

      expect(introductionStats.totalHitCount).toEqual(30);
      expect(introductionStats.numCompletions).toEqual(3);
      expect(explorationStats.numStarts).toEqual(300);

      expect(explorationStats.getBounceRate('Introduction'))
        .toBeCloseTo((30 - 3) / 300);
    });
  });
});

