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
 * @fileoverview Backend Api Service for jobs tab in the admin panel.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AdminPageConstants } from '../admin-page.constants';
import { AdminDataService } from './admin-data.service';

export interface AdminJobOutputResponse {
  output: string[]
}

@Injectable({
  providedIn: 'root'
})
export class AdminJobsTabBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private adminDataService: AdminDataService,
    private urlInterpolationService: UrlInterpolationService
  ) { }

  getAdminJobOutput(jobId: string): Promise<AdminJobOutputResponse> {
    let adminJobOutputUrl = this.urlInterpolationService.interpolateUrl(
      AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
        jobId: jobId
      });
    return this.httpClient.get<AdminJobOutputResponse>(adminJobOutputUrl)
      .toPromise();
  }

  startNewJob(jobType: string): Promise<void> {
    return this.httpClient.post<void>(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'start_new_job',
      job_type: jobType
    }).toPromise();
  }

  startComputation(computationType: string): Promise<void> {
    return this.httpClient.post<void>(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'start_computation',
      computation_type: computationType
    }).toPromise();
  }

  stopComputation(computationType: string): Promise<void> {
    return this.httpClient.post<void>(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'stop_computation',
      computation_type: computationType
    }).toPromise();
  }

  cancelJob(jobId: string, jobType: string): Promise<void> {
    return this.httpClient.post<void>(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'cancel_job',
      job_id: jobId,
      job_type: jobType
    }).toPromise();
  }
}

angular.module('oppia').factory('AdminJobsTabBackendApiService',
  downgradeInjectable(AdminJobsTabBackendApiService));
