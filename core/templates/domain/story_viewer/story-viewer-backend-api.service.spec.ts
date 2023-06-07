// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StoryViewerBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import {LearnerExplorationSummary} from
  'domain/summary/learner-exploration-summary.model';
import { StoryPlaythrough } from
  'domain/story_viewer/story-playthrough.model';
import { StoryDataDict, StoryViewerBackendApiService } from
  'domain/story_viewer/story-viewer-backend-api.service';
import { ChapterProgressSummary } from
  'domain/exploration/chapter-progress-summary.model';

describe('Story viewer backend API service', () => {
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    storyViewerBackendApiService = TestBed.get(StoryViewerBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing story from the backend',
    fakeAsync(() => {
      let sampleDataResults = {
        story_id: 'qwerty',
        story_title: 'Story title',
        story_description: 'Story description',
        story_nodes: [],
        topic_name: 'Topic name',
        meta_tag_content: 'Story meta tag content'
      };

      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      storyViewerBackendApiService.fetchStoryDataAsync(
        'abbrev', 'staging', '0').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/story_data_handler/staging/abbrev/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        StoryPlaythrough.createFromBackendDict(
          sampleDataResults));
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should handle errorCallback for fetching an existing story',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      storyViewerBackendApiService.fetchStoryDataAsync(
        'abbrev', 'staging', '0').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/story_data_handler/staging/abbrev/0');
      expect(req.request.method).toEqual('GET');
      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully record a chapter as completed from the backend',
    fakeAsync(() => {
      let sampleDataResults = {
        summaries: [{
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title'
        }],
        next_node_id: 'node_2',
        ready_for_review_test: true,
      };

      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      storyViewerBackendApiService.recordChapterCompletionAsync(
        'abbrev', 'staging', '0', 'node_1').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/story_progress_handler/staging/abbrev/0/node_1');
      expect(req.request.method).toEqual('POST');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        summaries: sampleDataResults.summaries.map(
          expSummary => LearnerExplorationSummary.createFromBackendDict(
            expSummary)),
        nextNodeId: sampleDataResults.next_node_id,
        readyForReviewTest: sampleDataResults.ready_for_review_test});
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should handle errorCallback for recording a chapter as completed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      storyViewerBackendApiService.recordChapterCompletionAsync(
        'abbrev', 'staging', '0', 'node_1').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/story_progress_handler/staging/abbrev/0/node_1');
      expect(req.request.method).toEqual('POST');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should emit the story data event correctly', function() {
    let storyDataEventEmitter = new EventEmitter<StoryDataDict>();
    expect(storyViewerBackendApiService.onSendStoryData).toEqual(
      storyDataEventEmitter);
  });

  it('should successfully fetch learners progress in stories chapters',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const CHAPTERS_PROGRESS_SUMMARY_URL = (
        '/user_progress_in_stories_chapters_handler/user1');

      const chapterProgressSummaryDicts = [
        {
          total_checkpoints_count: 6,
          visited_checkpoints_count: 5
        },
        {
          total_checkpoints_count: 3,
          visited_checkpoints_count: 0
        },
        {
          total_checkpoints_count: 4,
          visited_checkpoints_count: 4
        },
      ];

      storyViewerBackendApiService
        .fetchProgressInStoriesChapters('user1', ['story_id_1', 'story_id_2'])
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        CHAPTERS_PROGRESS_SUMMARY_URL +
        '?story_ids=%5B%22story_id_1%22,%22story_id_2%22%5D');
      expect(req.request.method).toEqual('GET');
      req.flush(chapterProgressSummaryDicts);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        chapterProgressSummaryDicts.map(
          progressInfoDict => ChapterProgressSummary.createFromBackendDict(
            progressInfoDict)
        ));
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
