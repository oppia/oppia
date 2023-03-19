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
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerDashboardIdsBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';

describe('Learner Dashboard Backend API Service', () => {
  var learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService;
  let httpTestingController: HttpTestingController;

  var sampleDataResults = {
    username: 'test',
    learner_dashboard_activity_ids: {
      completed_exploration_ids: [],
      exploration_playlist_ids: [],
      completed_collection_ids: [],
      incomplete_exploration_ids: [],
      completed_story_ids: [],
      learnt_topic_ids: [],
      partially_learnt_topic_ids: [],
      topic_ids_to_learn: [],
      all_topic_ids: [],
      untracked_topic_ids: [],
      collection_playlist_ids: [],
      incomplete_collection_ids: []
    },
    user_email: 'test@example.com',
    is_curriculum_admin: false,
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
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      learnerDashboardIdsBackendApiService.fetchLearnerDashboardIdsAsync()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_IDS_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        LearnerDashboardActivityIds.createFromBackendDict(
          sampleDataResults.learner_dashboard_activity_ids));
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it(
    'should use rejection handler if learner dashboard IDs' +
    ' data backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      learnerDashboardIdsBackendApiService.fetchLearnerDashboardIdsAsync()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_IDS_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading dashboard IDs data.'
      }, {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading dashboard IDs data.');
    }));
});
