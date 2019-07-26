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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { CreatorDashboardBackendApiService } from
  'domain/creator_dashboard/CreatorDashboardBackendApiService.ts';

describe('Creator Dashboard backend API service', () => {
  let creatorDashboardBackendApiService:
    CreatorDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController;
  var SAMPLE_EXP_ID = 'hyuy4GUlvTqJ';

  var sampleDataResults = {
    explorations_list: [{
      id: SAMPLE_EXP_ID,
      title: 'Sample Title',
      activity_type: 'exploration',
      category: 'Computing',
      objective: 'Sample objective',
      language_code: 'en',
      created_on_msec: 1466178691847.67,
      last_updated_msec: 1466178759209.839,
      status: 'public',
      rating: {
        5: 0,
        4: 1,
        3: 0,
        2: 0,
        1: 0
      },
      community_owned: false,
      tags: '',
      thumbnail_icon_url: '/subjects/Computing.svg',
      thumbnail_bg_color: '#bb8b2f',
      num_views: 2,
      num_open_threads: 0,
      num_total_threads: 0
    }],
    collections_list: [],
    dashboard_stats: {
      total_plays: 10,
      num_ratings: 1,
      average_ratings: 4.0,
      total_open_feedback: 5
    },
    last_week_stats: {
      total_plays: 2,
      average_ratings: 3.5,
      num_ratings: 3,
      total_open_feedback: 1
    }
  };

  var CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CreatorDashboardBackendApiService]
    });
    creatorDashboardBackendApiService = TestBed.get(
      CreatorDashboardBackendApiService);

    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an creator dashboard data from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      creatorDashboardBackendApiService.fetchDashboardData()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(CREATOR_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use rejection handler if dashboard data backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      creatorDashboardBackendApiService.fetchDashboardData()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(CREATOR_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading dashboard data.', {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
