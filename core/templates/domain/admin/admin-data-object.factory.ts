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
 * @fileoverview Frontend domain object factory for admin data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

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
  JobStausSummaryObjectFactory
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

export interface IAdminDataBackendDict {
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

export class AdminData {
  demoExplorations: string[][];
  demoCollections: string[][];
  demoExplorationIds: string[];
  oneOffJobStatusSummaries: JobStatusSummary[];
  humanReadableCurrentTime: string;
  auditJobStatusSummaries: JobStatusSummary[];
  updatableRoles: IUserRoles;
  roleGraphData: IRoleGraphData;
  viewableRoles: IUserRoles;
  unfinishedJobData: Job[];
  recentJobData: Job[];
  continuousComputationsData: ComputationData[];
  topicSummaries: TopicSummary[];
  configProperties: IConfigProperties;

  constructor(
      demoExplorations: string[][], demoCollections: string[][],
      demoExplorationIds: string[],
      oneOffJobStatusSummaries: JobStatusSummary[],
      humanReadableCurrentTime: string,
      auditJobStatusSummaries: JobStatusSummary[],
      updatableRoles: IUserRoles, roleGraphData: IRoleGraphData,
      viewableRoles: IUserRoles, unfinishedJobData: Job[],
      recentJobData: Job[], continuousComputationsData: ComputationData[],
      topicSummaries: TopicSummary[], configProperties: IConfigProperties) {
    this.demoExplorations = demoExplorations;
    this.demoCollections = demoCollections;
    this.demoExplorationIds = demoExplorationIds;
    this.oneOffJobStatusSummaries = oneOffJobStatusSummaries;
    this.humanReadableCurrentTime = humanReadableCurrentTime;
    this.auditJobStatusSummaries = auditJobStatusSummaries;
    this.updatableRoles = updatableRoles;
    this.roleGraphData = roleGraphData;
    this.viewableRoles = viewableRoles;
    this.unfinishedJobData = unfinishedJobData;
    this.recentJobData = recentJobData;
    this.continuousComputationsData = continuousComputationsData;
    this.topicSummaries = topicSummaries;
    this.configProperties = configProperties;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataObjectFactory {
  constructor(
    private computationDataObjectFactory: ComputationDataObjectFactory,
    private jobDataObjectFactory: JobDataObjectFactory,
    private jobSpecObjectFactory: JobStausSummaryObjectFactory,
    private topicSummaryObjectFactory: TopicSummaryObjectFactory) {}

  createFromBackendDict(backendDict: IAdminDataBackendDict): AdminData {
    let oneOffSpecsObject = backendDict.one_off_job_status_summaries.map((
        jobSpecDict) => {
      return this.jobSpecObjectFactory.createFromBackendDict(jobSpecDict);
    });
    let auditJobSpecsObject = backendDict.audit_job_status_summaries.map((
        auditJobSpec) => {
      return this.jobSpecObjectFactory.createFromBackendDict(auditJobSpec);
    });
    let unfinishedJobDataObjects = backendDict.unfinished_job_data.map((
        unfinishedJobData) => {
      return this.jobDataObjectFactory.createFromBackendDict(
        unfinishedJobData);
    });
    let recentJobDataObjects = backendDict.recent_job_data.map((
        recentJobData) => {
      return this.jobDataObjectFactory.createFromBackendDict(recentJobData);
    });
    let computationDataObjects = backendDict.continuous_computations_data.map((
        computationData) => {
      return this.computationDataObjectFactory.createFromBackendDict(
        computationData);
    });
    let topicSummaryObjects = backendDict.topic_summaries.map((
        topicSummary) => {
      return this.topicSummaryObjectFactory.createFromBackendDict(
        topicSummary);
    });

    return new AdminData(
      backendDict.demo_explorations, backendDict.demo_collections,
      backendDict.demo_exploration_ids, oneOffSpecsObject,
      backendDict.human_readable_current_time, auditJobSpecsObject,
      backendDict.updatable_roles, backendDict.role_graph_data,
      backendDict.viewable_roles, unfinishedJobDataObjects,
      recentJobDataObjects, computationDataObjects, topicSummaryObjects,
      backendDict.config_properties);
  }
}

angular.module('oppia').factory(
  'AdminDataObjectFactory',
  downgradeInjectable(AdminDataObjectFactory));
