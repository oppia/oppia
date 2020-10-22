// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminDataService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AdminDataService } from
  'pages/admin-page/services/admin-data.service';
import { AdminPageData } from
  'domain/admin/admin-backend-api.service';
import { ComputationData } from 'domain/admin/computation-data.model';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { Job } from 'domain/admin/job.model';
import { PlatformParameterFilterType } from 'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { TopicSummary } from 'domain/topic/topic-summary.model';


describe('Admin Data Service', () => {
  let adminDataService: AdminDataService = null;
  let httpTestingController: HttpTestingController;
  var sampleAdminData = {
    unfinished_job_data: [],
    role_graph_data: {
      links: [
        {
          source: 'TOPIC_MANAGER',
          target: 'MODERATOR'
        }
      ],
      nodes: {
        TOPIC_MANAGER: 'topic manager'
      }
    },
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
        language_code: 'en',
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA'
      }
    ],
    one_off_job_status_summaries: [],
    updatable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    human_readable_current_time: 'June 03 15:31:20',
    audit_job_status_summaries: [],
    demo_collections: [],
    config_properties: {
      oppia_csrf_secret: {
        schema: {
          type: 'unicode'
        },
        value: '3WHOWnD3sy0r1wukJ2lX4vBS_YA=',
        description: 'Text used to encrypt CSRF tokens.'
      }
    },
    demo_exploration_ids: ['19'],
    recent_job_data: [],
    demo_explorations: [
      [
        '0',
        'welcome.yaml'
      ]
    ],
    continuous_computations_data: [
      {
        is_startable: true,
        status_code: 'never_started',
        computation_type: 'FeedbackAnalyticsAggregator',
        last_started_msec: null,
        active_realtime_layer_index: null,
        last_stopped_msec: null,
        is_stoppable: false,
        last_finished_msec: null
      }
    ],
    viewable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    feature_flags: [{
      name: 'dummy_feature',
      description: 'this is a dummy feature',
      data_type: 'bool',
      rules: [{
        filters: [{
          type: PlatformParameterFilterType.ServerMode,
          conditions: [<[string, string]>['=', 'dev']]
        }],
        value_when_matched: true
      }],
      rule_schema_version: 1,
      default_value: false,
      is_feature: true,
      feature_stage: FeatureStage.DEV
    }]
  };
  let adminDataResponse: AdminPageData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminDataService]
    });
    adminDataService = TestBed.get(AdminDataService);
    httpTestingController = TestBed.get(HttpTestingController);
    adminDataResponse = {
      demoExplorations: sampleAdminData.demo_explorations,
      demoCollections: sampleAdminData.demo_collections,
      demoExplorationIds: sampleAdminData.demo_exploration_ids,
      oneOffJobStatusSummaries:
        sampleAdminData.one_off_job_status_summaries.map(
          JobStatusSummary.createFromBackendDict),
      humanReadableCurrentTime:
      sampleAdminData.human_readable_current_time,
      auditJobStatusSummaries:
        sampleAdminData.audit_job_status_summaries.map(
          JobStatusSummary.createFromBackendDict),
      updatableRoles: sampleAdminData.updatable_roles,
      roleGraphData: sampleAdminData.role_graph_data,
      configProperties: sampleAdminData.config_properties,
      viewableRoles: sampleAdminData.viewable_roles,
      unfinishedJobData: sampleAdminData.unfinished_job_data.map(
        Job.createFromBackendDict),
      recentJobData: sampleAdminData.recent_job_data.map(
        Job.createFromBackendDict),
      continuousComputationsData:
        sampleAdminData.continuous_computations_data.map(
          ComputationData.createFromBackendDict),
      topicSummaries: sampleAdminData.topic_summaries.map(
        TopicSummary.createFromBackendDict),
      featureFlags: sampleAdminData.feature_flags.map(
        dict => PlatformParameter.createFromBackendDict(dict))
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return the correct admin data', fakeAsync(() => {
    adminDataService.getDataAsync().then(function(response) {
      expect(response).toEqual(adminDataResponse);
    });

    var req = httpTestingController.expectOne(
      '/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleAdminData);

    flushMicrotasks();
  }));

  it('should cache the response and not make a second request',
    fakeAsync(() => {
      adminDataService.getDataAsync();

      var req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleAdminData);

      flushMicrotasks();

      adminDataService.getDataAsync().then(function(response) {
        expect(response).toEqual(adminDataResponse);
      });

      httpTestingController.expectNone('/adminhandler');
    })
  );
});
