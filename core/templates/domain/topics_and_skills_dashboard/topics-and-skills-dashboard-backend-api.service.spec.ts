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
import { EventEmitter } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { AssignedSkill } from 'domain/skill/assigned-skill.model';
import { AugmentedSkillSummary } from 'domain/skill/augmented-skill-summary.model';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillSummary } from 'domain/skill/skill-summary.model';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
// eslint-disable-next-line max-len
import { AssignedSkillDataBackendDict, CategorizedAndUntriagedSkillsData, CategorizedAndUntriagedSkillsDataBackendDict, SkillsDashboardData, SkillsDashboardDataBackendDict, TopicsAndSkillDashboardData, TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillsDashboardDataBackendDict } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { TopicsAndSkillsDashboardFilter } from './topics-and-skills-dashboard-filter.model';

describe('Topics and Skills Dashboard backend API service', () => {
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService;
  let httpTestingController: HttpTestingController;
  let topicAndSkillsDashboardDataBackendDict:
    TopicsAndSkillsDashboardDataBackendDict;
  let topicAndSkillsDashboardBackendResponse: TopicsAndSkillDashboardData;
  let assignedSkillDataBackendDict: AssignedSkillDataBackendDict;
  let assignedSkillDataBackendResponse: AssignedSkill;
  let skillsDashboardDataBackendDict: SkillsDashboardDataBackendDict;
  let skillsDashboardDataBackendResponse: SkillsDashboardData;
  let categorizedAndUntriagedSkillsDataBackendDict:
    CategorizedAndUntriagedSkillsDataBackendDict;
  let categorizedAndUntriagedSkillsDataBackendResponse:
    CategorizedAndUntriagedSkillsData;


  const TOPICS_AND_SKILLS_DASHBOARD_DATA_URL = (
    '/topics_and_skills_dashboard/data');
  const SKILLS_DASHBOARD_DATA_URL = '/skills_dashboard/data';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    topicsAndSkillsDashboardBackendApiService = TestBed.get(
      TopicsAndSkillsDashboardBackendApiService);
  });

  beforeEach(() => {
    topicAndSkillsDashboardDataBackendDict = {
      all_classroom_names: [
        'math'
      ],
      categorized_skills_dict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            {
              skill_id: 'BBB6dzfb5pPt',
              skill_description: 'Dummy Skill 1'
            }
          ],
          'Dummy Subtopic Title': [
            {
              skill_id: 'D1FdmljJNXdt',
              skill_description: 'Dummy Skill 2'
            }
          ]
        }
      },
      topic_summary_dicts: [
        {
          version: 1,
          url_fragment: 'empty-topic',
          language_code: 'en',
          description: 'description',
          uncategorized_skill_count: 0,
          total_published_node_count: 0,
          can_edit_topic: true,
          is_published: false,
          id: 'HLEn0XQiV9XE',
          topic_model_created_on: 1623851496406.576,
          subtopic_count: 0,
          thumbnail_bg_color: '#FFFFFF',
          canonical_story_count: 0,
          name: 'Empty Topic',
          classroom: 'math',
          total_skill_count: 0,
          additional_story_count: 0,
          topic_model_last_updated: 1623851496406.582,
          thumbnail_filename: 'thumbnail_filename',
          total_upcoming_chapters_count: 1,
          total_overdue_chapters_count: 1,
          total_chapter_counts_for_each_story: [5, 4],
          published_chapter_counts_for_each_story: [3, 4]
        },
        {
          version: 3,
          url_fragment: 'dummy-topic-one',
          language_code: 'en',
          description: 'description',
          uncategorized_skill_count: 1,
          total_published_node_count: 3,
          can_edit_topic: true,
          is_published: false,
          id: 'JS7lmbdZRoPc',
          topic_model_created_on: 1623851496107.91,
          subtopic_count: 1,
          thumbnail_bg_color: '#FFFFFF',
          canonical_story_count: 1,
          name: 'Dummy Topic 1',
          classroom: 'math',
          total_skill_count: 2,
          additional_story_count: 0,
          topic_model_last_updated: 1623851737518.369,
          thumbnail_filename: 'thumbnail_filename',
          total_upcoming_chapters_count: 1,
          total_overdue_chapters_count: 1,
          total_chapter_counts_for_each_story: [5, 4],
          published_chapter_counts_for_each_story: [3, 4]
        }
      ],
      can_delete_skill: true,
      untriaged_skill_summary_dicts: [
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 3',
          skill_model_created_on: 1623851495022.93,
          skill_model_last_updated: 1623851495022.942,
          worked_examples_count: 0,
          id: '4P77sLaU14DE',
          misconception_count: 0
        }
      ],
      total_skill_count: 3,
      can_create_topic: true,
      can_create_skill: true,
      mergeable_skill_summary_dicts: [
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 1',
          skill_model_created_on: 1623851493737.796,
          skill_model_last_updated: 1623851493737.808,
          worked_examples_count: 0,
          id: 'BBB6dzfb5pPt',
          misconception_count: 0
        },
        {
          version: 1,
          language_code: 'en',
          description: 'Dummy Skill 2',
          skill_model_created_on: 1623851494780.516,
          skill_model_last_updated: 1623851494780.529,
          worked_examples_count: 0,
          id: 'D1FdmljJNXdt',
          misconception_count: 0
        }
      ],
      can_delete_topic: true,
    };

    topicAndSkillsDashboardBackendResponse = {
      allClassroomNames: [
        'math'
      ],
      canCreateSkill: true,
      canCreateTopic: true,
      canDeleteSkill: true,
      canDeleteTopic: true,
      untriagedSkillSummaries: [
        SkillSummary.createFromBackendDict(
          topicAndSkillsDashboardDataBackendDict
            .untriaged_skill_summary_dicts[0]),
      ],
      mergeableSkillSummaries: [
        SkillSummary.createFromBackendDict(
          topicAndSkillsDashboardDataBackendDict
            .mergeable_skill_summary_dicts[0]),
        SkillSummary.createFromBackendDict(
          topicAndSkillsDashboardDataBackendDict
            .mergeable_skill_summary_dicts[1]),
      ],
      totalSkillCount: 3,
      topicSummaries: [
        CreatorTopicSummary.createFromBackendDict(
          topicAndSkillsDashboardDataBackendDict.topic_summary_dicts[0]),
        CreatorTopicSummary.createFromBackendDict(
          topicAndSkillsDashboardDataBackendDict.topic_summary_dicts[1])
      ],
      categorizedSkillsDict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            ShortSkillSummary.createFromBackendDict({
              skill_id: 'BBB6dzfb5pPt',
              skill_description: 'Dummy Skill 1'
            })
          ],
          'Dummy Subtopic Title': [
            ShortSkillSummary.createFromBackendDict({
              skill_id: 'D1FdmljJNXdt',
              skill_description: 'Dummy Skill 2'
            })
          ]
        }
      }
    };

    assignedSkillDataBackendDict = {
      topic_assignment_dicts: [{
        topic_id: 'topicId',
        topic_name: 'topicName',
        topic_version: 1,
        subtopic_id: 2
      }]
    };

    assignedSkillDataBackendResponse = AssignedSkill.createFromBackendDict(
      assignedSkillDataBackendDict.topic_assignment_dicts[0]);

    skillsDashboardDataBackendDict = {
      more: false,
      skill_summary_dicts: [
        {
          description: 'Dummy Skill 1',
          skill_model_last_updated: 1623851493737.808,
          skill_model_created_on: 1623851493737.796,
          worked_examples_count: 0,
          language_code: 'en',
          id: 'BBB6dzfb5pP',
          misconception_count: 0,
          version: 1,
          topic_names: [
            'Dummy Topic 1'
          ],
          classroom_names: [
            'classroom'
          ]
        }
      ],
      next_cursor: 'next'
    };

    skillsDashboardDataBackendResponse = {
      skillSummaries: [
        AugmentedSkillSummary.createFromBackendDict(
          skillsDashboardDataBackendDict.skill_summary_dicts[0])],
      nextCursor: skillsDashboardDataBackendDict.next_cursor,
      more: skillsDashboardDataBackendDict.more
    };

    categorizedAndUntriagedSkillsDataBackendDict = {
      untriaged_skill_summary_dicts: [
        {
          skill_description: 'Dummy Skill 3',
          skill_id: '4P77sLaU14DE',
        }
      ],
      categorized_skills_dict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            {
              skill_id: 'BBB6dzfb5pPt',
              skill_description: 'Dummy Skill 1'
            }
          ],
          'Dummy Subtopic Title': [
            {
              skill_id: 'D1FdmljJNXdt',
              skill_description: 'Dummy Skill 2'
            }
          ]
        }
      }
    };

    categorizedAndUntriagedSkillsDataBackendResponse = {
      untriagedSkillSummaries: [
        ShortSkillSummary.createFromBackendDict(
          categorizedAndUntriagedSkillsDataBackendDict
            .untriaged_skill_summary_dicts[0]),
      ],
      categorizedSkillsDict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            ShortSkillSummary.createFromBackendDict({
              skill_id: 'BBB6dzfb5pPt',
              skill_description: 'Dummy Skill 1'
            })
          ],
          'Dummy Subtopic Title': [
            ShortSkillSummary.createFromBackendDict({
              skill_id: 'D1FdmljJNXdt',
              skill_description: 'Dummy Skill 2'
            })
          ]
        }
      }
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch topic and skills dashboard ' +
    'data from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      TOPICS_AND_SKILLS_DASHBOARD_DATA_URL);

    expect(req.request.method).toEqual('GET');
    req.flush(topicAndSkillsDashboardDataBackendDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      topicAndSkillsDashboardBackendResponse);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to fetch topic and skills dashboard data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        TOPICS_AND_SKILLS_DASHBOARD_DATA_URL);

      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Failed to fetch dashboard data.'
      }, {
        status: 500, statusText: 'Internal Server Error.'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        new Error('Failed to fetch dashboard data.'));
    })
  );

  it('should successfully fetch skills dashboard data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let filter = TopicsAndSkillsDashboardFilter.createDefault();

      topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
        filter, 0, 'next').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(SKILLS_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('POST');

      req.flush(skillsDashboardDataBackendDict);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        skillsDashboardDataBackendResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch skills dashboard data from backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let filter = TopicsAndSkillsDashboardFilter.createDefault();

      topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
        filter, 0, 'next').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(SKILLS_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Error loading skills dashboard data.'
      }, {
        status: 500, statusText: 'Internal Server Error.'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        new Error('Error loading skills dashboard data.'));
    })
  );

  it('should successfully fetch topic id to diagnostic test skill ids from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let topicIds = ['topicID1'];

    topicsAndSkillsDashboardBackendApiService
      .fetchTopicIdToDiagnosticTestSkillIdsAsync(
        topicIds).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      'topic_id_to_diagnostic_test_skill_ids_handler/' +
      '?comma_separated_topic_ids=topicID1'
    );
    expect(req.request.method).toEqual('GET');


    const backendResponse = {
      topic_id_to_diagnostic_test_skill_ids: {
        topicID1: ['skillID1']
      }
    };

    req.flush(backendResponse);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalledWith();
  }));

  it('should fail to fetch topic id to diagnostic test skill ids from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let topicIds = ['topicID1'];

    topicsAndSkillsDashboardBackendApiService
      .fetchTopicIdToDiagnosticTestSkillIdsAsync(
        topicIds).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      'topic_id_to_diagnostic_test_skill_ids_handler/?' +
      'comma_separated_topic_ids=topicID1'
    );
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'Error loading topic id to diagnostic test skill ids.'
    }, {
      status: 500, statusText: 'Internal Server Error.'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error loading topic id to diagnostic test skill ids.');
  }));

  it('should successfully fetch assigned skills data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService
        .fetchTopicAssignmentsForSkillAsync(
          'skillId'
        ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/topics_and_skills_dashboard/unassign_skill/skillId');
      expect(req.request.method).toEqual('GET');
      req.flush(assignedSkillDataBackendDict);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        [assignedSkillDataBackendResponse]);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch assigned skills data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService
        .fetchTopicAssignmentsForSkillAsync(
          'invalidId'
        ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/topics_and_skills_dashboard/unassign_skill/invalidId');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading assigned skill data.'
      }, {
        status: 500, statusText: 'Internal Server Error.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        new Error('Error loading assigned skill data.'));
    })
  );

  it('should successfully merge skills given their ' +
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
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Skill Id does not exist.'));
  })
  );

  it('should get topic and skills dashboard event emitter when ' +
    're-initialized', () => {
    let mockEventEmitter = new EventEmitter();
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized)
      .toEqual(mockEventEmitter);
  });

  it('should successfully fetch categorized and untriaged skills ' +
  'data from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService
      .fetchCategorizedAndUntriagedSkillsDataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topics_and_skills_dashboard/categorized_and_untriaged_skills_data');

    expect(req.request.method).toEqual('GET');
    req.flush(categorizedAndUntriagedSkillsDataBackendDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      categorizedAndUntriagedSkillsDataBackendResponse);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to fetch categorized and untriaged skills data ' +
  'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicsAndSkillsDashboardBackendApiService
      .fetchCategorizedAndUntriagedSkillsDataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topics_and_skills_dashboard/categorized_and_untriaged_skills_data');

    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to categorized and untriaged skills data.'
    }, {
      status: 500, statusText: 'Internal Server Error.'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Failed to categorized and untriaged skills data.'));
  }));
});
