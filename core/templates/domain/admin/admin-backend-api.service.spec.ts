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
 * @fileoverview Unit tests for AdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AdminPageData, AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { ComputationData } from 'domain/admin/computation-data.model';
import { Job } from 'domain/admin/job.model';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { TopicSummary } from 'domain/topic/topic-summary.model';
import { PlatformParameterFilterType } from 'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Admin backend api service', () => {
  let abas: AdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let adminBackendResponse = {
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
  let adminDataObject: AdminPageData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    abas = TestBed.get(AdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    adminDataObject = {
      demoExplorations: adminBackendResponse.demo_explorations,
      demoCollections: adminBackendResponse.demo_collections,
      demoExplorationIds: adminBackendResponse.demo_exploration_ids,
      oneOffJobStatusSummaries:
        adminBackendResponse.one_off_job_status_summaries.map(
          JobStatusSummary.createFromBackendDict),
      humanReadableCurrentTime:
        adminBackendResponse.human_readable_current_time,
      auditJobStatusSummaries:
        adminBackendResponse.audit_job_status_summaries.map(
          JobStatusSummary.createFromBackendDict),
      updatableRoles: adminBackendResponse.updatable_roles,
      roleGraphData: adminBackendResponse.role_graph_data,
      configProperties: adminBackendResponse.config_properties,
      viewableRoles: adminBackendResponse.viewable_roles,
      unfinishedJobData: adminBackendResponse.unfinished_job_data.map(
        Job.createFromBackendDict),
      recentJobData: adminBackendResponse.recent_job_data.map(
        Job.createFromBackendDict),
      continuousComputationsData:
        adminBackendResponse.continuous_computations_data.map(
          ComputationData.createFromBackendDict),
      topicSummaries: adminBackendResponse.topic_summaries.map(
        TopicSummary.createFromBackendDict),
      featureFlags: adminBackendResponse.feature_flags.map(
        dict => PlatformParameter.createFromBackendDict(dict)
      )
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the data.', fakeAsync(() => {
    abas.getDataAsync().then((adminData) => {
      expect(adminData).toEqual(adminDataObject);
    });

    let req = httpTestingController.expectOne(
      '/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(adminBackendResponse);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      abas.getDataAsync().then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );
});

describe('Admin Backend API service for Misc Tab', () => {
  let adminBackendApiService: AdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminBackendApiService]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    adminBackendApiService = TestBed.get(AdminBackendApiService);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
  it('should flush the memory cache',
    fakeAsync(() => {
      adminBackendApiService.flushCache()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/memorycacheadminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should clear search index',
    fakeAsync(() => {
      adminBackendApiService.clearSearchIndex()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should not regenerate topic related oppurtunities if id is incorrect',
    fakeAsync(() => {
      let topicId = 'topic_1';
      let errorMessage = 'Server error: Entity for class TopicModel with id ' +
       topicId + ' not found';
      adminBackendApiService.regenerateTopicRelatedOpportunities(
        topicId
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(
        { error: errorMessage },
        { status: 500, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
    ));
  it('should upload topic similarities',
    fakeAsync(() => {
      let data = 'topic_similarities.csv';
      adminBackendApiService.uploadTopicSimilarities(data)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/adminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
  it('should send dummy mail to admin',
    fakeAsync(() => {
      let errorMessage = 'Server error: This app cannot send emails.';
      adminBackendApiService.sendDummyMail()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/senddummymailtoadminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(
        { error: errorMessage },
        { status: 400, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
    ));

  it('should get data of memory cache profile',
    fakeAsync(() => {
      adminBackendApiService.getMemoryCacheProfile()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/memorycacheadminhandler');
      expect(req.request.method).toEqual('GET');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should fail tp get data of memory cache profile',
    fakeAsync(() => {
      let errorMessage = 'Internal Server Error';
      adminBackendApiService.getMemoryCacheProfile()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/memorycacheadminhandler');
      expect(req.request.method).toEqual('POST');
      req.flush(
        { error: errorMessage },
        { status: 500, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
    ));

  it('should update the username of oppia account',
    fakeAsync(() => {
      let oldUsername = 'old name';
      let newUsername = 'new name';
      adminBackendApiService.updateUserName(oldUsername, newUsername)
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/updateusernamehandler');
      expect(req.request.method).toEqual('PUT');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should get the data of number of pending delete requests',
    fakeAsync(() => {
      adminBackendApiService.numberOfPendingDeletionRequest()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/numberofdeletionrequestshandler');
      expect(req.request.method).toEqual('GET');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
});
