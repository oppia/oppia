// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the License);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an AS-IS BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for Topics and skills dashboard.
 */


import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { TopicsAndSkillDashboardData, TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillsDashboardDataBackendDict } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { TopicsAndSkillsDashboardFilter } from './topics-and-skills-dashboard-filter.model';

fdescribe('Topics and Skills Dashboard backend API service', () => {
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController = null;

  const SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';
  const TOPICS_AND_SKILLS_DASHBOARD_DATA_URL = (
    '/topics_and_skills_dashboard/data');
  const SKILLS_DASHBOARD_DATA_URL = '/skills_dashboard/data';
  const ASSIGNED_SKILL_DATA_URL = '/topics_and_skills_dashboard/<skill_id>';
  let topicAndSkillsDashboardData = {
    allClassroomNames: [
      'math'
    ],
    canCreateSkill: true,
    canCreateTopic: true,
    canDeleteSkill: true,
    canDeleteTopic: true,
    untriagedSkillSummaries: [],
    mergeableSkillSummaries: [
      {
        id: '7XD5CBnPnzoe',
        description: 'Dummy Skill 1',
        languageCode: 'en',
        version: 1,
        misconceptionCount: 0,
        workedExamplesCount: 0,
        skillModelCreatedOn: 1623777995724.992,
        skillModelLastUpdated: 1623777995724.996
      },
      {
        id: 'lwNpNCc6hUoI',
        description: 'Dummy Skill 3',
        languageCode: 'en',
        version: 1,
        misconceptionCount: 0,
        workedExamplesCount: 0,
        skillModelCreatedOn: 1623777996062.236,
        skillModelLastUpdated: 1623777996062.24
      },
      {
        id: 'wbLPx2ilCGrk',
        description: 'Dummy Skill 2',
        languageCode: 'en',
        version: 1,
        misconceptionCount: 0,
        workedExamplesCount: 0,
        skillModelCreatedOn: 1623777995991.313,
        skillModelLastUpdated: 1623777995991.316
      }
    ],
    totalSkillCount: 3,
    topicSummaries: [
      {
        id: '1hn97zvLuxOd',
        name: 'Empty Topic',
        canonicalStoryCount: 0,
        subtopicCount: 0,
        totalSkillCount: 0,
        totalPublishedNodeCount: 0,
        uncategorizedSkillCount: 0,
        languageCode: 'en',
        description: 'description',
        version: 1,
        additionalStoryCount: 0,
        topicModelCreatedOn: 1623777996656.602,
        topicModelLastUpdated: 1623777996656.609,
        canEditTopic: true,
        isPublished: false,
        classroom: null,
        thumbnailFilename: null,
        thumbnailBgColor: null,
        urlFragment: 'empty-topic'
      },
      {
        id: 'I7SdwO75o0z4',
        name: 'Dummy Topic 1',
        canonicalStoryCount: 1,
        subtopicCount: 1,
        totalSkillCount: 3,
        totalPublishedNodeCount: 3,
        uncategorizedSkillCount: 1,
        languageCode: 'en',
        description: 'description',
        version: 2,
        additionalStoryCount: 0,
        topicModelCreatedOn: 1623777996534.901,
        topicModelLastUpdated: 1623777996907.756,
        canEditTopic: true,
        isPublished: false,
        classroom: null,
        thumbnailFilename: null,
        thumbnailBgColor: null,
        urlFragment: 'dummy-topic-one'
      }
    ],
    categorizedSkillsDict: {
      'Dummy Topic 1': {
        uncategorized: [
          {
            id: '7XD5CBnPnzoe',
            description: 'Dummy Skill 1'
          }
        ],
        'Dummy Subtopic Title': [
          {
            id: 'wbLPx2ilCGrk',
            description: 'Dummy Skill 2'
          },
          {
            id: 'lwNpNCc6hUoI',
            description: 'Dummy Skill 3'
          }
        ]
      },
      'Empty Topic': {
        uncategorized: []
      }
    }
  };;
  let topicAndSkillsDashboardBackendResponse = {
    categorized_skills_dict: {
      'Empty Topic': {
        uncategorized: []
      },
      'Dummy Topic 1': {
        uncategorized: [
          {
            skill_description: 'Dummy Skill 1',
            'skill_id': '7XD5CBnPnzoe'
          }
        ],
        'Dummy Subtopic Title': [
          {
            skill_description: 'Dummy Skill 2',
            skill_id: 'wbLPx2ilCGrk'
          },
          {
            skill_description: 'Dummy Skill 3,=',
            skill_id: 'lwNpNCc6hUoI'
          }
        ]
      }
    },
    untriaged_skill_summary_dicts: [],
    mergeable_skill_summary_dicts: [
      {
        id: '7XD5CBnPnzoe',
        misconception_count: 0,
        skill_model_created_on: 1623777995724.992,
        version: 1,
        worked_examples_count: 0,
        skill_model_last_updated: 1623777995724.996,
        language_code: 'en',
        description: 'Dummy Skill 1'
      },
      {
        id: 'lwNpNCc6hUoI',
        misconception_count: 0,
        skill_model_created_on: 1623777996062.236,
        version: 1,
        worked_examples_count: 0,
        skill_model_last_updated: 1623777996062.24,
        language_code: 'en',
        description:' Dummy Skill 3'
      },
      {
        id: 'wbLPx2ilCGrk',
        misconception_count: 0,
        skill_model_created_on: 1623777995991.313,
        version: 1,
        worked_examples_count: 0,
        skill_model_last_updated: 1623777995991.316,
        language_code: 'en',
        description: 'Dummy Skill 2'
      }
    ],
    can_create_skill: true,
    all_classroom_names: [
      'math'
    ],
    can_delete_skill: true,
    can_delete_topic: true,
    total_skill_count: 3,
    topic_summary_dicts: [
      {
        is_published: false,
        id: 'hn97zvLuxOd',
        thumbnail_bg_color: null,
        version: 1,
        topic_model_created_on: 1623777996656.602,
        language_code: 'en',
        url_fragment: 'empty-topic',
        classroom: null,
        topic_model_last_updated: 1623777996656.609,
        name: 'Empty Topic',
        additional_story_count: 0,
        subtopic_count: 0,
        uncategorized_skill_count: 0,
        can_edit_topic: true,
        thumbnail_filename: null,
        description: 'description',
        total_skill_count: 0,
        total_published_node_count: 0,
        canonical_story_count: 0
      },
      {
        is_published: false,
        id: 'I7SdwO75o0z4',
        thumbnail_bg_color: null,
        version: 2,
        topic_model_created_on: 1623777996534.901,
        language_code: 'en',
        url_fragment: 'dummy-topic-one',
        classroom: null,
        topic_model_last_updated: 1623777996907.756,
        name: 'Dummy Topic 1',
        additional_story_count: 0,
        subtopic_count: 1,
        uncategorized_skill_count: 1,
        can_edit_topic: true,
        thumbnail_filename: null,
        description: 'description',
        total_skill_count: 3,
        total_published_node_count: 3,
        canonical_story_count: 1
      }
    ],
    can_create_topic: true
  };

  let filter: TopicsAndSkillsDashboardFilter = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    topicsAndSkillsDashboardBackendApiService = TestBed.get(
      TopicsAndSkillsDashboardBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  fit('should successfully fetch dashboard data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
        'Error Loading dashboard data.');

      expect(req.request.method).toEqual('GET');
      req.flush(topicAndSkillsDashboardBackendResponse);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        topicAndSkillsDashboardData);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch dashboard data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
        'Error Loading dashboard data.');

      expect(req.request.method).toEqual('GET');
      req.flush(topicAndSkillsDashboardData);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        topicAndSkillsDashboardData);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );


  it('should successfully fetch skills dashboard data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
        null, 0, null).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(SKILLS_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('POST');
      req.flush({});
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully fetch assigned skills data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService
        .fetchTopicAssignmentsForSkillAsync(
          'skillId1'
        ).then(successHandler, failHandler);
      let req = httpTestingController.expectOne(ASSIGNED_SKILL_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush({});
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use fail handler if fetching assigned skills data failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
        null, 0, null).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(ASSIGNED_SKILL_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading assigned skill data.', {
        status: 500
      });
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading assigned skill data.');
    })
  );

  it('should use fail handler if skills dashboard data failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
        null, 0, null).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        SKILLS_DASHBOARD_DATA_URL, 'Error loading dashboard data.');
      expect(req.request.method).toEqual('POST');
      req.flush('Error loading skills data.', {
        status: 500
      });
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully fetch topics and skills dashboard data from the ' +
    'backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync().then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      TOPICS_AND_SKILLS_DASHBOARD_DATA_URL);
    expect(req.request.method).toEqual('GET');
    req.flush('');
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should successfully merge skills given their '+
    'skill Id\'s', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService.mergeSkillsAsync(
      'oldSkilldId', 'newSkillId').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/merge_skills_handler');
    expect(req.request.method).toEqual('POST');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should fail to merge skills given their skill Id\'s', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService.mergeSkillsAsync(
      'invalidId1', 'invalidId2').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/merge_skills_handler');
    expect(req.request.method).toEqual('POST');

    req.flush({
      error: 'Skill Id does not exist.'
    }, {
      status: 500, statusText: 'Skill Id does not exist'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  })
  );
});
