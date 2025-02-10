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
 * @fileoverview Unit tests for the StateStats domain object.
 */

import {StateStats} from 'domain/statistics/state-stats-model';

describe('State-stats model', function () {
  it('should derive values from the backend dict', () => {
    const stateStats = StateStats.createFromBackendDict({
      total_answers_count: 1,
      useful_feedback_count: 10,
      total_hit_count: 100,
      first_hit_count: 1000,
      num_times_solution_viewed: 10000,
      num_completions: 100000,
    });

    expect(stateStats.totalAnswersCount).toEqual(1);
    expect(stateStats.usefulFeedbackCount).toEqual(10);
    expect(stateStats.totalHitCount).toEqual(100);
    expect(stateStats.firstHitCount).toEqual(1000);
    expect(stateStats.numTimesSolutionViewed).toEqual(10000);
    expect(stateStats.numCompletions).toEqual(100000);
  });
});
