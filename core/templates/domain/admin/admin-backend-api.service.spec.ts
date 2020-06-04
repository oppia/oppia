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

import { AdminBackendApiService } from
  'domain/admin/admin-backend-api.service';
import { AdminDataObjectFactory, AdminData } from
  'domain/admin/AdminDataObjectFactory';

describe('Admin backend api service', () => {
  let abas: AdminBackendApiService;
  let adof: AdminDataObjectFactory;
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
        language_code: 'en'
      }
    ],
    one_off_job_specs: [],
    updatable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    human_readable_current_time: 'June 03 15:31:20',
    audit_job_specs: [],
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
    }
  };
  let adminDataObject: AdminData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    abas = TestBed.get(AdminBackendApiService);
    adof = TestBed.get(AdminDataObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    adminDataObject = adof.createFromBackendDict(adminBackendResponse);
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
});
