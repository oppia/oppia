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
  constructor(backendDict: ITaskEntryBackendDict) {
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

  public resolve(): void {
    this.markAsResolved();
  }

  public refreshStatus(expStats: ExplorationStats): void {
    if (expStats.expId !== this.entityId ||
        expStats.expVersion !== this.entityVersion) {
      throw new Error(
        'Expected stats for exploration ' + (
          'id="' + this.entityId + '" v' + this.entityVersion) +
        ' but given stats are for exploration ' + (
          'id="' + expStats.expId + '" v' + expStats.expVersion));
    }
    const expStarts = expStats.numStarts;
    if (expStarts < ImprovementsConstants.HIGH_BOUNCE_RATE_MIN_EXP_STARTS) {
      // Too few visits for calculating a meaningful bounce-rate. Not an error.
      return;
    }
    const bounceRate = expStats.getBounceRate(this.targetId);
    if (this.meetsCreationConditions(bounceRate)) {
      this.markAsOpen();
      this.generateIssueDescription(bounceRate);
    } else if (this.meetsObsoletionConditions(bounceRate)) {
      this.markAsObsolete();
    }
  }

  private meetsCreationConditions(bounceRate: number): boolean {
    return (
      this.isObsolete() &&
      bounceRate >= ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_HIGH);
  }

  private meetsObsoletionConditions(bounceRate: number): boolean {
    return (
      this.isOpen() &&
      bounceRate < ImprovementsConstants.HIGH_BOUNCE_RATE_THRESHOLD_LOW);
  }

  private generateIssueDescription(bounceRate: number): void {
    const bounceRateAsPercentString = Math.round(100 * bounceRate) + '%';
    this.issueDescription = (
      bounceRateAsPercentString + ' of learners had dropped off at this card.');
  }
}

@Injectable({
  providedIn: 'root'
})
export class HighBounceRateTaskObjectFactory {
  private createNewObsoleteTask(
      expId: string, expVersion: number,
      stateName: string): HighBounceRateTask {
    return new HighBounceRateTask({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE,
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });
  }

  /**
   * Returns list of tasks for each of the given state names when their stats
   * demonstrate a high bounce rate. Otherwise, corresponding index will be
   * null.
   */
  createFromExplorationStats(
      expStats: ExplorationStats, stateNames: string[]): HighBounceRateTask[] {
    const { expId, expVersion } = expStats;
    return stateNames.map(stateName => {
      const task = this.createNewObsoleteTask(expId, expVersion, stateName);
      task.refreshStatus(expStats);
      return task.isOpen() ? task : null;
    });
  }

  /**
   * Returns a new task from the given backend dict, or null if the dict does
   * not represent a high bounce rate task.
   */
  createFromBackendDict(
      backendDict: ITaskEntryBackendDict): HighBounceRateTask {
    return new HighBounceRateTask(backendDict);
  }
}

angular.module('oppia').factory(
  'HighBounceRateTaskObjectFactory',
  downgradeInjectable(HighBounceRateTaskObjectFactory));
