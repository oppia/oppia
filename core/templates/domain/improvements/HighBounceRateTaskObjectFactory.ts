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

import { ITaskEntryBackendDict, TaskEntry } from
  'domain/improvements/TaskEntryObjectFactory';

export class HighBounceRateTask extends TaskEntry {
  constructor(
      stateName: string,
      issueDescription: string,
      taskStatus: string = ImprovementsConstants.TASK_STATUS_TYPE_OPEN,
      closedBy: string = null,
      closedOnMsecs: number = null) {
    super(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE,
      ImprovementsConstants.TASK_TARGET_TYPE_STATE, stateName, issueDescription,
      taskStatus, closedBy, closedOnMsecs);
  }

  refreshStats(freshExplorationStats: ExplorationStats): void {
    const numExpStarts = freshExplorationStats.numStarts;
    if (numExpStarts <
        ImprovementsConstants.HIGH_BOUNCE_RATE_MINIMUM_EXPLORATION_STARTS) {
      return;
    }
    const stateBounceRate = freshExplorationStats.getBounceRate(this.targetId);
    if (stateBounceRate >=
        ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_LOW) {
      return;
    }
    this.discard();
  }
}

export class HighBounceRateTaskObjectFactory {
  /**
   * Returns a new task object if the provided stats warrant one. Otherwise,
   * returns null.
   */
  public createFromExplorationStats(
      explorationStats: ExplorationStats,
      stateName: string): HighBounceRateTask {
    const numExpStarts = explorationStats.numStarts;
    if (numExpStarts <
        ImprovementsConstants.HIGH_BOUNCE_RATE_MINIMUM_EXPLORATION_STARTS) {
      return null;
    }
    const stateBounceRate = explorationStats.getBounceRate(stateName);
    if (stateBounceRate <
        ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_HIGH) {
      return null;
    }
    return new HighBounceRateTask(
      stateName, this.newIssueDescription(stateBounceRate));
  }

  public createFromBackendDict(
      backendDict: ITaskEntryBackendDict): HighBounceRateTask {
    if (backendDict.task_type !==
        ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE) {
      throw new Error('task entry has wrong type');
    }
    return new HighBounceRateTask(
      backendDict.target_id, backendDict.issue_description, backendDict.status,
      backendDict.closed_by, backendDict.closed_on_msecs);
  }

  private newIssueDescription(bounceRate: number): string {
    return (
      Math.round(100 * bounceRate) +
      '% of learners had dropped off at this card.');
  }
}
