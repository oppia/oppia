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
import { AdminPageData, AdminPageDataBackendDict } from
  'domain/admin/admin-backend-api.service';
import { PlatformParameterFilterType } from 'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from 'domain/platform_feature/platform-parameter.model';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';


describe('Admin Data Service', () => {
  let adminDataService: AdminDataService = null;
  let httpTestingController: HttpTestingController;
  var sampleAdminData: AdminPageDataBackendDict = {
    role_to_actions: {
      guest: ['action for guest']
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
        thumbnail_bg_color: '#C6DCDA',
        total_published_node_count: 10,
        url_fragment: 'topicurlfrag'
      }
    ],
    updatable_roles: {
      TOPIC_MANAGER: 'topic manager'
    },
    human_readable_current_time: 'June 03 15:31:20',
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
    demo_explorations: [
      [
        '0',
        'welcome.yaml'
      ]
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
      updatableRoles: sampleAdminData.updatable_roles,
      roleToActions: sampleAdminData.role_to_actions,
      configProperties: sampleAdminData.config_properties,
      viewableRoles: sampleAdminData.viewable_roles,
      topicSummaries: sampleAdminData.topic_summaries.map(
        CreatorTopicSummary.createFromBackendDict),
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
