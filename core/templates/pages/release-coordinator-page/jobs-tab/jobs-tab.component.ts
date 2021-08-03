// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the jobs tab in the release-coordinator panel.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ReleaseCoordinatorBackendApiService, JobsData } from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { Job } from 'domain/admin/job.model';

@Component({
  selector: 'oppia-jobs-tab',
  templateUrl: './jobs-tab.component.html'
})
export class JobsTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = (
    new EventEmitter
  );
  showingJobOutput: boolean;
  jobOutput = [];
  HUMAN_READABLE_CURRENT_TIME: string = '';
  ONE_OFF_JOB_SPECS: JobStatusSummary[] = [];
  UNFINISHED_JOB_DATA: Job[] = [];
  AUDIT_JOB_SPECS: JobStatusSummary[] = [];
  RECENT_JOB_DATA: Job[] = [];
  constructor(
    private releaseCoordinatorBackendApiService: (
      ReleaseCoordinatorBackendApiService),
    private windowRef: WindowRef,
  ) {}

  showJobOutput(jobId: string): void {
    this.releaseCoordinatorBackendApiService.fetchJobOutputAsync(jobId)
      .then((jobOutput: string[]) => {
        this.showingJobOutput = true;
        this.jobOutput = jobOutput;
        document.querySelector('#job-output')
          .scrollIntoView();
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error
        );
      });
  }

  startNewJob(
      jobType: string): void {
    this.setStatusMessage.emit('Starting new job...');
    this.releaseCoordinatorBackendApiService.startNewJobAsync(jobType)
      .then(() => {
        this.setStatusMessage.emit('Job started successfully.');
        this.windowRef._window().location.reload();
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error
        );
      });
  }

  cancelJob(
      jobId: string,
      jobType: string): void {
    this.setStatusMessage.emit('Cancelling job...');

    this.releaseCoordinatorBackendApiService.cancelJobAsync(jobId, jobType)
      .then(() => {
        this.setStatusMessage.emit('Abort signal sent to job.');
        this.windowRef._window().location.reload();
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error);
      });
  }

  ngOnInit(): void {
    this.releaseCoordinatorBackendApiService.getJobsDataAsync()
      .then((jobsData: JobsData) => {
        this.HUMAN_READABLE_CURRENT_TIME = jobsData.humanReadableCurrentTime;
        this.ONE_OFF_JOB_SPECS = jobsData.oneOffJobStatusSummaries;
        this.UNFINISHED_JOB_DATA = jobsData.unfinishedJobData;
        this.AUDIT_JOB_SPECS = jobsData.auditJobStatusSummaries;
        this.RECENT_JOB_DATA = jobsData.recentJobData;
      });
    this.showingJobOutput = false;
  }
}

angular.module('oppia').directive(
  'oppiaJobsTab', downgradeComponent({component: JobsTabComponent}));
