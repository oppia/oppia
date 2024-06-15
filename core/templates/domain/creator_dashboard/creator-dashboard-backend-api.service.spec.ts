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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {CreatorDashboardBackendApiService} from 'domain/creator_dashboard/creator-dashboard-backend-api.service';

describe('Creator Dashboard backend API service', () => {
  let creatorDashboardBackendApiService: CreatorDashboardBackendApiService;
  let httpTestingController: HttpTestingController;

  var sampleDataResults = {
    suggestions_to_review_list: [
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: 'exp1',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: 'exp2',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0,
      },
    ],
    explorations_list: [
      {
        human_readable_contributors_summary: {
          username: {
            num_commits: 3,
          },
        },
        category: 'Algebra',
        community_owned: false,
        tags: [],
        title: 'Testing Exploration',
        created_on_msec: 1593786508029.501,
        num_total_threads: 0,
        num_views: 1,
        last_updated_msec: 1593786607552.753,
        status: 'public',
        num_open_threads: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        objective: 'To test exploration recommendations',
        id: 'hi27Jix1QGbT',
        thumbnail_bg_color: '#cc4b00',
        activity_type: 'exploration',
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      },
    ],
    is_topic_manager: false,
    dashboard_stats: {
      average_ratings: null,
      num_ratings: 0,
      total_open_feedback: 0,
      total_plays: 1,
    },
    subscribers_list: [
      {
        subscriber_username: 'username',
        subscriber_impact: 0,
      },
    ],
    collections_list: [
      {
        last_updated: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on: 1591296635736.666,
        status: 'public',
        category: 'Algebra',
        title: 'Test Title',
        node_count: 0,
      },
    ],
    created_suggestions_list: [
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: 'exp1',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: 'exp2',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change_cmd: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0,
      },
    ],
    display_preference: 'card',
    last_week_stats: null,
    threads_for_suggestions_to_review_list: [
      {
        status: '',
        subject: '',
        summary: '',
        original_author_username: '',
        last_updated_msecs: 0,
        message_count: '',
        thread_id: 'exp1',
        last_nonempty_message_author: '',
        last_nonempty_message_text: '',
      },
    ],
    threads_for_created_suggestions_list: [
      {
        status: '',
        subject: '',
        summary: '',
        original_author_username: '',
        last_updated_msecs: 0,
        message_count: '',
        thread_id: 'exp1',
        last_nonempty_message_author: '',
        last_nonempty_message_text: '',
      },
    ],
    topic_summary_dicts: [
      {
        id: 'sample_topic_id',
        name: 'Topic Name',
        subtopic_count: 5,
        canonical_story_count: 4,
        total_skill_count: 10,
        uncategorized_skill_count: 3,
        language_code: 'en',
        description: 'description',
        version: 1,
        additional_story_count: 0,
        topic_model_created_on: 231241343,
        topic_model_last_updated: 3454354354,
      },
    ],
  };

  var CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CreatorDashboardBackendApiService],
    });
    creatorDashboardBackendApiService = TestBed.get(
      CreatorDashboardBackendApiService
    );

    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an creator dashboard data from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    creatorDashboardBackendApiService
      .fetchDashboardDataAsync()
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(CREATOR_DASHBOARD_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if dashboard data backend request failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    creatorDashboardBackendApiService
      .fetchDashboardDataAsync()
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(CREATOR_DASHBOARD_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading dashboard data.', {
      status: ERROR_STATUS_CODE,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully post exploration view to given view', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var newView = 'list';
    creatorDashboardBackendApiService
      .postExplorationViewAsync(newView)
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne('/creatordashboardhandler/data');
    expect(req.request.method).toEqual('POST');
    req.flush('Success');

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
