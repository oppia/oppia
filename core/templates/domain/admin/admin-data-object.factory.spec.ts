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
 * @fileoverview Unit tests for AdminDataObjectFactory.ts.
 */

import { AdminDataObjectFactory } from
  'domain/admin/admin-data-object.factory';
import { ComputationDataObjectFactory } from
  'domain/admin/computation-data-object.factory';
import { JobDataObjectFactory } from
  'domain/admin/job-data-object.factory';
import { JobStausSummaryObjectFactory } from
  'domain/admin/job-status-summary-object.factory';
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Admin Data Object Factory', () => {
  let adof: AdminDataObjectFactory;
  let cdof: ComputationDataObjectFactory;
  let jdof: JobDataObjectFactory;
  let jsof: JobStausSummaryObjectFactory;
  let tsof: TopicSummaryObjectFactory;

  beforeEach(() => {
    cdof = new ComputationDataObjectFactory();
    jdof = new JobDataObjectFactory();
    jsof = new JobStausSummaryObjectFactory();
    tsof = new TopicSummaryObjectFactory();

    adof = new AdminDataObjectFactory(
      new ComputationDataObjectFactory(), new JobDataObjectFactory(),
      new JobStausSummaryObjectFactory(), new TopicSummaryObjectFactory());
  });

  it('should corrrectly convert backend dict to AdminData Object.', () => {
    let backendDict = {
      continuous_computations_data: [
        {
          is_stoppable: false,
          is_startable: true,
          active_realtime_layer_index: null,
          computation_type: 'FeedbackAnalyticsAggregator',
          status_code: 'never_started',
          last_started_msec: null,
          last_finished_msec: null,
          last_stopped_msec: null
        }
      ],
      config_properties: {},
      topic_summaries: [
        {
          topic_model_created_on: 1591196558882.194,
          uncategorized_skill_count: 0,
          name: 'Empty Topic',
          additional_story_count: 0,
          total_skill_count: 0,
          version: 1,
          canonical_story_count: 0,
          subtopic_count: 0,
          description: '',
          id: 'VqgPTpt7JyJy',
          topic_model_last_updated: 1591196558882.2,
          language_code: 'en'
        }
      ],
      audit_job_status_summaries: [
        {
          is_queued_or_running: false,
          job_type: 'ActivityReferencesModelAuditOneOffJob'
        }
      ],
      viewable_roles: {
        COLLECTION_EDITOR: 'collection editor'
      },
      unfinished_job_data: [
        {
          human_readable_time_started: 'June 04 12:17:36',
          time_started_msec: 1591273056433.883,
          job_type: 'ActivityContributorsSummaryOneOffJob',
          status_code: 'started',
          is_cancelable: true,
          can_be_canceled: true,
          id: 'ActivityContributorsSummaryOneOffJob-1591273056261-695',
          human_readable_time_finished: '',
          time_finished_msec: null,
          error: null
        }
      ],
      updatable_roles: {
        COLLECTION_EDITOR: 'collection editor'
      },
      demo_explorations: [
        [
          '0',
          'welcome.yaml'
        ]
      ],
      human_readable_current_time: 'June 04 12:18:03',
      demo_exploration_ids: [
        '17'
      ],
      one_off_job_status_summaries: [
        {
          is_queued_or_running: true,
          job_type: 'ActivityContributorsSummaryOneOffJob'
        }
      ],
      demo_collections: [
        [
          '0',
          'welcome_to_collections.yaml'
        ]
      ],
      role_graph_data: {
        links: [
          {
            target: 'COLLECTION_EDITOR',
            source: 'EXPLORATION_EDITOR'
          }
        ],
        nodes: {
          COLLECTION_EDITOR: 'collection editor'
        }
      },
      recent_job_data: [
        {
          human_readable_time_started: 'June 04 12:17:36',
          time_started_msec: 1591273056433.883,
          job_type: 'ActivityContributorsSummaryOneOffJob',
          status_code: 'started',
          is_cancelable: true,
          id: 'ActivityContributorsSummaryOneOffJob-1591273056261-695',
          human_readable_time_finished: '',
          time_finished_msec: null,
          error: null
        }
      ]
    };

    let adminDataObject = adof.createFromBackendDict(backendDict);
    let computationDataObjects = backendDict.continuous_computations_data.map(
      cdof.createFromBackendDict);
    let topicSummaryObjects = backendDict.topic_summaries.map(
      tsof.createFromBackendDict);
    let auditJobObjects = backendDict.audit_job_status_summaries.map(
      jsof.createFromBackendDict);
    let unifinishedDataObjects = backendDict.unfinished_job_data.map(
      jdof.createFromBackendDict);
    let oneOffSpecObjects = backendDict.one_off_job_status_summaries.map(
      jsof.createFromBackendDict);
    let recentJobDataObjects = backendDict.recent_job_data.map(
      jdof.createFromBackendDict);

    expect(adminDataObject.continuousComputationsData).toEqual(
      computationDataObjects);
    expect(adminDataObject.configProperties).toEqual({});
    expect(adminDataObject.topicSummaries).toEqual(topicSummaryObjects);
    expect(adminDataObject.auditJobStatusSummaries).toEqual(auditJobObjects);
    expect(adminDataObject.viewableRoles).toEqual({
      COLLECTION_EDITOR: 'collection editor'
    });
    expect(adminDataObject.unfinishedJobData).toEqual(unifinishedDataObjects);
    expect(adminDataObject.updatableRoles).toEqual({
      COLLECTION_EDITOR: 'collection editor'
    });
    expect(adminDataObject.demoExplorations).toEqual([[
      '0',
      'welcome.yaml'
    ]]);
    expect(adminDataObject.humanReadableCurrentTime).toEqual(
      'June 04 12:18:03');
    expect(adminDataObject.demoExplorationIds).toEqual(['17']);
    expect(adminDataObject.oneOffJobStatusSummaries).toEqual(oneOffSpecObjects);
    expect(adminDataObject.demoCollections).toEqual([[
      '0',
      'welcome_to_collections.yaml'
    ]]);
    expect(adminDataObject.roleGraphData).toEqual({
      links: [
        {
          target: 'COLLECTION_EDITOR',
          source: 'EXPLORATION_EDITOR'
        }
      ],
      nodes: {
        COLLECTION_EDITOR: 'collection editor'
      }
    });
    expect(adminDataObject.recentJobData).toEqual(recentJobDataObjects);
  });
});
