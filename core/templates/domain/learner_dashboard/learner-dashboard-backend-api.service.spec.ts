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

import { AddMessagePayload, LearnerDashboardBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';

describe('Learner Dashboard Backend API Service', () => {
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService;
  let httpTestingController: HttpTestingController;

  let nodeDict = {
    id: 'node_1',
    thumbnail_filename: 'image.png',
    title: 'Title 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: null,
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40'
  };
  let subtopic = {
    skill_ids: ['skill_id_2'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name'
  };

  const sampleTopicsAndStoriesDataResults = {
    completed_stories_list: [{
      id: 'sample_story_id',
      title: 'Story title',
      node_titles: ['Chapter 1', 'Chapter 2'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Description',
      story_is_published: true,
      completed_node_titles: ['Chapter 1', 'Chapter 2'],
      url_fragment: 'story-url-fragment',
      all_node_dicts: [nodeDict]
    }],
    learnt_topics_list: [{
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    partially_learnt_topics_list: [{
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    topics_to_learn_list: [{
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    all_topics_list: [{
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    untracked_topics_list: [{
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    topics_to_learn: [{
      id: 'fyuy4GrevTqJ',
      name: 'Sample Name',
      classroom: 'Math',
      language_code: 'en',
      version: 1,
      canonical_story_count: 3,
      additional_story_count: 0,
      uncategorized_skill_count: 1,
      subtopic_count: 1,
      topic_model_created_on: 1466178691847.67,
      topic_model_last_updated: 1466178759209.839,
      description: 'description',
      total_skill_count: 2,
      total_published_node_count: 3,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      url_fragment: 'sample-name',
      subtopics: [{
        skill_ids: ['skill_id_2'],
        id: 1,
        title: 'subtopic_name',
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        url_fragment: 'subtopic-name'
      }],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    }],
    number_of_nonexistent_topics_and_stories: {
      incomplete_stories: 0,
      learnt_topics: 0,
      partially_learnt_topics: 0,
      topics_to_learn: 0
    },
    user_email: 'user@example.com',
    completed_to_incomplete_stories: [],
    learnt_to_partially_learnt_topics: []
  };


  const sampleCollectionsDataResults = {
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
    number_of_nonexistent_collections: {
      completed_collections: 0,
      incomplete_collections: 0,
      collection_playlist: 0,
    },
    user_email: 'user@example.com',
    completed_to_incomplete_collections: [],
  };


  const sampleFeedbackUpdatesDataResults = {
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
    ]
  };

  const sampleExplorationDataResults = {
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
    number_of_nonexistent_explorations: {
      incomplete_explorations: 0,
      exploration_playlist: 0,
      completed_explorations: 0,
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
    user_email: 'user@example.com'
  };

  const sampleCompletedChaptersCountDataResults = {
    completed_chapters_count: 5,
  };

  const sampleSubtopicMastery = {
    topic_id: {
      1: 0
    }
  };

  const LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL = (
    '/learnerdashboardtopicsandstoriesprogresshandler/data');
  const LEARNER_DASHBOARD_COLLECTION_DATA_URL = (
    '/learnerdashboardcollectionsprogresshandler/data');
  const LEARNER_DASHBOARD_EXPLORATION_DATA_URL = (
    '/learnerdashboardexplorationsprogresshandler/data');
  const LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL = (
    '/learnerdashboardfeedbackupdateshandler/data');
  const LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL = (
    '/learnercompletedchapterscounthandler/data');
  const ERROR_STATUS_CODE = 400;

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

  it('should successfully fetch learner dashboard topics and stories data ' +
    'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardTopicsAndStoriesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleTopicsAndStoriesDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should successfully fetch learner dashboard collections data ' +
    'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardCollectionsDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_COLLECTION_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleCollectionsDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should successfully fetch learner dashboard explorations data ' +
    'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardExplorationsDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_EXPLORATION_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleExplorationDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should successfully fetch learner dashboard feedback updates data ' +
    'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardFeedbackUpdatesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL);
    expect(req.request.method).toEqual('POST');
    req.flush(sampleFeedbackUpdatesDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should successfully fetch learner\'s completed chapters count data',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      learnerDashboardBackendApiService
        .fetchLearnerCompletedChaptersCountDataAsync()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleCompletedChaptersCountDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should successfully fetch subtopic mastery data from the' +
    ' backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    var topicIds = ['topic_id1', 'topic_id2'];

    learnerDashboardBackendApiService.fetchSubtopicMastery(topicIds)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/subtopic_mastery_handler/data?' +
      'selected_topic_ids=' + encodeURI(JSON.stringify(topicIds)));
    expect(req.request.method).toEqual('GET');
    req.flush(sampleSubtopicMastery);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should use rejection handler if subtopic mastery data' +
    ' backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    var topicIds = ['topic_id1', 'topic_id2'];

    learnerDashboardBackendApiService.fetchSubtopicMastery(topicIds)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/subtopic_mastery_handler/data?' +
      'selected_topic_ids=' + encodeURI(JSON.stringify(topicIds)));
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 400
    }, {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(400);
  }
  ));

  it('should use rejection handler if learner dashboard topics and stories ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardTopicsAndStoriesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL);
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

  it('should use rejection handler if learner dashboard collections ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardCollectionsDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_COLLECTION_DATA_URL);
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

  it('should use rejection handler if learner dashboard explorations ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardExplorationsDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_EXPLORATION_DATA_URL);
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

  it('should use rejection handler if learner dashboard feedback updates ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerDashboardFeedbackUpdatesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL);
    expect(req.request.method).toEqual('POST');
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

  it('should use rejection handler if learner completed chapters count ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerDashboardBackendApiService
      .fetchLearnerCompletedChaptersCountDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL);
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

    let updatedStatus = true;
    let updatedSubject = 'Updated Subject';
    let text = 'Sending message';
    let url = '/threadhandler/exploration.4.Wfafsafd';
    let payload: AddMessagePayload = {
      updated_status: updatedStatus,
      updated_subject: updatedSubject,
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

  it('should get untracked topics', () => {
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
    };

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40'
    };

    let sampleLearnerTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 2,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };
    let untrackedTopics = {
      math: [sampleLearnerTopicSummaryBackendDict]
    };
    expect(learnerDashboardBackendApiService.getUntrackedTopics(
      untrackedTopics)).toEqual(
      {
        math: [LearnerTopicSummary.createFromBackendDict(
          sampleLearnerTopicSummaryBackendDict)]});
  });

  it('should fail to add current message to the feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let updatedStatus = true;
    let updatedSubject = 'Updated Subject';
    let text = 'Sending message';
    let invalidUrl = '/invalidUrl';
    let payload: AddMessagePayload = {
      updated_status: updatedStatus,
      updated_subject: updatedSubject,
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
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYA',
      author_username: 'User',
      created_on_msecs: 1617712024611.706,
      message_id: 1,
      text: 'test',
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
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYA',
          author_username: 'User',
          created_on_msecs: 1617712024611.706,
          message_id: 1,
          text: 'test',
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

  it('should fetch learner groups to show on learner dashboard successfully',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      const sampleShortLearnerGroupSummaryDict1 = {
        id: 'sampleId1',
        title: 'sampleTitle',
        description: 'sampleDescription',
        facilitator_usernames: ['username1'],
        learners_count: 5
      };
      const sampleShortLearnerGroupSummaryDict2 = {
        id: 'sampleId2',
        title: 'sampleTitle 2',
        description: 'sampleDescription 2',
        facilitator_usernames: ['username1'],
        learners_count: 7
      };
      const sampleShortLearnerGroupSummary1 = (
        ShortLearnerGroupSummary.createFromBackendDict(
          sampleShortLearnerGroupSummaryDict1)
      );
      const sampleShortLearnerGroupSummary2 = (
        ShortLearnerGroupSummary.createFromBackendDict(
          sampleShortLearnerGroupSummaryDict2)
      );

      learnerDashboardBackendApiService
        .fetchLearnerDashboardLearnerGroupsAsync()
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/learner_dashboard_learner_groups_handler');
      expect(req.request.method).toEqual('GET');

      req.flush({
        learner_groups_joined: [sampleShortLearnerGroupSummaryDict1],
        invited_to_learner_groups: [sampleShortLearnerGroupSummaryDict2]
      });
      flushMicrotasks();

      const learnerDashboardLearnerGroupsData = {
        learnerGroupsJoined: [sampleShortLearnerGroupSummary1],
        invitedToLearnerGroups: [sampleShortLearnerGroupSummary2]
      };
      expect(successHandler).toHaveBeenCalledWith(
        learnerDashboardLearnerGroupsData);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
