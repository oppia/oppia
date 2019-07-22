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
 * @fileoverview Unit tests for LearnerDashboardIdsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LearnerDashboardIdsBackendApiService } from
  'domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts';

describe('Learner Dashboard Backend API Service', () => {
  var learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService = null;
  let httpTestingController: HttpTestingController;

  var sampleDataResults = {
    username: 'test',
    profile_picture_data_url: 'TestURL',
    learner_dashboard_activity_ids: {
      completed_exploration_ids: [],
      exploration_playlist_ids: [],
      completed_collection_ids: [],
      incomplete_exploration_ids: [],
      collection_playlist_ids: [],
      incomplete_collection_ids: []
    },
    user_email: 'test@example.com',
    is_admin: false,
    is_super_admin: false,
    is_moderator: false
  };

  var LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerDashboardIdsBackendApiService]
    });
    learnerDashboardIdsBackendApiService = TestBed.get(
      LearnerDashboardIdsBackendApiService);

    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch learner dashboard IDs data from the backend',
    () => {
      learnerDashboardIdsBackendApiService.fetchLearnerDashboardIds()
        .then((data) => {
          expect(data).toEqual(sampleDataResults);
        }, (error) => {
          expect(error).toBeNull();
        });

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_IDS_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
    }
  );

  it(
    'should use rejection handler if learner dashboard IDs' +
    ' data backend request failed',
    () => {
      learnerDashboardIdsBackendApiService.fetchLearnerDashboardIds()
        .then((data) => {
          expect(data).toBeNull();
        }, (error) => {
          expect(error.error).toBe('Error loading dashboard IDs data.');
        });

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_IDS_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading dashboard IDs data.', {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });
    });
});
