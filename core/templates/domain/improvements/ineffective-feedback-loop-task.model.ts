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
 * @fileoverview Frontend Model for ineffective feedback loop improvements
 *    task.
 */

import {
  TaskEntryBackendDict,
  TaskEntry,
} from 'domain/improvements/task-entry.model';
import {ImprovementsConstants} from 'domain/improvements/improvements.constants';

export class IneffectiveFeedbackLoopTask extends TaskEntry<'ineffective_feedback_loop'> {
  constructor(backendDict: TaskEntryBackendDict<'ineffective_feedback_loop'>) {
    if (
      backendDict.entity_type !==
      ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION
    ) {
      throw new Error(
        `backend dict has entity_type "${backendDict.entity_type}" ` +
          `but expected "${ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION}"`
      );
    }
    if (
      backendDict.task_type !==
      ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP
    ) {
      throw new Error(
        `backend dict has task_type "${backendDict.task_type}" but expected ` +
          `"${ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP}"`
      );
    }
    if (
      backendDict.target_type !== ImprovementsConstants.TASK_TARGET_TYPE_STATE
    ) {
      throw new Error(
        `backend dict has target_type "${backendDict.target_type}" ` +
          `but expected "${ImprovementsConstants.TASK_TARGET_TYPE_STATE}"`
      );
    }
    super(backendDict);
  }

  private static createNewObsoleteTask(
    expId: string,
    expVersion: number,
    stateName: string
  ): IneffectiveFeedbackLoopTask {
    return new IneffectiveFeedbackLoopTask({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_OBSOLETE,
      resolver_username: null,
      resolved_on_msecs: null,
    });
  }

  static createNew(
    expId: string,
    expVersion: number,
    stateName: string,
    numCyclicStateTransitionsPlaythroughs: number
  ): IneffectiveFeedbackLoopTask {
    const task = IneffectiveFeedbackLoopTask.createNewObsoleteTask(
      expId,
      expVersion,
      stateName
    );
    task.refreshStatus(numCyclicStateTransitionsPlaythroughs);
    return task;
  }

  static createFromBackendDict(
    backendDict: TaskEntryBackendDict<'ineffective_feedback_loop'>
  ): IneffectiveFeedbackLoopTask {
    return new IneffectiveFeedbackLoopTask(backendDict);
  }

  public resolve(): void {
    this.markAsResolved();
  }

  public refreshStatus(numCyclicStateTransitionsPlaythroughs: number): void {
    if (this.isObsolete() && numCyclicStateTransitionsPlaythroughs > 0) {
      this.generateIssueDescription(numCyclicStateTransitionsPlaythroughs);
      this.markAsOpen();
    }
  }

  private generateIssueDescription(
    numCyclicStateTransitionsPlaythroughs: number
  ): void {
    this.issueDescription =
      `At least ${numCyclicStateTransitionsPlaythroughs} learners had quit ` +
      'after revisiting this card several times.';
  }
}
