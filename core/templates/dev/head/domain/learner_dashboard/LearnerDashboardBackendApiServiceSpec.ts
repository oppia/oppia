// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerDashboardBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LearnerDashboardBackendApiService } from
  'domain/learner_dashboard/LearnerDashboardBackendApiService.ts';

describe('Learner Dashboard Backend API Service', () => {
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController;

  var sampleDataResults = {
    username: 'test',
    number_of_unread_threads: 0,
    completed_to_incomplete_collections: [],
    is_admin: false,
    profile_picture_data_url: 'TestURL',
    exploration_playlist: [],
    user_email: 'test@example.com',
    collection_playlist: [],
    is_moderator: false,
    number_of_nonexistent_activities: {
      completed_collections: 0,
      incomplete_collections: 0,
      collection_playlist: 0,
      incomplete_explorations: 0,
      exploration_playlist: 0,
      completed_explorations: 0
    },
    incomplete_collections_list: [],
    thread_summaries: [],
    incomplete_explorations_list: [],
    subscription_list: [],
    completed_explorations_list: [],
    is_super_admin: false,
    completed_collections_list: []
  };

  var LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerDashboardBackendApiService]
    });
    learnerDashboardBackendApiService = TestBed.get(
      LearnerDashboardBackendApiService);

    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch learner dashboard data from the backend',
    () => {
      learnerDashboardBackendApiService.fetchLearnerDashboardData()
        .then((data) => {
          expect(data).toEqual(sampleDataResults);
        }, (error) => {
          expect(error).toBeNull();
        });

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
    }
  );

  it(
    'should use rejection handler if learner dashboard data ' +
    'backend request failed',
    () => {
      learnerDashboardBackendApiService.fetchLearnerDashboardData()
        .then((data) => {
          expect(data).toBeNull();
        }, (error) => {
          expect(error.error).toBe('Error loading dashboard data.');
        });

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading dashboard data.', {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });
    });
});
