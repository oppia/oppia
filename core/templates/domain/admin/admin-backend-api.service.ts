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
 * @fileoverview Backend api service for fetching the admin data;
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';
import {
  TopicSummary,
  TopicSummaryBackendDict
} from 'domain/topic/topic-summary.model';
import {
  ComputationData,
  ComputationDataBackendDict,
} from 'domain/admin/computation-data.model';
import {
  Job,
  JobDataBackendDict,
} from 'domain/admin/job.model';
import {
  JobStatusSummary,
  JobStatusSummaryBackendDict,
} from 'domain/admin/job-status-summary.model';
import {
  PlatformParameter,
  PlatformParameterBackendDict
} from 'domain/platform_feature/platform-parameter.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


interface UserRoles {
  [role: string]: string;
}

interface RoleGraphData {
  nodes: {
    [role: string]: string;
  };
  links: {
    target: string;
    source: string;
  }[];
}

interface ConfigProperties {
  [property: string]: Object;
}

interface JobOutput {
  output: string[];
}

export interface AdminPageDataBackendDict {
  'demo_explorations': string[][];
  'demo_collections': string[][];
  'demo_exploration_ids': string[];
  'one_off_job_status_summaries': JobStatusSummaryBackendDict[];
  'human_readable_current_time': string;
  'audit_job_status_summaries': JobStatusSummaryBackendDict[];
  'updatable_roles': UserRoles;
  'role_graph_data': RoleGraphData;
  'config_properties': ConfigProperties;
  'viewable_roles': UserRoles;
  'unfinished_job_data': JobDataBackendDict[];
  'recent_job_data': JobDataBackendDict[];
  'continuous_computations_data': ComputationDataBackendDict[];
  'topic_summaries': TopicSummaryBackendDict[];
  'feature_flags': PlatformParameterBackendDict[];
}

export interface AdminPageData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  oneOffJobStatusSummaries: JobStatusSummary[];
  humanReadableCurrentTime: string;
  auditJobStatusSummaries: JobStatusSummary[];
  updatableRoles: UserRoles;
  roleGraphData: RoleGraphData;
  configProperties: ConfigProperties;
  viewableRoles: UserRoles;
  unfinishedJobData: Job[];
  recentJobData: Job[];
  continuousComputationsData: ComputationData[];
  topicSummaries: TopicSummary[];
  featureFlags: PlatformParameter[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getDataAsync(): Promise<AdminPageData> {
    return new Promise((resolve, reject) => {
      this.http.get<AdminPageDataBackendDict>(
        AdminPageConstants.ADMIN_HANDLER_URL).toPromise().then(response => {
        resolve({
          demoExplorations: response.demo_explorations,
          demoCollections: response.demo_collections,
          demoExplorationIds: response.demo_exploration_ids,
          oneOffJobStatusSummaries: response.one_off_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          humanReadableCurrentTime: response.human_readable_current_time,
          auditJobStatusSummaries: response.audit_job_status_summaries.map(
            JobStatusSummary.createFromBackendDict),
          updatableRoles: response.updatable_roles,
          roleGraphData: response.role_graph_data,
          configProperties: response.config_properties,
          viewableRoles: response.viewable_roles,
          unfinishedJobData: response.unfinished_job_data.map(
            Job.createFromBackendDict),
          recentJobData: response.recent_job_data.map(
            Job.createFromBackendDict),
          continuousComputationsData: response.continuous_computations_data.map(
            ComputationData.createFromBackendDict),
          topicSummaries: response.topic_summaries.map(
            TopicSummary.createFromBackendDict),
          featureFlags: response.feature_flags.map(
            dict => PlatformParameter.createFromBackendDict(
              dict)
          )
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  private _postAdminActionAsync(action:string, payload:Object): Promise<void> {
    return this.http.post<void>(
      AdminPageConstants.ADMIN_HANDLER_URL, { action, ...payload }).toPromise()
      .then(response => {
        return response;
      }, errorResonse => {
        return errorResonse.error.error;
      });
  }

  async startNewJobAsync(jobType: string): Promise<void> {
    let action = 'start_new_job';
    let payload = {
      job_type: jobType
    };
    return this._postAdminActionAsync(action, payload);
  }

  async cancelJobAsync(jobId: string, jobType: string): Promise<void> {
    let action = 'cancel_job';
    let payload = {
      job_id: jobId,
      job_type: jobType
    };
    return this._postAdminActionAsync(action, payload);
  }

  async startComputationAsync(computationType: string): Promise<void> {
    let action = 'start_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postAdminActionAsync(action, payload);
  }

  async stopComputationAsync(computationType: string): Promise<void> {
    let action = 'stop_computation';
    let payload = {
      computation_type: computationType
    };
    return this._postAdminActionAsync(action, payload);
  }

  async fetchJobOutputAsync(jobId: string): Promise<string[]> {
    let adminJobOutputUrl = this.urlInterpolationService.interpolateUrl(
      AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
        jobId: jobId
      });
    return new Promise((resolve, reject) => {
      this.http.get<JobOutput>(
        adminJobOutputUrl).toPromise().then(response => {
        resolve(Array.isArray(response.output) ? response.output.sort() : []);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'AdminBackendApiService',
  downgradeInjectable(AdminBackendApiService));
