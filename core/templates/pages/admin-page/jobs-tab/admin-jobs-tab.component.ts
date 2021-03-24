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
 * @fileoverview Component for the jobs tab in the admin panel.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminBackendApiService, AdminPageData } from 'domain/admin/admin-backend-api.service';
import { ComputationData } from 'domain/admin/computation-data.model';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { Job } from 'domain/admin/job.model';

@Component({
  selector: 'oppia-admin-jobs-tab',
  templateUrl: './admin-jobs-tab.component.html'
})
export class AdminJobsTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = (
    new EventEmitter
  );
  showingJobOutput: boolean;
  jobOutput = [];
  HUMAN_READABLE_CURRENT_TIME: string = '';
  CONTINUOUS_COMPUTATIONS_DATA: ComputationData[] = [];
  ONE_OFF_JOB_SPECS: JobStatusSummary[] = [];
  UNFINISHED_JOB_DATA: Job[] = [];
  AUDIT_JOB_SPECS: JobStatusSummary[] = [];
  RECENT_JOB_DATA: Job[] = [];
  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private windowRef: WindowRef,
  ) {}

  showJobOutput(jobId: string): void {
    this.adminBackendApiService.fetchJobOutputAsync(jobId)
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
    this.adminBackendApiService.startNewJobAsync(jobType).then(() => {
      this.setStatusMessage.emit('Job started successfully.');
      this.windowRef._window().location.reload();
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.error
      );
    });
  }

  startComputation(
      computationType: string): void {
    this.setStatusMessage.emit('Starting computation');

    this.adminBackendApiService.startComputationAsync(computationType)
      .then(()=> {
        this.setStatusMessage.emit('Computation started successfully.');
        this.windowRef._window().location.reload();
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error
        );
      });
  }

  stopComputation(
      computationType: string
  ): void {
    this.setStatusMessage.emit('Stopping computation...');
    this.adminBackendApiService.stopComputationAsync(computationType)
      .then(() => {
        this.setStatusMessage.emit('Abort signal sent to computation.');
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

    this.adminBackendApiService.cancelJobAsync(jobId, jobType).then(() => {
      this.setStatusMessage.emit('Abort signal sent to job.');
      this.windowRef._window().location.reload();
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.error);
    });
  }

  ngOnInit(): void {
    this.adminBackendApiService.getDataAsync()
      .then((adminDataObject: AdminPageData) => {
        this.HUMAN_READABLE_CURRENT_TIME = (
          adminDataObject.humanReadableCurrentTime
        );
        this.CONTINUOUS_COMPUTATIONS_DATA = (
          adminDataObject.continuousComputationsData
        );
        this.ONE_OFF_JOB_SPECS = adminDataObject.oneOffJobStatusSummaries;
        this.UNFINISHED_JOB_DATA = adminDataObject.unfinishedJobData;
        this.AUDIT_JOB_SPECS = adminDataObject.auditJobStatusSummaries;
        this.RECENT_JOB_DATA = adminDataObject.recentJobData;
      });
    this.showingJobOutput = false;
  }
}

angular.module('oppia').directive('oppiaAdminJobsTab',
  downgradeComponent({component: AdminJobsTabComponent}));
