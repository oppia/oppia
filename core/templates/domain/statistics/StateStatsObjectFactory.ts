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
 * @fileoverview Domain object holding the statistics of a state.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface IStateStatsBackendDict {
  'total_answers_count': number;
  'useful_feedback_count': number;
  'total_hit_count': number;
  'first_hit_count': number;
  'num_times_solution_viewed': number;
  'num_completions': number;
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
    return new StateStats(
      backendDict.total_answers_count, backendDict.useful_feedback_count,
      backendDict.total_hit_count, backendDict.first_hit_count,
      backendDict.num_times_solution_viewed, backendDict.num_completions);
  }
}

angular.module('oppia').factory(
  'StateStatsObjectFactory', downgradeInjectable(StateStatsObjectFactory));
