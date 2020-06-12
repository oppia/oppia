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

import { IStateStatsBackendDict, StateStats, StateStatsObjectFactory } from
  'domain/statistics/StateStatsObjectFactory';

export interface IExplorationStatsBackendDict {
  'exp_id': string;
  'exp_version': number;
  'num_starts_v1': number;
  'num_starts_v2': number;
  'num_actual_starts_v1': number;
  'num_actual_starts_v2': number;
  'num_completions_v1': number;
  'num_completions_v2': number;
  'state_stats_mapping': {[stateName: string]: IStateStatsBackendDict};
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationStats {
  constructor(
      public readonly expId: string,
      public readonly expVersion: number,
      public readonly numStarts: number,
      public readonly numActualStarts: number,
      public readonly numCompletions: number,
      private readonly stateStatsMapping: Map<string, StateStats>) {}

  getStateStatsEntries(): [string, StateStats][] {
    return [...this.stateStatsMapping.entries()];
  }

  getStateNames(): string[] {
    return [...this.stateStatsMapping.keys()];
  }

  hasStateStats(stateName: string): boolean {
    return this.stateStatsMapping.has(stateName);
  }

  getStateStats(stateName: string): StateStats {
    return this.stateStatsMapping.get(stateName);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatsObjectFactory {
  constructor(private stateStatsObjectFactory: StateStatsObjectFactory) {}

  createFromBackendDict(
      expStatsBackendDict: IExplorationStatsBackendDict): ExplorationStats {
    const numStarts = (
      expStatsBackendDict.num_starts_v1 + expStatsBackendDict.num_starts_v2);
    const numActualStarts = (
      expStatsBackendDict.num_actual_starts_v1 +
      expStatsBackendDict.num_actual_starts_v2);
    const numCompletions = (
      expStatsBackendDict.num_completions_v1 +
      expStatsBackendDict.num_completions_v2);
    const stateStatsMapping = new Map(
      Object.entries(expStatsBackendDict.state_stats_mapping).map(
        ([stateName, stateStats]) => [
          stateName,
          this.stateStatsObjectFactory.createFromBackendDict(stateStats)
        ]));

    return new ExplorationStats(
      expStatsBackendDict.exp_id, expStatsBackendDict.exp_version,
      numStarts, numActualStarts, numCompletions, stateStatsMapping);
  }
}

angular.module('oppia').factory(
  'ExplorationStatsObjectFactory',
  downgradeInjectable(ExplorationStatsObjectFactory));
