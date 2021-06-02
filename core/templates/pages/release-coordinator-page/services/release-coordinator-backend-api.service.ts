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
 * @fileoverview Service that manages release coordinator's backend api calls.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ComputationData, ComputationDataBackendDict } from 'domain/admin/computation-data.model';
import { Job, JobDataBackendDict } from 'domain/admin/job.model';
import { JobStatusSummary, JobStatusSummaryBackendDict } from 'domain/admin/job-status-summary.model';

interface JobOutputBackendResponse {
  output: string[];
}

export interface JobsDataBackendDict {
  'one_off_job_status_summaries': JobStatusSummaryBackendDict[];
  'human_readable_current_time': string;
  'audit_job_status_summaries': JobStatusSummaryBackendDict[];
  'unfinished_job_data': JobDataBackendDict[];
  'recent_job_data': JobDataBackendDict[];
  'continuous_computations_data': ComputationDataBackendDict[];
}

interface MemoryCacheProfileResponse {
  'peak_allocation': string,
  'total_allocation': string,
  'total_keys_stored': string
}

export interface JobsData {
  oneOffJobStatusSummaries: JobStatusSummary[];
  humanReadableCurrentTime: string;
  auditJobStatusSummaries: JobStatusSummary[];
  unfinishedJobData: Job[];
  recentJobData: Job[];
  continuousComputationsData: ComputationData[];
}

@Injectable({
  providedIn: 'root'
})
export class ReleaseCoordinatorBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getJobsDataAsync(): Promise<JobsData> {
    return new Promise((resolve, reject) => {
      this.http.get<JobsDataBackendDict>(
        '/jobshandler').toPromise().then(response => {
        resolve({
          oneOffJobStatusSummaries: response.one_off_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          humanReadableCurrentTime: response.human_readable_current_time,
          auditJobStatusSummaries: response.audit_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          unfinishedJobData: response.unfinished_job_data.map(
            Job.createFromBackendDict),
          recentJobData: response.recent_job_data.map(
            Job.createFromBackendDict),
          continuousComputationsData: response.continuous_computations_data.map(
            ComputationData.createFromBackendDict),
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  private async _postRequestAsync(
      payload?: Object, action?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        '/jobshandler', { action, ...payload }).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async startNewJobAsync(jobType: string): Promise<void> {
    let action = 'start_new_job';
    let payload = {
      job_type: jobType
    };
    return this._postRequestAsync(payload, action);
  }

  async cancelJobAsync(jobId: string, jobType: string): Promise<void> {
    let action = 'cancel_job';
    let payload = {
      job_id: jobId,
      job_type: jobType
    };
    return this._postRequestAsync(payload, action);
  }

  async startComputationAsync(computationType: string): Promise<void> {
    let action = 'start_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postRequestAsync(payload, action);
  }

  async stopComputationAsync(computationType: string): Promise<void> {
    let action = 'stop_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postRequestAsync(payload, action);
  }

  async fetchJobOutputAsync(jobId: string): Promise<string[]> {
    let adminJobOutputUrl = this.urlInterpolationService.interpolateUrl(
      '/joboutputhandler?job_id=<jobId>', {
        jobId: jobId
      });
    return new Promise((resolve, reject) => {
      this.http.get<JobOutputBackendResponse>(
        adminJobOutputUrl).toPromise().then(response => {
        resolve(Array.isArray(response.output) ? response.output.sort() : []);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async getMemoryCacheProfileAsync(): Promise<MemoryCacheProfileResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<MemoryCacheProfileResponse>(
        '/memorycachehandler').toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async flushMemoryCacheAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        '/memorycachehandler').toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'ReleaseCoordinatorBackendApiService',
  downgradeInjectable(ReleaseCoordinatorBackendApiService));
