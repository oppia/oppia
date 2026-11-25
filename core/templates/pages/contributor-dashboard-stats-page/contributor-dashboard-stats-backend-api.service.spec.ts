// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ContributorDashboardStatsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  ContributorDashboardStatsBackendApiService,
  ContributorDashboardStatsData,
} from './contributor-dashboard-stats-backend-api.service';

describe('Contributor Dashboard Stats Backend Api Service', () => {
  let statsApiService: ContributorDashboardStatsBackendApiService;
  let httpTestingController: HttpTestingController;

  const mockResponseData: ContributorDashboardStatsData = {
    topic_stats: [
      {
        topic_id: 'topic_1',
        topic_name: 'Fractions',
        total_chapters_count: 2,
        total_cards_count: 40,
        question_stats: {
          total_skills_count: 2,
          total_questions_submitted: 18,
          total_questions_reviewed: 14,
          target_questions_count: 20,
          skills_with_sufficient_questions_count: 1,
          completed_skills_count: 1,
          in_progress_skills_count: 1,
          unstarted_skills_count: 0,
          progress_percentage: 70.0,
          submission_progress_percentage: 90.0,
          is_topic_completed: false,
          skills: [
            {
              skill_id: 'skill_1',
              skill_description: 'Adding Fractions',
              submitted_questions_count: 10,
              reviewed_questions_count: 10,
              target_questions_count: 10,
              submission_percentage: 100.0,
              review_percentage: 100.0,
              status: 'Completed',
              last_activity_date: '2026-11-20',
            },
          ],
        },
        translation_stats_by_language: {
          hi: {
            language_code: 'hi',
            language_name: 'Hindi',
            translated_cards_count: 14,
            submitted_cards_count: 27,
            total_cards_count: 30,
            completed_chapters_count: 0,
            in_progress_chapters_count: 1,
            unstarted_chapters_count: 0,
            total_chapters_count: 1,
            progress_percentage: 46.7,
            submission_progress_percentage: 90.0,
            is_topic_completed: false,
            chapters: [
              {
                chapter_title: 'Chapter 1',
                content_count: 30,
                submitted_count: 27,
                reviewed_count: 14,
                submission_percentage: 90.0,
                review_percentage: 46.7,
                status: 'In-Progress',
                last_activity_date: '2026-11-20',
              },
            ],
          },
        },
        last_progress_date: '2026-11-20',
        is_stalled: false,
      },
    ],
    language_stats: [
      {
        language_code: 'hi',
        language_name: 'Hindi',
        completed_topics_count: 0,
        in_progress_topics_count: 1,
        not_started_topics_count: 0,
        total_topics_count: 1,
        total_translated_cards: 14,
        total_submitted_cards: 27,
        total_cards: 30,
        overall_progress_percentage: 46.7,
        overall_submission_percentage: 90.0,
      },
    ],
    summary_stats: {
      total_topics_count: 1,
      total_chapters_count: 2,
      total_skills_count: 2,
      total_questions_count: 14,
      total_languages_count: 1,
      fully_translated_topics_count: 0,
      near_completion_topics_count: 0,
      needs_review_count: 0,
      needs_contributor_count: 1,
    },
    supported_languages: [
      {
        language_code: 'hi',
        language_name: 'Hindi',
      },
    ],
    topic_names: ['Fractions'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContributorDashboardStatsBackendApiService],
    });

    statsApiService = TestBed.inject(
      ContributorDashboardStatsBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch contributor dashboard stats data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    statsApiService.fetchStatsDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributordashboardstatshandler/data'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(mockResponseData);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(mockResponseData);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should reject when request fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    statsApiService.fetchStatsDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/contributordashboardstatshandler/data'
    );
    expect(req.request.method).toEqual('GET');
    req.error(new ErrorEvent('Network error'));

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
