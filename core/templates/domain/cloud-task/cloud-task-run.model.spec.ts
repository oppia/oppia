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
 * @fileoverview Unit tests for CloudTaskRun.
 */

import {CloudTaskRun} from 'domain/cloud-task/cloud-task-run.model';

describe('Cloud Task Run', () => {
  it('should create a CloudTaskRun instance', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'RUNNING',
      'function_456',
      ['Error 1', 'Error 2'],
      1,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    let cloudTaskRunDict = {
      task_run_id: '123',
      cloud_task_name: 'Test Task',
      latest_job_state: 'RUNNING',
      function_id: 'function_456',
      exception_messages_for_failed_runs: ['Error 1', 'Error 2'],
      current_retry_attempt: 1,
      last_updated: new Date('2025-01-01T00:00:00Z'),
      created_on: new Date('2025-01-01T00:00:00Z'),
    };

    let cloudTaskRunFromDict =
      CloudTaskRun.createFromBackendDict(cloudTaskRunDict);
    expect(cloudTaskRunFromDict).toEqual(cloudTaskRun);
    expect(cloudTaskRunFromDict.id).toBe('123');
    expect(cloudTaskRunFromDict.cloudTaskName).toBe('Test Task');
    expect(cloudTaskRunFromDict.latestJobState).toBe('RUNNING');
    expect(cloudTaskRunFromDict.functionId).toBe('function_456');
    expect(cloudTaskRunFromDict.exceptionMessagesForFailedRuns).toEqual([
      'Error 1',
      'Error 2',
    ]);
    expect(cloudTaskRunFromDict.currentRetryAttempt).toBe(1);
    expect(cloudTaskRunFromDict.lastUpdated).toEqual(
      new Date('2025-01-01T00:00:00Z')
    );
    expect(cloudTaskRunFromDict.createdOn).toEqual(
      new Date('2025-01-01T00:00:00Z')
    );
  });

  it('should return the correct MatIcon for running job state', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'RUNNING',
      'function_456',
      [],
      0,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    expect(cloudTaskRun.getJobStatusTooltipString()).toBe('Running...');
    expect(cloudTaskRun.getJobStatusMaterialIconCode()).toBe('run_circle');
    expect(cloudTaskRun.getJobStatusMaterialThemeColor()).toBe('accent');
  });

  it('should return the correct MatIcon for pending job state', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'PENDING',
      'function_456',
      [],
      0,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    expect(cloudTaskRun.getJobStatusTooltipString()).toBe('Pending...');
    expect(cloudTaskRun.getJobStatusMaterialIconCode()).toBe('pending');
    expect(cloudTaskRun.getJobStatusMaterialThemeColor()).toBe('accent');
  });

  it('should return the correct MatIcon for permanently failed job state', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'PERMANENTLY_FAILED',
      'function_456',
      [],
      0,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    expect(cloudTaskRun.getJobStatusTooltipString()).toBe('Permenently Failed');
    expect(cloudTaskRun.getJobStatusMaterialIconCode()).toBe('error');
    expect(cloudTaskRun.getJobStatusMaterialThemeColor()).toBeNull();
  });

  it('should return the correct MatIcon for failed and awaiting retry job state', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'FAILED_AND_AWAITING_RETRY',
      'function_456',
      [],
      0,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    expect(cloudTaskRun.getJobStatusTooltipString()).toBe(
      'Failed and awaiting retry'
    );
    expect(cloudTaskRun.getJobStatusMaterialIconCode()).toBe('error');
    expect(cloudTaskRun.getJobStatusMaterialThemeColor()).toBeNull();
  });

  it('should return the correct MatIcon for succeeded job state', () => {
    let cloudTaskRun = new CloudTaskRun(
      '123',
      'Test Task',
      'SUCCEEDED',
      'function_456',
      [],
      0,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z')
    );

    expect(cloudTaskRun.getJobStatusTooltipString()).toBe('Succeeded');
    expect(cloudTaskRun.getJobStatusMaterialIconCode()).toBe('check_circle');
    expect(cloudTaskRun.getJobStatusMaterialThemeColor()).toBe('primary');
  });
});
