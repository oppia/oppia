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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface IStateStatsBackendDict {
  'total_answers_count_v1': number;
  'total_answers_count_v2': number;
  'useful_feedback_count_v1': number;
  'useful_feedback_count_v2': number;
  'total_hit_count_v1': number;
  'total_hit_count_v2': number;
  'first_hit_count_v1': number;
  'first_hit_count_v2': number;
  // Solution view analytics were only introduced in v2, and there are no
  // existing event models in v1 that record solution viewed events.
  'num_times_solution_viewed_v2': number;
  'num_completions_v1': number;
  'num_completions_v2': number;
}

export class StateStats {
  constructor(
      public readonly totalAnswersCount: number,
      public readonly usefulFeedbackCount: number,
      public readonly totalHitCount: number,
      public readonly firstHitCount: number,
      public readonly numTimesSolutionViewed: number,
      public readonly numCompletions: number) {}
}

@Injectable({
  providedIn: 'root'
})
export class StateStatsObjectFactory {
  createFromBackendDict(backendDict: IStateStatsBackendDict): StateStats {
    const totalAnswersCount = (
      backendDict.total_answers_count_v1 + backendDict.total_answers_count_v2);
    const usefulFeedbackCount = (
      backendDict.useful_feedback_count_v1 +
      backendDict.useful_feedback_count_v2);
    const totalHitCount = (
      backendDict.total_hit_count_v1 + backendDict.total_hit_count_v2);
    const firstHitCount = (
      backendDict.first_hit_count_v1 + backendDict.first_hit_count_v2);
    const numTimesSolutionViewed = backendDict.num_times_solution_viewed_v2;
    const numCompletions = (
      backendDict.num_completions_v1 + backendDict.num_completions_v2);

    return new StateStats(
      totalAnswersCount, usefulFeedbackCount, totalHitCount, firstHitCount,
      numTimesSolutionViewed,numCompletions);
  }
}

angular.module('oppia').factory(
  'StateStatsObjectFactory', downgradeInjectable(StateStatsObjectFactory));
