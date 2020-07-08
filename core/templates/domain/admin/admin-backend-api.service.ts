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
  ITopicSummaryBackendDict,
  TopicSummary,
  TopicSummaryObjectFactory
} from 'domain/topic/TopicSummaryObjectFactory';
import {
  IComputationDataBackendDict,
  ComputationData,
  ComputationDataObjectFactory
} from 'domain/admin/computation-data-object.factory';
import {
  IJobDataBackendDict,
  Job,
  JobDataObjectFactory
} from 'domain/admin/job-data-object.factory';
import {
  IJobStatusSummaryBackendDict,
  JobStatusSummary,
  JobStatusSummaryObjectFactory
} from 'domain/admin/job-status-summary-object.factory';


interface IUserRoles {
  [role: string]: string;
}

interface IRoleGraphData {
  nodes: {
    [role: string]: string;
  };
  links: {
    target: string;
    source: string;
  }[];
}

interface IConfigProperties {
  [property: string]: Object;
}

export interface IAdminPageDataBackendDict {
  'demo_explorations': string[][];
  'demo_collections': string[][];
  'demo_exploration_ids': string[];
  'one_off_job_status_summaries': IJobStatusSummaryBackendDict[];
  'human_readable_current_time': string;
  'audit_job_status_summaries': IJobStatusSummaryBackendDict[];
  'updatable_roles': IUserRoles;
  'role_graph_data': IRoleGraphData;
  'config_properties': IConfigProperties;
  'viewable_roles': IUserRoles;
  'unfinished_job_data': IJobDataBackendDict[];
  'recent_job_data': IJobDataBackendDict[];
  'continuous_computations_data': IComputationDataBackendDict[];
  'topic_summaries': ITopicSummaryBackendDict[];
}

export interface AdminPageData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  oneOffJobStatusSummaries: JobStatusSummary[];
  humanReadableCurrentTime: string;
  auditJobStatusSummaries: JobStatusSummary[];
  updatableRoles: IUserRoles;
  roleGraphData: IRoleGraphData;
  configProperties: IConfigProperties;
  viewableRoles: IUserRoles;
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
    return this.http.get<IAdminPageDataBackendDict>(
      AdminPageConstants.ADMIN_HANDLER_URL).toPromise().then(response => {
      return {
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
      };
    });
  }
}

angular.module('oppia').factory(
  'AdminBackendApiService',
  downgradeInjectable(AdminBackendApiService));
