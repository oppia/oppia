// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerDashboardBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-backend-api.service';

describe('Learner Dashboard Backend API Service', () => {
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController;

  let sampleDataResults = {
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

  let LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data';
  let ERROR_STATUS_CODE = 400;

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

  it('should successfully fetch learner dashboard data from the' +
    ' backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService.fetchLearnerDashboardDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should use rejection handler if learner dashboard data' +
    ' backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService.fetchLearnerDashboardDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(LEARNER_DASHBOARD_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Error loading dashboard data.'
    }, {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(400);
  }
  ));

  it('should add current message to the feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let updated_status = null;
    let updated_subject = null;
    let text = 'Sending message';
    let url = '/threadhandler/exploration.4.Wfafsafd';
    let payload = {
      updated_status: updated_status,
      updated_subject: updated_subject,
      text: text
    };

    learnerDashboardBackendApiService.addNewMessageAsync(
      url, payload
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/threadhandler/exploration.4.Wfafsafd');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to add current message to the feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let updated_status = null;
    let updated_subject = null;
    let text = 'Sending message';
    let invalidUrl = '/invalidUrl';
    let payload = {
      updated_status: updated_status,
      updated_subject: updated_subject,
      text: text
    };
    learnerDashboardBackendApiService.addNewMessageAsync(
      invalidUrl, payload
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/invalidUrl');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { error: 'Given URL is invalid.'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Given URL is invalid.');
  }
  ));

  it('should get the data of current feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let url = '/threadhandler/exploration.4.Wfafsafd';
    let result = [{
        author_picture_data_url:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYA",
        author_username: "User",
        created_on_msecs: 1617712024611.706,
        message_id: 1,
        text: "test",
        updated_status: null
    }];

    learnerDashboardBackendApiService.onClickThreadAsync(
      url
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/threadhandler/exploration.4.Wfafsafd');
    expect(req.request.method).toEqual('GET');

    req.flush(
      {
      message_summary_list: [{
        author_picture_data_url:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYA",
        author_username: "User",
        created_on_msecs: 1617712024611.706,
        message_id: 1,
        text: "test",
        updated_status: null
      }]
    },
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of current feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let invalidUrl = '/invalidUrl';
    learnerDashboardBackendApiService.onClickThreadAsync(
      invalidUrl
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/invalidUrl');
    expect(req.request.method).toEqual('GET');

    req.flush(
      { error: 'Given URL is invalid.'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Given URL is invalid.');
  }
  ));
});
