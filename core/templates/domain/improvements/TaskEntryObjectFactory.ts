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

import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

export interface ITaskEntryBackendDict {
  'task_type': string;
  'target_type': string;
  'target_id': string;
  'closed_by': string;
  'closed_on_msecs': number;
  'status': string;
  'issue_description'?: string;
}

export class TaskEntry {
  constructor(
      public taskType: string,
      public targetType: string,
      public targetId: string,
      public issueDescription: string,
      private taskStatus: string,
      private closedBy: string,
      private closedOnMsecs: number) {}

  open(): void {
    this.closedBy = null;
    this.closedOnMsecs = null;
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OPEN;
  }

  discard(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE;
  }

  resolve(userId: string): void {
    this.closedBy = userId;
    this.closedOnMsecs = new Date().getTime();
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE;
  }

  isOpen(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_TYPE_OPEN;
  }

  toBackendDict(): ITaskEntryBackendDict {
    return {
      task_type: this.taskType,
      target_type: this.targetType,
      target_id: this.targetId,
      status: this.taskStatus,
      issue_description: this.issueDescription,
      closed_by: this.closedBy,
      closed_on_msecs: this.closedOnMsecs,
    };
  }
}

export class TaskEntryObjectFactory {
  createNew(
      taskType: string,
      targetType: string,
      targetId: string,
      issueDescription: string,
      taskStatus: string = ImprovementsConstants.TASK_STATUS_TYPE_OPEN,
      closedBy: string = null,
      closedOnMsecs: number = null): TaskEntry {
    return new TaskEntry(
      taskType, targetType, targetId, issueDescription, taskStatus, closedBy,
      closedOnMsecs);
  }

  createFromBackendDict(backendDict: ITaskEntryBackendDict): TaskEntry {
    return new TaskEntry(
      backendDict.task_type, backendDict.target_type, backendDict.target_id,
      backendDict.issue_description, backendDict.status, backendDict.closed_by,
      backendDict.closed_on_msecs);
  }
}
