// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for Cloud task run.
 */

export interface CloudTaskRunBackendDict {
  task_run_id: string;
  cloud_task_name: string;
  latest_job_state: string;
  function_id: string;
  exception_messages_for_failed_runs: string[];
  current_retry_attempt: number;
  last_updated: Date;
  created_on: Date;
}

export class MatIcon {
  constructor(
    public tooltip: string,
    public code: string,
    public color: string | null
  ) {}
}

export class CloudTaskRun {
  id: string;
  cloudTaskName: string;
  latestJobState: string;
  functionId: string;
  exceptionMessagesForFailedRuns: string[];
  currentRetryAttempt: number;
  lastUpdated: Date;
  createdOn: Date;
  matIcon!: MatIcon;

  constructor(
    taskRunId: string,
    cloudTaskName: string,
    latestJobState: string,
    functionId: string,
    exceptionMessagesForFailedRuns: string[],
    currentRetryAttempt: number,
    lastUpdated: Date,
    createdOn: Date
  ) {
    this.id = taskRunId;
    this.cloudTaskName = cloudTaskName;
    this.latestJobState = latestJobState;
    this.functionId = functionId;
    this.exceptionMessagesForFailedRuns = exceptionMessagesForFailedRuns;
    this.currentRetryAttempt = currentRetryAttempt;
    this.lastUpdated = lastUpdated;
    this.createdOn = createdOn;

    switch (this.latestJobState) {
      case 'RUNNING':
        this.matIcon = new MatIcon('Running...', 'run_circle', 'accent');
        break;
      case 'PENDING':
        this.matIcon = new MatIcon('Pending...', 'pending', 'accent');
        break;
      case 'PERMANENTLY_FAILED':
        this.matIcon = new MatIcon('Permenently Failed', 'error', null);
        break;
      case 'FAILED_AND_AWAITING_RETRY':
        this.matIcon = new MatIcon('Failed and awaiting retry', 'error', null);
        break;
      case 'SUCCEEDED':
        this.matIcon = new MatIcon('Succeeded', 'check_circle', 'primary');
        break;
    }
  }

  static createFromBackendDict(
    backendDict: CloudTaskRunBackendDict
  ): CloudTaskRun {
    return new CloudTaskRun(
      backendDict.task_run_id,
      backendDict.cloud_task_name,
      backendDict.latest_job_state,
      backendDict.function_id,
      backendDict.exception_messages_for_failed_runs,
      backendDict.current_retry_attempt,
      backendDict.last_updated,
      backendDict.created_on
    );
  }

  getJobStatusTooltipString(): string {
    return this.matIcon.tooltip;
  }

  getJobStatusMaterialIconCode(): string {
    return this.matIcon.code;
  }

  getJobStatusMaterialThemeColor(): string | null {
    return this.matIcon.color;
  }
}
