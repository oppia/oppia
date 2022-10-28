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
 * @fileoverview Frontend Model for high bounce-rate improvements task.
 */

import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config.model';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { ExplorationStats } from
  'domain/statistics/exploration-stats.model';
import { TaskEntryBackendDict, TaskEntry } from
  'domain/improvements/task-entry.model';

export class HighBounceRateTask extends TaskEntry<'high_bounce_rate'> {
  constructor(backendDict: TaskEntryBackendDict<'high_bounce_rate'>) {
    if (backendDict.entity_type !==
            ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION) {
      throw new Error(
        `backend dict has entity_type "${backendDict.entity_type}" ` +
        `but expected "${ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION}"`);
    }
    if (backendDict.task_type !==
            ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE) {
      throw new Error(
        `backend dict has task_type "${backendDict.task_type}" ` +
        `but expected "${ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE}"`);
    }
    if (backendDict.target_type !==
            ImprovementsConstants.TASK_TARGET_TYPE_STATE) {
      throw new Error(
        `backend dict has target_type "${backendDict.target_type}" ` +
        `but expected "${ImprovementsConstants.TASK_TARGET_TYPE_STATE}"`);
    }
    super(backendDict);
  }

  static createFromBackendDict(
      backendDict: TaskEntryBackendDict<'high_bounce_rate'>
  ): HighBounceRateTask {
    return new HighBounceRateTask(backendDict);
  }

  public resolve(): void {
    this.markAsResolved();
  }

  public refreshStatus(
      expStats: ExplorationStats,
      numEarlyQuitPlaythroughs: number,
      config: ExplorationImprovementsConfig): void {
    if (expStats.expId !== this.entityId ||
        expStats.expVersion !== this.entityVersion) {
      throw new Error(
        'Expected stats for exploration ' + (
          'id="' + this.entityId + '" v' + this.entityVersion) +
        ' but given stats are for exploration ' + (
          'id="' + expStats.expId + '" v' + expStats.expVersion));
    }
    const expStarts = expStats.numStarts;
    if (expStarts < config.highBounceRateTaskMinimumExplorationStarts) {
      // Too few visits for calculating a meaningful bounce-rate. Not an error.
      return;
    }
    const bounceRate = expStats.getBounceRate(this.targetId);
    if (
      this.meetsCreationConditions(bounceRate, numEarlyQuitPlaythroughs, config)
    ) {
      this.markAsOpen();
      this.generateIssueDescription(bounceRate);
    } else if (this.meetsObsoletionConditions(bounceRate, config)) {
      this.markAsObsolete();
    }
  }

  private meetsCreationConditions(
      bounceRate: number, numEarlyQuitPlaythroughs: number,
      config: ExplorationImprovementsConfig): boolean {
    return (
      this.isObsolete() &&
      numEarlyQuitPlaythroughs > 0 &&
      bounceRate >= config.highBounceRateTaskStateBounceRateCreationThreshold);
  }

  private meetsObsoletionConditions(
      bounceRate: number, config: ExplorationImprovementsConfig): boolean {
    return (
      this.isOpen() &&
      bounceRate < config.highBounceRateTaskStateBounceRateObsoletionThreshold);
  }

  private generateIssueDescription(bounceRate: number): void {
    const bounceRateAsPercentString = Math.round(100 * bounceRate) + '%';
    this.issueDescription = (
      bounceRateAsPercentString + ' of learners had dropped off at this card.');
  }
}
