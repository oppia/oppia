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

import { IStateStatsBackendDict, StateStats, StateStatsObjectFactory } from
  'domain/statistics/StateStatsObjectFactory';

describe('State stats', function() {
  let stateStatsObjectFactory: StateStatsObjectFactory = null;
  beforeEach(() => {
    stateStatsObjectFactory = TestBed.get(StateStatsObjectFactory);
  });

  it('should derive values from the backend dict', () => {
    const stateStatsBackendDict: IStateStatsBackendDict = {
      total_answers_count_v1: 1,
      total_answers_count_v2: 2,
      useful_feedback_count_v1: 10,
      useful_feedback_count_v2: 20,
      total_hit_count_v1: 100,
      total_hit_count_v2: 200,
      first_hit_count_v1: 1000,
      first_hit_count_v2: 2000,
      num_times_solution_viewed_v2: 20000,
      num_completions_v1: 100000,
      num_completions_v2: 200000,
    };

    const stateStats: StateStats = (
      stateStatsObjectFactory.createFromBackendDict(stateStatsBackendDict));

    expect(stateStats.totalAnswersCount).toEqual(3);
    expect(stateStats.usefulFeedbackCount).toEqual(30);
    expect(stateStats.totalHitCount).toEqual(300);
    expect(stateStats.firstHitCount).toEqual(3000);
    expect(stateStats.numTimesSolutionViewed).toEqual(20000);
    expect(stateStats.numCompletions).toEqual(300000);
  });
});
