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
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerDashboardBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-backend-api.service';

describe('Learner Dashboard Backend API Service', () => {
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController;

  var sampleDataResults = {
    incomplete_explorations_list: [{
      category: 'Arithmetic',
      created_on_msec: 1515553584276.8,
      community_owned: false,
      thumbnail_bg_color: '#d68453',
      title: 'Equality of Fractions (Recap)',
      num_views: 760,
      tags: [
        'recap',
        'fractions',
        'mixed numbers',
        'improper fractions',
        'equivalent fractions',
        'fractions of a group'
      ],
      last_updated_msec: 1593864269236.194,
      human_readable_contributors_summary: {},
      status: 'public',
      language_code: 'en',
      objective: 'Practice the skills from lessons 1-7.',
      thumbnail_icon_url: '/subjects/Arithmetic.svg',
      ratings: {
        1: 0,
        2: 1,
        3: 0,
        4: 0,
        5: 5
      },
      id: '-tMgcP1i_4au',
      activity_type: 'exploration'
    }],
    exploration_playlist: [{
      category: 'Welcome',
      created_on_msec: 1564183471833.675,
      community_owned: true,
      thumbnail_bg_color: '#992a2b',
      title: 'Welcome to Oppia!',
      num_views: 14897,
      tags: [],
      last_updated_msec: 1571653541705.924,
      human_readable_contributors_summary: {},
      status: 'public',
      language_code: 'en',
      objective: "become familiar with Oppia's capabilities",
      thumbnail_icon_url: '/subjects/Welcome.svg',
      ratings: {
        1: 1,
        2: 1,
        3: 3,
        4: 24,
        5: 46
      },
      id: '0',
      activity_type: 'exploration'
    }],
    number_of_unread_threads: 0,
    thread_summaries: [
      {
        status: 'open',
        author_second_last_message: null,
        exploration_id: 'JctD1Xvtg1eC',
        last_message_is_read: true,
        thread_id:
          'exploration.JctD1Xvtg1eC.WzE1OTIyMjMzMDM3ODMuMTldWzEyOTk3XQ==',
        author_last_message: 'nishantwrp',
        last_updated_msecs: 1592223304062.665,
        last_message_text: '',
        original_author_id: 'uid_oijrdjajpkgegqmqqttxsxbbiobexugg',
        exploration_title: 'What is a negative number?',
        second_last_message_is_read: false,
        total_message_count: 1
      }
    ],
    completed_collections_list: [{
      status: 'public',
      thumbnail_bg_color: '#d68453',
      community_owned: false,
      created_on: 1558593739415.726,
      thumbnail_icon_url: '/subjects/Arithmetic.svg',
      language_code: 'en',
      id: 'GdYIgsfRZwG7',
      category: 'Arithmetic',
      title: 'Negative Numbers',
      last_updated_msec: 1558593926486.329,
      objective: 'Learn what negative numbers are, and how to use them.',
      node_count: 5
    }],
    collection_playlist: [{
      status: 'public',
      thumbnail_bg_color: '#d68453',
      community_owned: false,
      created_on: 1558593739415.726,
      thumbnail_icon_url: '/subjects/Arithmetic.svg',
      language_code: 'en',
      id: 'GdYIgsfRZwG7',
      category: 'Arithmetic',
      title: 'Negative Numbers',
      last_updated_msec: 1558593926486.329,
      objective: 'Learn what negative numbers are, and how to use them.',
      node_count: 5
    }],
    incomplete_collections_list: [{
      status: 'public',
      thumbnail_bg_color: '#d68453',
      community_owned: false,
      created_on: 1491118537846.88,
      thumbnail_icon_url: '/subjects/Arithmetic.svg',
      language_code: 'en',
      id: '4UgTQUc1tala',
      category: 'Arithmetic',
      title: 'Fractions',
      last_updated_msec: 1527227142150.33,
      objective:
        'Learn the basics of fractions with Matthew as he explores a bakery.',
      node_count: 12
    }],
    number_of_nonexistent_activities: {
      completed_collections: 0,
      incomplete_collections: 0,
      collection_playlist: 0,
      incomplete_explorations: 0,
      exploration_playlist: 0,
      completed_explorations: 0
    },
    completed_explorations_list: [{
      category: 'Welcome',
      created_on_msec: 1564183471833.675,
      community_owned: true,
      thumbnail_bg_color: '#992a2b',
      title: 'Welcome to Oppia!',
      num_views: 14897,
      tags: [],
      last_updated_msec: 1571653541705.924,
      human_readable_contributors_summary: {},
      status: 'public',
      language_code: 'en',
      objective: "become familiar with Oppia's capabilities",
      thumbnail_icon_url: '/subjects/Welcome.svg',
      ratings: {
        1: 1,
        2: 1,
        3: 3,
        4: 24,
        5: 46
      },
      id: '0',
      activity_type: 'exploration'
    }],
    subscription_list: [{
      creator_username: 'user',
      creator_impact: 0,
      creator_picture_data_url: 'path/to/img'
    }],
    user_email: 'user@example.com',
    completed_to_incomplete_collections: []
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
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      learnerDashboardBackendApiService.fetchLearnerDashboardData()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it(
    'should use rejection handler if learner dashboard data ' +
    'backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      learnerDashboardBackendApiService.fetchLearnerDashboardData()
        .then(successHandler, (error: HttpErrorResponse) => {
          // This is done because the error callback gets called with an
          // HttpErrorResponse object, not with the error message. The following
          // line extracts the error message and calls the failHandler with the
          // error message as the parameter.
          failHandler(error.error);
        });

      var req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading dashboard data.', {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading dashboard data.');
    }));
});
