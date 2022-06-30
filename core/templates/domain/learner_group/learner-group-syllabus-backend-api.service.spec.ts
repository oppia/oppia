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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerGroupSyllabusBackendApiService } from
  './learner-group-syllabus-backend-api.service';

describe('Teacher Dashboard Backend API Service', () => {
  var learnerGroupSyllabusBackendApiService:
    LearnerGroupSyllabusBackendApiService;
  let httpTestingController: HttpTestingController;

  const sampleSubtopicPageSummaryDict = {
    subtopic_id: 'subtopicId',
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'parentTopicId',
    parent_topic_name: 'Place Values',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red'
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

  const sampleStorySummaryBackendDict = {
    id: 'sample_story_id',
    title: 'Story title',
    node_titles: ['Chapter 1', 'Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    description: 'Description',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story-url-fragment',
    all_node_dicts: [nodeDict],
    topic_name: 'Place Values',
    topic_url_fragment: 'place-values',
    classroom_url_fragment: 'math'
  };

  let sampleLearnerGroupSyllabusDict = {
    learner_group_id: 'groupId',
    stories_summaries: [sampleStorySummaryBackendDict],
    subtopic_page_summaries: [sampleSubtopicPageSummaryDict]
  };

  const FILTER_SYLLABUS_URL = '/filter_learner_group_syllabus_handler';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerGroupSyllabusBackendApiService]
    });
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService);

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch learner groups data to be shown',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const syllabusFilter = {
        keyword: 'Place',
        type: 'All',
        category: 'All',
        languageCode: 'en'
      };

      learnerGroupSyllabusBackendApiService
        .fetchFilteredSyllabusItemsAsync(
          'groupId', syllabusFilter).then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        FILTER_SYLLABUS_URL + '?filter_keyword=Place&filter_type=All' +
        '&filter_category=All&filter_language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleLearnerGroupSyllabusDict);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
