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

import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';
import { AdminPageData } from 'domain/admin/admin-backend-api.service';

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
  HUMAN_READABLE_CURRENT_TIME = '';
  CONTINUOUS_COMPUTATIONS_DATA = [];
  ONE_OFF_JOB_SPECS = [];
  UNFINISHED_JOB_DATA = [];
  AUDIT_JOB_SPECS = [];
  RECENT_JOB_DATA = [];

  constructor(
    private httpClient: HttpClient,
    private adminDataService: AdminDataService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
  ) { }

  showJobOutput(
      jobId: string
  ): void {
    let adminJobOutputUrl = this.urlInterpolationService.interpolateUrl(
      AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
        jobId: jobId
      });
    this.httpClient.get(adminJobOutputUrl).toPromise().then((response) => {
      this.showingJobOutput = true;
      this.jobOutput = response.output || [];
      this.jobOutput.sort();
      document.querySelector('#job-output')
        .scrollIntoView();
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.error
      );
    });
  }

  startNewJob(
      jobType: string) : void {
    this.setStatusMessage.emit('Starting new job...');
    this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'start_new_job',
      job_type: jobType
    }).toPromise().then(() => {
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

    this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'start_computation',
      computation_type: computationType
    }).toPromise().then(()=> {
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

    this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'stop_computation',
      computation_type: computationType
    }).toPromise().then(() => {
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

    this.httpClient.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'cancel_job',
      job_id: jobId,
      job_type: jobType
    }).toPromise().then(() => {
      this.setStatusMessage.emit('Abort signal sent to job.');
      this.windowRef._window().location.reload();
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.error);
    });
  }

  ngOnInit(): void {
    this.adminDataService.getDataAsync()
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
