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
 * @fileoverview Domain object for holding details about an improvements task.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

export interface ITaskEntryBackendDict {
  'task_type': string;
  'target_type': string;
  'target_id': string;
  'issue_description'?: string;
  'status': string;
  'closed_by': string;
  'closed_on_msecs': number;
}

export class TaskEntry {
  constructor(
      public readonly taskType: string,
      public readonly targetType: string,
      public readonly targetId: string,
      protected issueDescription: string,
      private taskStatus: string,
      private closedBy: string,
      private closedOnMsecs: number) {}

  public toBackendDict(): ITaskEntryBackendDict {
    return {
      task_type: this.taskType,
      target_type: this.targetType,
      target_id: this.targetId,
      status: this.taskStatus,
      closed_by: this.closedBy,
      closed_on_msecs: this.closedOnMsecs,
      issue_description: this.issueDescription,
    };
  }

  public getIssueDescription(): string {
    return this.issueDescription;
  }

  public isOpen(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_TYPE_OPEN;
  }

  public isObsolete(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE;
  }

  public isResolved(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_TYPE_RESOLVED;
  }

  public getClosedBy(): string {
    return this.closedBy;
  }

  public getClosedOnMsecs(): number {
    return this.closedOnMsecs;
  }

  // NOTE TO DEVELOPERS: Only subclasses can change the task status, and only
  // through the following 3 methods. This ensures that the three status fields
  // (taskStatus, closedBy, closedOnMsecs) are always in sync.

  protected makeOpen(): void {
    this.closedBy = null;
    this.closedOnMsecs = null;
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OPEN;
  }

  protected makeObsolete(): void {
    this.closedBy = null;
    this.closedOnMsecs = null;
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE;
  }

  protected makeResolved(userId: string): void {
    this.closedBy = userId;
    this.closedOnMsecs = new Date().getUTCMilliseconds();
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_RESOLVED;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TaskEntryObjectFactory {
  createFromBackendDict(backendDict: ITaskEntryBackendDict): TaskEntry {
    return new TaskEntry(
      backendDict.task_type, backendDict.target_type, backendDict.target_id,
      backendDict.issue_description, backendDict.status, backendDict.closed_by,
      backendDict.closed_on_msecs);
  }
}

angular.module('oppia').factory(
  'TaskEntryObjectFactory', downgradeInjectable(TaskEntryObjectFactory));
