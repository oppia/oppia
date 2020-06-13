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
 * @fileoverview Domain object for a high bounce-rate improvements task.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';
import { ITaskEntryBackendDict, TaskEntry } from
  'domain/improvements/TaskEntryObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

export class HighBounceRateTask extends TaskEntry {
  constructor(
      stateName: string,
      issueDescription: string = null,
      taskStatus: string = ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE,
      closedBy: string = null,
      closedOnMsecs: number = null) {
    super(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE,
      ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      stateName, issueDescription, taskStatus, closedBy, closedOnMsecs);
  }

  public resolve(userId: string): void {
    this.makeResolved(userId);
  }

  public refreshStatus(explorationStats: ExplorationStats): void {
    if (explorationStats.numStarts <
        ImprovementsConstants.HIGH_BOUNCE_RATE_MINIMUM_EXPLORATION_STARTS) {
      return;
    }
    const bounceRate = explorationStats.getBounceRate(this.targetId);
    if (this.isOpen() &&
        bounceRate < ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_LOW) {
      this.makeObsolete();
    } else if (this.isObsolete() &&
               bounceRate >=
               ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_HIGH) {
      this.makeOpen();
      this.generateIssueDescription(bounceRate);
    }
  }

  private generateIssueDescription(bounceRate: number): void {
    const bonceRateAsPercentString = Math.round(100 * bounceRate) + '%';
    this.issueDescription = (
      bonceRateAsPercentString + ' of learners had dropped off at this card.');
  }
}

@Injectable({
  providedIn: 'root'
})
export class HighBounceRateTaskObjectFactory {
  /**
   * Returns a new task for the given state when the stats demonstrate a high
   * bounce rate for the given state. Otherwise, returns null.
   */
  public createFromExplorationStats(
      expStats: ExplorationStats,
      stateName: string): HighBounceRateTask | null {
    const task = new HighBounceRateTask(stateName);
    task.refreshStatus(expStats);
    return task.isOpen() ? task : null;
  }

  /**
   * Returns a new task from the given backend dict, or null if the dict does
   * not represent a high bounce rate task.
   */
  public createFromBackendDict(
      backendDict: ITaskEntryBackendDict): HighBounceRateTask | null {
    if (backendDict.task_type !==
        ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE) {
      return null;
    }
    if (backendDict.target_type !==
        ImprovementsConstants.TASK_TARGET_TYPE_STATE) {
      return null;
    }
    return new HighBounceRateTask(
      backendDict.target_id, backendDict.issue_description,
      backendDict.status, backendDict.closed_by, backendDict.closed_on_msecs);
  }
}

angular.module('oppia').factory(
  'HighBounceRateTaskObjectFactory',
  downgradeInjectable(HighBounceRateTaskObjectFactory));
