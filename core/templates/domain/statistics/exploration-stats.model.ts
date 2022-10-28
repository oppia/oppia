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
 * @fileoverview Frontend Model for exploration stats.
 */

import { StateStatsBackendDict, StateStats } from
  'domain/statistics/state-stats-model';

export interface ExplorationStatsBackendDict {
  'exp_id': string;
  'exp_version': number;
  'num_starts': number;
  'num_actual_starts': number;
  'num_completions': number;
  'state_stats_mapping': {
    [stateName: string]: StateStatsBackendDict;
  };
}

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

  static createFromBackendDict(
      backendDict: ExplorationStatsBackendDict): ExplorationStats {
    const stateStatsMapping = (
      new Map(Object.entries(backendDict.state_stats_mapping).map(
        ([stateName, stateStatsBackendDict]) => [
          stateName,
          StateStats.createFromBackendDict(
            stateStatsBackendDict)
        ])));
    return new ExplorationStats(
      backendDict.exp_id, backendDict.exp_version, backendDict.num_starts,
      backendDict.num_actual_starts, backendDict.num_completions,
      stateStatsMapping);
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
    const stateStats = this.stateStatsMapping.get(stateName);
    if (!stateStats) {
      throw new Error('no stats exist for state: ' + stateName);
    }
    return stateStats;
  }

  /**
   * Constructs a new copy of the exploration stats, but with a zero-stats entry
   * for the given state name.
   *
   * This method allows instances of ExplorationStats to remain immutable, while
   * providing users with an interface for reflecting changes made to an
   * exploration.
   */
  createNewWithStateAdded(newStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    newStateStatsMapping.set(newStateName, new StateStats(0, 0, 0, 0, 0, 0));
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }

  /**
   * Constructs a new copy of the exploration stats, but with the given state
   * name removed.
   *
   * This method allows instances of ExplorationStats to remain immutable, while
   * providing users with an interface for reflecting changes made to an
   * exploration.
   */
  createNewWithStateDeleted(oldStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    newStateStatsMapping.delete(oldStateName);
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }

  /**
   * Constructs a new copy of the exploration stats, but with the given state's
   * name changed.
   *
   * This method allows instances of ExplorationStats to remain immutable, while
   * providing users with an interface for reflecting changes made to an
   * exploration.
   */
  createNewWithStateRenamed(
      oldStateName: string, newStateName: string): ExplorationStats {
    const newStateStatsMapping = new Map(this.stateStatsMapping);
    const stateStats = this.getStateStats(oldStateName);
    newStateStatsMapping.set(newStateName, stateStats);
    newStateStatsMapping.delete(oldStateName);
    return new ExplorationStats(
      this.expId, this.expVersion, this.numStarts, this.numActualStarts,
      this.numCompletions, newStateStatsMapping);
  }
}
