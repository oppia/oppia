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

import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { StateStats } from 'domain/statistics/StateStatsObjectFactory';

import { ITaskEntryBackendDict, TaskEntry, TaskEntryObjectFactory } from
  'domain/improvements/TaskEntryObjectFactory';

export class HighBounceRateTask {
  constructor(private taskEntry: TaskEntry) {}

  public isOpen(): boolean {
    return this.taskEntry.isOpen();
  }

  public resolve(userId: string): void {
    this.taskEntry.resolve(userId);
  }

  public toBackendDict(): ITaskEntryBackendDict {
    return this.taskEntry.toBackendDict();
  }
}

export class HighBounceRateTaskObjectFactory {
  constructor(taskEntryObjectFactory: TaskEntryObjectFactory) {}

  private getIssueDescription(
      expStarts: number, stateDropOffs: number): string {
    const dropOffPercent = Math.round(100 * stateDropOffs / expStarts);
    return dropOffPercent + '% of learners had dropped off at this card.';
  }

  createFromStats(
      expStats: ExplorationStats, stateStats: StateStats): HighBounceRateTask {
    const stateDropOffs = stateStats.totalHitCount - stateStats.numCompletions;
    const dropOffThreshold = (
      expStats.numStarts *
      ImprovementsConstants.HIGH_BOUNCE_RATE_DROP_OFF_PERCENT_THRESHOLD);
    if (stateDropOffs >= dropOffThreshold) {
      return new HighBounceRateTask();
    }
  }

  createFromBackendDict(
      backendDict: IHighBounceRateTaskBackendDict): HighBounceRateTask {
    return new HighBounceRateTask(
      backendDict.state_name, backendDict.status, backendDict.closed_by,
      backendDict.closed_on_msecs, backendDict.issue_description);
  }
}
