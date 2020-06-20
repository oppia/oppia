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
 * @fileoverview Domain object for holding the stats of an exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { IStateStatsBackendDict, StateStats, StateStatsObjectFactory } from
  'domain/statistics/StateStatsObjectFactory';

export interface IExplorationStatsBackendDict {
  'exp_id': string;
  'exp_version': number;
  'num_starts': number;
  'num_actual_starts': number;
  'num_completions': number;
  'state_stats_mapping': {
    [stateName: string]: IStateStatsBackendDict;
  };
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

  getBounceRate(stateName: string): number {
    if (this.numStarts === 0) {
      throw new Error('Can not get bounce rate of an unplayed exploration');
    }
    const { totalHitCount, numCompletions } = this.getStateStats(stateName);
    return (totalHitCount - numCompletions) / this.numStarts;
  }

  getStateNames(): string[] {
    return [...this.stateStatsMapping.keys()];
  }

  getStateStats(stateName: string): StateStats {
    if (!this.stateStatsMapping.has(stateName)) {
      throw new Error('no stats exist for state: ' + stateName);
    }
    return this.stateStatsMapping.get(stateName);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatsObjectFactory {
  constructor(private stateStatsObjectFactory: StateStatsObjectFactory) {}

  createFromBackendDict(
      backendDict: IExplorationStatsBackendDict): ExplorationStats {
    const stateStatsMapping = new Map(
      Object.entries(backendDict.state_stats_mapping).map(
        ([stateName, stateStatsBackendDict]) => [
          stateName,
          this.stateStatsObjectFactory.createFromBackendDict(
            stateStatsBackendDict)
        ]));
    return new ExplorationStats(
      backendDict.exp_id, backendDict.exp_version, backendDict.num_starts,
      backendDict.num_actual_starts, backendDict.num_completions,
      stateStatsMapping);
  }
}

angular.module('oppia').factory(
  'ExplorationStatsObjectFactory',
  downgradeInjectable(ExplorationStatsObjectFactory));
