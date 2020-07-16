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
      public readonly stateStatsMapping: ReadonlyMap<string, StateStats>) {
    this.stateStatsMapping = new Map(stateStatsMapping);
  }

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

  hasStateStates(stateName: string): boolean {
    return this.stateStatsMapping.has(stateName);
  }

  getStateStats(stateName: string): StateStats {
    if (!this.stateStatsMapping.has(stateName)) {
      throw new Error('no stats exist for state: ' + stateName);
    }
    return this.stateStatsMapping.get(stateName);
  }

  createNewWithStateAdded(newStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    newStateStatsMapping.set(newStateName, new StateStats(0, 0, 0, 0, 0, 0));
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }

  createNewWithStateDeleted(oldStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    newStateStatsMapping.delete(oldStateName);
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }

  createNewWithStateRenamed(
      oldStateName: string, newStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    newStateStatsMapping.set(
      newStateName, this.stateStatsMapping.get(oldStateName));
    // ES2016 Map uses delete as a method name despite it being a reserved word.
    // eslint-disable-next-line dot-notation
    newStateStatsMapping.delete(oldStateName);
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatsObjectFactory {
  constructor(private stateStatsObjectFactory: StateStatsObjectFactory) {}

  createFromBackendDict(
      backendDict: IExplorationStatsBackendDict): ExplorationStats {
    const stateStatsMapping = (
      new Map(Object.entries(backendDict.state_stats_mapping).map(
        ([stateName, stateStatsBackendDict]) => [
          stateName,
          this.stateStatsObjectFactory.createFromBackendDict(
            stateStatsBackendDict)
        ])));
    return new ExplorationStats(
      backendDict.exp_id, backendDict.exp_version, backendDict.num_starts,
      backendDict.num_actual_starts, backendDict.num_completions,
      stateStatsMapping);
  }
}

angular.module('oppia').factory(
  'ExplorationStatsObjectFactory',
  downgradeInjectable(ExplorationStatsObjectFactory));
