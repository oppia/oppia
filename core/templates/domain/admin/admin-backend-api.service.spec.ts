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

import { AdminPageData, AdminBackendApiService } from
  'domain/admin/admin-backend-api.service';
import { ComputationDataObjectFactory } from
  'domain/admin/computation-data-object.factory';
import { JobDataObjectFactory } from
  'domain/admin/job-data-object.factory';
import { JobStatusSummaryObjectFactory } from
  'domain/admin/job-status-summary-object.factory';
import { PlatformParameterFilterType } from
  'domain/platform_feature/platform-parameter-filter-object.factory';
import { FeatureStage, PlatformParameterObjectFactory } from
  'domain/platform_feature/platform-parameter-object.factory';
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Admin backend api service', () => {
  let abas: AdminBackendApiService;
  let cdof: ComputationDataObjectFactory;
  let jdof: JobDataObjectFactory;
  let jsof: JobStatusSummaryObjectFactory;
  let ppof: PlatformParameterObjectFactory;
  let tsof: TopicSummaryObjectFactory;
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
    cdof = TestBed.get(ComputationDataObjectFactory);
    jdof = TestBed.get(JobDataObjectFactory);
    jsof = TestBed.get(JobStatusSummaryObjectFactory);
    ppof = TestBed.get(PlatformParameterObjectFactory);
    tsof = TestBed.get(TopicSummaryObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    adminDataObject = {
      demoExplorations: adminBackendResponse.demo_explorations,
      demoCollections: adminBackendResponse.demo_collections,
      demoExplorationIds: adminBackendResponse.demo_exploration_ids,
      oneOffJobStatusSummaries:
        adminBackendResponse.one_off_job_status_summaries.map(
          jsof.createFromBackendDict),
      humanReadableCurrentTime:
        adminBackendResponse.human_readable_current_time,
      auditJobStatusSummaries:
        adminBackendResponse.audit_job_status_summaries.map(
          jsof.createFromBackendDict),
      updatableRoles: adminBackendResponse.updatable_roles,
      roleGraphData: adminBackendResponse.role_graph_data,
      configProperties: adminBackendResponse.config_properties,
      viewableRoles: adminBackendResponse.viewable_roles,
      unfinishedJobData: adminBackendResponse.unfinished_job_data.map(
        jdof.createFromBackendDict),
      recentJobData: adminBackendResponse.recent_job_data.map(
        jdof.createFromBackendDict),
      continuousComputationsData:
        adminBackendResponse.continuous_computations_data.map(
          cdof.createFromBackendDict),
      topicSummaries: adminBackendResponse.topic_summaries.map(
        tsof.createFromBackendDict),
      featureFlags: adminBackendResponse.feature_flags.map(
        dict => ppof.createFromBackendDict(dict)
      )
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the data.', fakeAsync(() => {
    abas.getData().then((adminData) => {
      expect(adminData).toEqual(adminDataObject);
    });

    let req = httpTestingController.expectOne(
      '/adminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(adminBackendResponse);

    flushMicrotasks();
  }));

  it('should send SVGs to the backend.', fakeAsync(() => {
    var successResponse = {
      result: 'successfully updated'
    };
    var latexToSvgMapping = {
      exp_id1: {
        latex_string1: {
          file: new Blob(),
          dimensions: {
            encoded_height_string: '4d456',
            encoded_width_string: '3d467',
            encoded_vertical_padding_string: '0d234'
          },
          latexId: '3rmYki9MyZ'
        }
      },
      exp_id2: {
        latex_string2: {
          file: new Blob(),
          dimensions: {
            encoded_height_string: '3d456',
            encoded_width_string: '5d467',
            encoded_vertical_padding_string: '0d234'
          },
          latexId: '4rm6ki9MsZ'
        }
      }
    };
    var expectedPayload = {
      latexMapping: {
        exp_id1: {
          latex_string1: {
            dimensions: {
              encoded_height_string: '4d456',
              encoded_width_string: '3d467',
              encoded_vertical_padding_string: '0d234'
            },
            latexId: '3rmYki9MyZ'
          }
        },
        exp_id2: {
          latex_string2: {
            dimensions: {
              encoded_height_string: '3d456',
              encoded_width_string: '5d467',
              encoded_vertical_padding_string: '0d234'
            },
            latexId: '4rm6ki9MsZ'
          }
        }
      }
    };

    abas.sendMathSvgsToBackend(latexToSvgMapping);
    let req = httpTestingController.expectOne(
      '/explorationslatexsvghandler');
    var requestBody = req.request.body;
    expect(requestBody instanceof FormData).toBeTruthy();
    var rawImageSentToBackend = null;
    var image1 = requestBody.get('3rmYki9MyZ');
    var image2 = requestBody.get('4rm6ki9MsZ');
    var payLoadSentoBackend = requestBody.get('payload');
    expect(image1 instanceof File).toBeTruthy();
    expect(image2 instanceof File).toBeTruthy();
    expect(payLoadSentoBackend).toEqual(JSON.stringify(expectedPayload));
    expect(req.request.method).toEqual('POST');
    req.flush(successResponse);
    flushMicrotasks();
  }));

  it('should send suggestion SVGs to the backend.', fakeAsync(() => {
    var successResponse = {
      result: 'successfully updated'
    };
    var suggestionLatexToSvgMapping = {
      suggestionId1: {
        latex_string1: {
          file: new Blob(),
          dimensions: {
            encoded_height_string: '4d456',
            encoded_width_string: '3d467',
            encoded_vertical_padding_string: '0d234'
          },
          latexId: '3rmYki9MyZ'
        }
      },
      suggestionId2: {
        latex_string2: {
          file: new Blob(),
          dimensions: {
            encoded_height_string: '3d456',
            encoded_width_string: '5d467',
            encoded_vertical_padding_string: '0d234'
          },
          latexId: '4rm6ki9MsZ'
        }
      }
    };
    var expectedPayload = {
      latexMapping: {
        suggestionId1: {
          latex_string1: {
            dimensions: {
              encoded_height_string: '4d456',
              encoded_width_string: '3d467',
              encoded_vertical_padding_string: '0d234'
            },
            latexId: '3rmYki9MyZ'
          }
        },
        suggestionId2: {
          latex_string2: {
            dimensions: {
              encoded_height_string: '3d456',
              encoded_width_string: '5d467',
              encoded_vertical_padding_string: '0d234'
            },
            latexId: '4rm6ki9MsZ'
          }
        }
      }
    };

    abas.sendSuggestionMathSvgsToBackend(suggestionLatexToSvgMapping);
    let req = httpTestingController.expectOne(
      '/suggestionslatexsvghandler');
    var requestBody = req.request.body;
    expect(requestBody instanceof FormData).toBeTruthy();
    var rawImageSentToBackend = null;
    var image1 = requestBody.get('3rmYki9MyZ');
    var image2 = requestBody.get('4rm6ki9MsZ');
    var payLoadSentoBackend = requestBody.get('payload');
    expect(image1 instanceof File).toBeTruthy();
    expect(image2 instanceof File).toBeTruthy();
    expect(payLoadSentoBackend).toEqual(JSON.stringify(expectedPayload));
    expect(req.request.method).toEqual('POST');
    req.flush(successResponse);
    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      abas.getData().then(successHandler, failHandler);

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
