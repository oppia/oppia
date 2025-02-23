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
 * @fileoverview Unit tests for LearnerGroupSyllabusBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {LearnerGroupSyllabusBackendApiService} from './learner-group-syllabus-backend-api.service';
import {LearnerGroupSyllabus} from './learner-group-syllabus.model';
import {LearnerGroupUserProgress} from './learner-group-user-progress.model';

describe('Learner Group Syllabus Backend API Service', () => {
  var learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService;
  let httpTestingController: HttpTestingController;

  const sampleLearnerGroupSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'parentTopicId',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5,
  };

  const nodeDict = {
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
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };

  const sampleStorySummaryBackendDict = {
    id: 'sample_story_id',
    title: 'Story title',
    node_titles: ['Chapter 1', 'Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    description: 'Description',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-url-fragment',
    all_node_dicts: [nodeDict],
    topic_name: 'Topic one',
    topic_url_fragment: 'topic-one',
    classroom_url_fragment: 'math',
  };

  let sampleLearnerGroupSyllabusDict = {
    learner_group_id: 'groupId',
    story_summary_dicts: [sampleStorySummaryBackendDict],
    subtopic_summary_dicts: [sampleLearnerGroupSubtopicSummaryDict],
  };

  const SEARCH_NEW_SYLLABUS_URL = '/learner_group_search_syllabus_handler';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerGroupSyllabusBackendApiService],
    });
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService
    );

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch learner groups data to be shown', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const syllabusFilter = {
      keyword: 'Place',
      type: 'All',
      category: 'All',
      languageCode: 'en',
      learnerGroupId: 'groupId',
    };

    learnerGroupSyllabusBackendApiService
      .searchNewSyllabusItemsAsync(syllabusFilter)
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      SEARCH_NEW_SYLLABUS_URL +
        '?search_keyword=Place&search_type=All' +
        '&search_category=All&search_language_code=en&learner_group_id=groupId'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleLearnerGroupSyllabusDict);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch learner group syllabus to be shown', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_SYLLABUS_URL =
      '/learner_group_syllabus_handler/groupId';

    learnerGroupSyllabusBackendApiService
      .fetchLearnerGroupSyllabus('groupId')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(LEARNER_GROUP_SYLLABUS_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleLearnerGroupSyllabusDict);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      LearnerGroupSyllabus.createFromBackendDict(sampleLearnerGroupSyllabusDict)
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch learners progress in assigned syllabus', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_LEARNERS_PROGRESS_URL =
      '/learner_group_user_progress_handler/groupId';

    const learnerProgressDicts = [
      {
        username: 'user1',
        progress_sharing_is_turned_on: true,
        stories_progress: [sampleStorySummaryBackendDict],
        subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict],
      },
    ];

    learnerGroupSyllabusBackendApiService
      .fetchLearnersProgressInAssignedSyllabus('groupId', ['user1'])
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      LEARNER_GROUP_LEARNERS_PROGRESS_URL +
        '?learner_usernames=%5B%22user1%22%5D'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(learnerProgressDicts);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      learnerProgressDicts.map(progressInfoDict =>
        LearnerGroupUserProgress.createFromBackendDict(progressInfoDict)
      )
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should successfully fetch learner specific progress in assigned ' +
      'syllabus',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const LEARNER_GROUP_LEARNER_SPECIFIC_PROGRESS_URL =
        '/learner_group_learner_specific_progress_handler/groupId';

      const learnerProgressDict = {
        username: 'user1',
        progress_sharing_is_turned_on: true,
        stories_progress: [sampleStorySummaryBackendDict],
        subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict],
      };

      learnerGroupSyllabusBackendApiService
        .fetchLearnerSpecificProgressInAssignedSyllabus('groupId')
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        LEARNER_GROUP_LEARNER_SPECIFIC_PROGRESS_URL
      );
      expect(req.request.method).toEqual('GET');
      req.flush(learnerProgressDict);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        LearnerGroupUserProgress.createFromBackendDict(learnerProgressDict)
      );
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
