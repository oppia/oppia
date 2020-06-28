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
 * @fileoverview Unit tests for the ExplorationStats domain object.
 */

import { TestBed } from '@angular/core/testing';

import {
  ExplorationStats,
  ExplorationStatsObjectFactory,
  IExplorationStatsBackendDict
} from 'domain/statistics/ExplorationStatsObjectFactory';
import { StateStats } from 'domain/statistics/StateStatsObjectFactory';

describe('Exploration stats', function() {
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory;

  beforeEach(() => {
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
  });

  it('should derive values from the backend dict', () => {
    const explorationStatsBackendDict: IExplorationStatsBackendDict = {
      exp_id: 'eid',
      exp_version: 1,
      num_starts: 1,
      num_actual_starts: 10,
      num_completions: 100,
      state_stats_mapping: {},
    };

    const explorationStats: ExplorationStats = (
      explorationStatsObjectFactory.createFromBackendDict(
        explorationStatsBackendDict));

    expect(explorationStats.expId).toEqual('eid');
    expect(explorationStats.expVersion).toEqual(1);
    expect(explorationStats.numStarts).toEqual(1);
    expect(explorationStats.numActualStarts).toEqual(10);
    expect(explorationStats.numCompletions).toEqual(100);
  });

  describe('Querying for state stats', () => {
    let explorationStats: ExplorationStats;
    beforeEach(() => {
      explorationStats = explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid',
        exp_version: 100,
        num_starts: 100,
        num_actual_starts: 100,
        num_completions: 100,
        state_stats_mapping: {
          Introduction: {
            total_answers_count: 1,
            useful_feedback_count: 1,
            total_hit_count: 10,
            first_hit_count: 10,
            num_times_solution_viewed: 100,
            num_completions: 1,
          },
          Middle: {
            total_answers_count: 1,
            useful_feedback_count: 1,
            total_hit_count: 10,
            first_hit_count: 10,
            num_times_solution_viewed: 100,
            num_completions: 1,
          },
          End: {
            total_answers_count: 1,
            useful_feedback_count: 1,
            total_hit_count: 10,
            first_hit_count: 10,
            num_times_solution_viewed: 100,
            num_completions: 1,
          },
        },
      });
    });

    it('should return corresponding state stats', () => {
      const introductionStats = explorationStats.getStateStats('Introduction');
      expect(introductionStats).toBeInstanceOf(StateStats);
    });

    it('should return array of included state names', () => {
      expect(explorationStats.getStateNames()).toEqual(
        jasmine.arrayWithExactContents(['Introduction', 'Middle', 'End']));
    });

    it('should throw an error if state stats do not exist', () => {
      expect(() => explorationStats.getStateStats('Prelude'))
        .toThrowError('no stats exist for state: Prelude');
    });

    it('should calculate bounce rate of state compared to exploration', () => {
      const introductionStats = explorationStats.getStateStats('Introduction');

      expect(introductionStats.totalHitCount).toEqual(10);
      expect(introductionStats.numCompletions).toEqual(1);
      expect(explorationStats.numStarts).toEqual(100);

      expect(explorationStats.getBounceRate('Introduction'))
        .toBeCloseTo((10 - 1) / 100);
    });

    it('should throw an error when trying to calculate bounce rate of an ' +
      'unplayed exploration', () => {
      explorationStats = explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid',
        exp_version: 0,
        num_starts: 0,
        num_actual_starts: 0,
        num_completions: 0,
        state_stats_mapping: {
          Introduction: {
            total_answers_count: 0,
            useful_feedback_count: 0,
            total_hit_count: 0,
            first_hit_count: 0,
            num_times_solution_viewed: 0,
            num_completions: 0,
          },
        },
      });
      expect(() => explorationStats.getBounceRate('Introduction'))
        .toThrowError('Can not get bounce rate of an unplayed exploration');
    });
  });
});
