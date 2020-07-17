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

/**
 * Encodes the back-end response of a task entry. This interface is intended to
 * be extended with a stronger "TaskType" to help the compiler enforce that the
 * fields are set correctly.
 *
 * When the task type is excluded, it is assumed to be a simple string that can
 * match any task. This is used when, for example, rendering the list of tasks
 * as a table (where the type doesn't matter).
 */
export interface ITaskEntryBackendDict<TaskType = string> {
  'entity_type': string;
  'entity_id': string;
  'entity_version': number;
  'task_type': TaskType;
  'target_type': string;
  'target_id': string;
  'issue_description': string;
  'status': string;
  'resolver_username': string;
  'resolver_profile_picture_data_url': string;
  'resolved_on_msecs': number;
}

/**
 * Encodes the minimal details required to store a task to the back-end. This
 * interface is intended to be extended with a stronger "TaskType" to help the
 * compiler enforce that the fields are set correctly.
 *
 * When the task type is excluded, it is assumed to be a simple string that can
 * match any task. This is used when, for example, rendering the list of tasks
 * as a table (where the type doesn't matter).
 */
export interface ITaskEntryPayloadDict<TaskType = string> {
  'entity_version': number;
  'task_type': TaskType;
  'target_id': string;
  'issue_description': string;
  'status': string;
}

/**
 * Encodes a task's management details. This class is intended to be extended
 * with a stronger "TaskType" to help the compiler enforce that the fields are
 * set correctly.
 *
 * When the task type is excluded, it is assumed to be a simple string that can
 * match any task. This is used when, for example, rendering the list of tasks
 * as a table (where the type doesn't matter).
 */
export class TaskEntry<TaskType = string> {
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly entityVersion: number;
  public readonly taskType: TaskType;
  public readonly targetType: string;
  public readonly targetId: string;
  public readonly resolverUsername: string;
  public readonly resolverProfilePictureDataUrl: string;
  public readonly resolvedOnMsecs: number;
  protected issueDescription: string;
  private taskStatus: string;

  constructor(backendDict: ITaskEntryBackendDict<TaskType>) {
    this.entityType = backendDict.entity_type;
    this.entityId = backendDict.entity_id;
    this.entityVersion = backendDict.entity_version;
    this.taskType = backendDict.task_type;
    this.targetType = backendDict.target_type;
    this.targetId = backendDict.target_id;
    this.resolverUsername = backendDict.resolver_username;
    this.resolverProfilePictureDataUrl = (
      backendDict.resolver_profile_picture_data_url);
    this.resolvedOnMsecs = backendDict.resolved_on_msecs;
    this.issueDescription = backendDict.issue_description;
    this.taskStatus = backendDict.status;
  }

  public toBackendDict(): ITaskEntryBackendDict<TaskType> {
    return {
      entity_type: this.entityType,
      entity_id: this.entityId,
      entity_version: this.entityVersion,
      task_type: this.taskType,
      target_type: this.targetType,
      target_id: this.targetId,
      issue_description: this.issueDescription,
      status: this.taskStatus,
      resolver_username: this.resolverUsername,
      resolver_profile_picture_data_url: this.resolverProfilePictureDataUrl,
      resolved_on_msecs: this.resolvedOnMsecs,
    };
  }

  public toPayloadDict(): ITaskEntryPayloadDict<TaskType> {
    return {
      entity_version: this.entityVersion,
      task_type: this.taskType,
      target_id: this.targetId,
      issue_description: this.issueDescription,
      status: this.taskStatus,
    };
  }

  public getStatus(): string {
    return this.taskStatus;
  }

  public getIssueDescription(): string {
    return this.issueDescription;
  }

  public isOpen(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_OPEN;
  }

  public isObsolete(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_OBSOLETE;
  }

  public isResolved(): boolean {
    return this.taskStatus === ImprovementsConstants.TASK_STATUS_RESOLVED;
  }

  public markAsObsolete(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_OBSOLETE;
  }

  protected markAsOpen(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_OPEN;
  }

  protected markAsResolved(): void {
    this.taskStatus = ImprovementsConstants.TASK_STATUS_RESOLVED;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TaskEntryObjectFactory {
  createFromBackendDict(backendDict: ITaskEntryBackendDict): TaskEntry {
    return new TaskEntry(backendDict);
  }
}

angular.module('oppia').factory(
  'TaskEntryObjectFactory', downgradeInjectable(TaskEntryObjectFactory));
