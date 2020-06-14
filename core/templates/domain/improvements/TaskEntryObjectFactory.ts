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
  'entity_type': string;
  'entity_id': string;
  'entity_version': number;
  'task_type': string;
  'target_type': string;
  'target_id': string;
  'resolver_username': string;
  'resolved_on_msecs': number;
  'issue_description': string;
  'status': string;
}

export class TaskEntry {
  constructor(
      public readonly entityType: string,
      public readonly entityId: string,
      public readonly entityVersion: number,
      public readonly taskType: string,
      public readonly targetType: string,
      public readonly targetId: string,
      public readonly resolverUsername: string,
      public readonly resolvedOnMsecs: number,
      protected issueDescription: string,
      private taskStatus: string) {}

  public toBackendDict(): ITaskEntryBackendDict {
    return {
      entity_type: this.entityType,
      entity_id: this.entityId,
      entity_version: this.entityVersion,
      task_type: this.taskType,
      target_type: this.targetType,
      target_id: this.targetId,
      resolver_username: this.resolverUsername,
      resolved_on_msecs: this.resolvedOnMsecs,
      issue_description: this.issueDescription,
      status: this.taskStatus,
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

  protected markAsOpen(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OPEN;
  }

  protected markAsObsolete(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_OBSOLETE;
  }

  protected markAsResolved(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_TYPE_RESOLVED;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TaskEntryObjectFactory {
  createFromBackendDict(backendDict: ITaskEntryBackendDict): TaskEntry {
    return new TaskEntry(
      backendDict.entity_type, backendDict.entity_id,
      backendDict.entity_version, backendDict.task_type,
      backendDict.target_type, backendDict.target_id,
      backendDict.resolver_username, backendDict.resolved_on_msecs,
      backendDict.issue_description, backendDict.status);
  }
}

angular.module('oppia').factory(
  'TaskEntryObjectFactory', downgradeInjectable(TaskEntryObjectFactory));
