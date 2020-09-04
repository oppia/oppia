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
  TopicSummaryBackendDict,
  TopicSummary,
  TopicSummaryObjectFactory
} from 'domain/topic/TopicSummaryObjectFactory';
import {
  ComputationData,
  ComputationDataBackendDict,
  ComputationDataObjectFactory
} from 'domain/admin/computation-data-object.factory';
import {
  Job,
  JobDataBackendDict,
  JobDataObjectFactory
} from 'domain/admin/job-data-object.factory';
import {
  JobStatusSummary,
  JobStatusSummaryBackendDict,
  JobStatusSummaryObjectFactory
} from 'domain/admin/job-status-summary-object.factory';


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
}

@Injectable({
  providedIn: 'root'
})
export class AdminBackendApiService {
  constructor(
    private http: HttpClient,
    private computationDataObjectFactory: ComputationDataObjectFactory,
    private jobDataObjectFactory: JobDataObjectFactory,
    private jobStatusSummaryObjectFactory: JobStatusSummaryObjectFactory,
    private topicSummaryObjectFactory: TopicSummaryObjectFactory) {}

  getData(): Promise<AdminPageData> {
    return new Promise((resolve, reject) => {
      this.http.get<AdminPageDataBackendDict>(
        AdminPageConstants.ADMIN_HANDLER_URL).toPromise().then(response => {
        resolve({
          demoExplorations: response.demo_explorations,
          demoCollections: response.demo_collections,
          demoExplorationIds: response.demo_exploration_ids,
          oneOffJobStatusSummaries: response.one_off_job_status_summaries.map(
            this.jobStatusSummaryObjectFactory.createFromBackendDict),
          humanReadableCurrentTime: response.human_readable_current_time,
          auditJobStatusSummaries: response.audit_job_status_summaries.map(
            this.jobStatusSummaryObjectFactory.createFromBackendDict),
          updatableRoles: response.updatable_roles,
          roleGraphData: response.role_graph_data,
          configProperties: response.config_properties,
          viewableRoles: response.viewable_roles,
          unfinishedJobData: response.unfinished_job_data.map(
            this.jobDataObjectFactory.createFromBackendDict),
          recentJobData: response.recent_job_data.map(
            this.jobDataObjectFactory.createFromBackendDict),
          continuousComputationsData: response.continuous_computations_data.map(
            this.computationDataObjectFactory.createFromBackendDict),
          topicSummaries: response.topic_summaries.map(
            this.topicSummaryObjectFactory.createFromBackendDict)
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'AdminBackendApiService',
  downgradeInjectable(AdminBackendApiService));
